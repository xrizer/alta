package kafka

import (
	"bytes"
	"encoding/binary"
	"fmt"
	"hash/crc32"
	"log"
	"net"
	"time"
)

// Producer sends messages to a Kafka topic using the Kafka binary protocol v0.
type Producer struct {
	brokers []string
	topic   string
}

// NewProducer creates a new Kafka producer.
func NewProducer(brokers []string, topic string) *Producer {
	return &Producer{
		brokers: brokers,
		topic:   topic,
	}
}

// Publish sends a message to the Kafka topic.
// It tries each broker until one succeeds.
func (p *Producer) Publish(value []byte) error {
	var lastErr error
	for _, broker := range p.brokers {
		if err := p.sendToBroker(broker, value); err != nil {
			log.Printf("[kafka] producer: failed to send to %s: %v", broker, err)
			lastErr = err
			continue
		}
		return nil
	}
	if lastErr != nil {
		return fmt.Errorf("all kafka brokers failed: %w", lastErr)
	}
	return fmt.Errorf("no kafka brokers configured")
}

// PublishAsync sends a message asynchronously (fire-and-forget with logged errors).
func (p *Producer) PublishAsync(value []byte) {
	go func() {
		if err := p.Publish(value); err != nil {
			log.Printf("[kafka] producer async error: %v", err)
		}
	}()
}

// sendToBroker sends a single ProduceRequest (v0) to the given broker.
func (p *Producer) sendToBroker(broker string, value []byte) error {
	conn, err := net.DialTimeout("tcp", broker, 5*time.Second)
	if err != nil {
		return fmt.Errorf("connect: %w", err)
	}
	defer conn.Close()

	conn.SetDeadline(time.Now().Add(10 * time.Second))

	req := p.buildProduceRequest(value)
	if _, err := conn.Write(req); err != nil {
		return fmt.Errorf("write request: %w", err)
	}

	return p.readProduceResponse(conn)
}

// buildProduceRequest constructs a Kafka ProduceRequest (ApiKey=0, ApiVersion=0).
func (p *Producer) buildProduceRequest(value []byte) []byte {
	// Build the message first
	msg := buildMessage(value)

	// MessageSet: offset(8) + message_size(4) + message
	var msgSet bytes.Buffer
	writeInt64(&msgSet, 0) // offset
	writeInt32(&msgSet, int32(len(msg)))
	msgSet.Write(msg)

	// Build the request body
	var body bytes.Buffer
	writeInt16(&body, 1)         // required_acks = 1 (leader)
	writeInt32(&body, 10000)     // timeout_ms
	writeInt32(&body, 1)         // topic array length
	writeString(&body, p.topic)  // topic name
	writeInt32(&body, 1)         // partition array length
	writeInt32(&body, 0)         // partition = 0
	writeInt32(&body, int32(msgSet.Len()))
	body.Write(msgSet.Bytes())

	return buildRequest(0, 0, "hris-producer", body.Bytes())
}

// readProduceResponse reads and validates the ProduceResponse.
func (p *Producer) readProduceResponse(conn net.Conn) error {
	// Read response size
	var size int32
	if err := binary.Read(conn, binary.BigEndian, &size); err != nil {
		return fmt.Errorf("read response size: %w", err)
	}
	if size <= 0 || size > 1<<20 {
		return fmt.Errorf("invalid response size: %d", size)
	}

	buf := make([]byte, size)
	if _, err := readFull(conn, buf); err != nil {
		return fmt.Errorf("read response body: %w", err)
	}

	r := bytes.NewReader(buf)
	// correlation_id (skip)
	var correlationID int32
	binary.Read(r, binary.BigEndian, &correlationID)

	// topic array
	var topicCount int32
	binary.Read(r, binary.BigEndian, &topicCount)
	for i := int32(0); i < topicCount; i++ {
		readStringBuf(r) // topic name
		var partCount int32
		binary.Read(r, binary.BigEndian, &partCount)
		for j := int32(0); j < partCount; j++ {
			var partition int32
			var errCode int16
			binary.Read(r, binary.BigEndian, &partition)
			binary.Read(r, binary.BigEndian, &errCode)
			if errCode != 0 {
				return fmt.Errorf("kafka error code %d on partition %d", errCode, partition)
			}
		}
	}
	return nil
}

// buildMessage constructs a Kafka message (magic=0, no compression, no key).
func buildMessage(value []byte) []byte {
	var payload bytes.Buffer
	payload.WriteByte(0) // magic = 0
	payload.WriteByte(0) // attributes = 0 (no compression)
	writeInt32(&payload, -1)               // key = null
	writeInt32(&payload, int32(len(value))) // value length
	payload.Write(value)

	crc := crc32.ChecksumIEEE(payload.Bytes())

	var msg bytes.Buffer
	writeInt32(&msg, int32(crc))
	msg.Write(payload.Bytes())
	return msg.Bytes()
}

// buildRequest constructs a full Kafka request frame with header.
func buildRequest(apiKey, apiVersion int16, clientID string, body []byte) []byte {
	var header bytes.Buffer
	writeInt16(&header, apiKey)
	writeInt16(&header, apiVersion)
	writeInt32(&header, 1) // correlation_id
	writeString(&header, clientID)

	total := header.Len() + len(body)

	var frame bytes.Buffer
	writeInt32(&frame, int32(total))
	frame.Write(header.Bytes())
	frame.Write(body)
	return frame.Bytes()
}

// --- Binary helpers ---

func writeInt16(w *bytes.Buffer, v int16) {
	b := make([]byte, 2)
	binary.BigEndian.PutUint16(b, uint16(v))
	w.Write(b)
}

func writeInt32(w *bytes.Buffer, v int32) {
	b := make([]byte, 4)
	binary.BigEndian.PutUint32(b, uint32(v))
	w.Write(b)
}

func writeInt64(w *bytes.Buffer, v int64) {
	b := make([]byte, 8)
	binary.BigEndian.PutUint64(b, uint64(v))
	w.Write(b)
}

func writeString(w *bytes.Buffer, s string) {
	writeInt16(w, int16(len(s)))
	w.WriteString(s)
}

func readFull(conn net.Conn, buf []byte) (int, error) {
	total := 0
	for total < len(buf) {
		n, err := conn.Read(buf[total:])
		total += n
		if err != nil {
			return total, err
		}
	}
	return total, nil
}

func readStringBuf(r *bytes.Reader) string {
	var l int16
	binary.Read(r, binary.BigEndian, &l)
	if l <= 0 {
		return ""
	}
	b := make([]byte, l)
	r.Read(b)
	return string(b)
}
