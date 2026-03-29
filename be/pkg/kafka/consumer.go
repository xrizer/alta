package kafka

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"time"
)

// MessageHandler is called for each message received from Kafka.
type MessageHandler func(value []byte) error

// Consumer reads messages from a Kafka topic using the Kafka binary protocol v0.
type Consumer struct {
	brokers []string
	topic   string
	groupID string
	offset  int64
	handler MessageHandler
}

// NewConsumer creates a new Kafka consumer.
func NewConsumer(brokers []string, topic, groupID string, handler MessageHandler) *Consumer {
	return &Consumer{
		brokers: brokers,
		topic:   topic,
		groupID: groupID,
		offset:  0,
		handler: handler,
	}
}

// Start begins consuming messages in a background loop.
// It reconnects automatically on failure.
// Cancel ctx to stop.
func (c *Consumer) Start() {
	go func() {
		for {
			if err := c.runLoop(); err != nil {
				log.Printf("[kafka] consumer error (retrying in 5s): %v", err)
				time.Sleep(5 * time.Second)
			}
		}
	}()
}

// runLoop connects to a broker and polls for messages until an error occurs.
func (c *Consumer) runLoop() error {
	broker := c.pickBroker()
	if broker == "" {
		return fmt.Errorf("no kafka brokers configured")
	}

	conn, err := net.DialTimeout("tcp", broker, 5*time.Second)
	if err != nil {
		return fmt.Errorf("connect to %s: %w", broker, err)
	}
	defer conn.Close()
	log.Printf("[kafka] consumer connected to %s (topic=%s, offset=%d)", broker, c.topic, c.offset)

	for {
		conn.SetDeadline(time.Now().Add(5 * time.Second))

		messages, err := c.fetchMessages(conn)
		if err != nil {
			return fmt.Errorf("fetch: %w", err)
		}

		for _, msg := range messages {
			if err := c.handler(msg.Value); err != nil {
				log.Printf("[kafka] handler error at offset %d: %v", msg.Offset, err)
			}
			c.offset = msg.Offset + 1
		}

		if len(messages) == 0 {
			// No new messages — wait before polling again
			time.Sleep(500 * time.Millisecond)
		}
	}
}

type kafkaMessage struct {
	Offset int64
	Value  []byte
}

// fetchMessages sends a FetchRequest and returns decoded messages.
func (c *Consumer) fetchMessages(conn net.Conn) ([]kafkaMessage, error) {
	req := c.buildFetchRequest()
	if _, err := conn.Write(req); err != nil {
		return nil, fmt.Errorf("write request: %w", err)
	}

	return c.readFetchResponse(conn)
}

// buildFetchRequest constructs a Kafka FetchRequest (ApiKey=1, ApiVersion=0).
func (c *Consumer) buildFetchRequest() []byte {
	var body bytes.Buffer
	writeInt32(&body, -1)       // replica_id = -1 (consumer)
	writeInt32(&body, 1000)     // max_wait_ms
	writeInt32(&body, 1)        // min_bytes
	writeInt32(&body, 1)        // topic array length
	writeString(&body, c.topic) // topic name
	writeInt32(&body, 1)        // partition array length
	writeInt32(&body, 0)        // partition = 0
	writeInt64(&body, c.offset) // fetch offset
	writeInt32(&body, 1048576)  // max_bytes = 1MB

	return buildRequest(1, 0, "hris-consumer", body.Bytes())
}

// readFetchResponse parses the FetchResponse and returns messages.
func (c *Consumer) readFetchResponse(conn net.Conn) ([]kafkaMessage, error) {
	var size int32
	if err := binary.Read(conn, binary.BigEndian, &size); err != nil {
		return nil, fmt.Errorf("read response size: %w", err)
	}
	if size <= 0 || size > 10<<20 {
		return nil, fmt.Errorf("invalid fetch response size: %d", size)
	}

	buf := make([]byte, size)
	if _, err := readFull(conn, buf); err != nil {
		return nil, fmt.Errorf("read response body: %w", err)
	}

	r := bytes.NewReader(buf)

	// correlation_id (skip)
	var corrID int32
	binary.Read(r, binary.BigEndian, &corrID)

	var topicCount int32
	binary.Read(r, binary.BigEndian, &topicCount)

	var result []kafkaMessage
	for i := int32(0); i < topicCount; i++ {
		readStringBuf(r) // topic name

		var partCount int32
		binary.Read(r, binary.BigEndian, &partCount)
		for j := int32(0); j < partCount; j++ {
			var partition int32
			var errCode int16
			var highWatermark int64
			var msgSetSize int32

			binary.Read(r, binary.BigEndian, &partition)
			binary.Read(r, binary.BigEndian, &errCode)
			binary.Read(r, binary.BigEndian, &highWatermark)
			binary.Read(r, binary.BigEndian, &msgSetSize)

			if errCode != 0 {
				// Skip the message set bytes and continue
				skip := make([]byte, msgSetSize)
				r.Read(skip)
				continue
			}

			if msgSetSize > 0 {
				msgSetData := make([]byte, msgSetSize)
				r.Read(msgSetData)
				msgs := parseMessageSet(msgSetData)
				result = append(result, msgs...)
			}
		}
	}
	return result, nil
}

// parseMessageSet decodes a raw MessageSet byte slice into individual messages.
// Handles partial trailing messages gracefully.
func parseMessageSet(data []byte) []kafkaMessage {
	r := bytes.NewReader(data)
	var msgs []kafkaMessage

	for r.Len() >= 12 { // minimum: offset(8) + size(4)
		var offset int64
		var msgSize int32
		binary.Read(r, binary.BigEndian, &offset)
		binary.Read(r, binary.BigEndian, &msgSize)

		if msgSize <= 0 || int(msgSize) > r.Len() {
			// Partial message at end of batch — normal for Kafka
			break
		}

		msgData := make([]byte, msgSize)
		r.Read(msgData)

		// Parse message: crc(4) + magic(1) + attributes(1) + key(bytes) + value(bytes)
		if len(msgData) < 6 {
			continue
		}
		mr := bytes.NewReader(msgData[4:]) // skip CRC

		var magic, attributes int8
		binary.Read(mr, binary.BigEndian, &magic)
		binary.Read(mr, binary.BigEndian, &attributes)

		// key
		var keyLen int32
		binary.Read(mr, binary.BigEndian, &keyLen)
		if keyLen > 0 {
			key := make([]byte, keyLen)
			mr.Read(key)
		}

		// value
		var valLen int32
		binary.Read(mr, binary.BigEndian, &valLen)
		if valLen < 0 {
			continue // null value
		}
		val := make([]byte, valLen)
		mr.Read(val)

		msgs = append(msgs, kafkaMessage{Offset: offset, Value: val})
	}
	return msgs
}

// pickBroker returns the first configured broker address.
func (c *Consumer) pickBroker() string {
	if len(c.brokers) == 0 {
		return ""
	}
	return c.brokers[0]
}

// ParseEvent decodes a raw Kafka message value into a NotificationEvent.
func ParseEvent(value []byte) (*NotificationEvent, error) {
	var event NotificationEvent
	if err := json.Unmarshal(value, &event); err != nil {
		return nil, fmt.Errorf("unmarshal event: %w", err)
	}
	return &event, nil
}
