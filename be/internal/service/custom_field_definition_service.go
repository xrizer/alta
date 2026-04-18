package service

import (
	"encoding/json"
	"errors"
	"regexp"
	"strings"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/repository"
)

var fieldKeyPattern = regexp.MustCompile(`^[a-z][a-z0-9_]{1,59}$`)

// Reserved field keys that collide with native Employee columns; prevents
// accidental overwrite via CustomFields JSONB.
var reservedEmployeeKeys = map[string]bool{
	"id": true, "user_id": true, "company_id": true, "department_id": true,
	"position_id": true, "shift_id": true, "job_level_id": true, "grade_id": true,
	"employee_number": true, "nik": true, "gender": true, "birth_place": true,
	"birth_date": true, "marital_status": true, "religion": true, "blood_type": true,
	"last_education": true, "join_date": true, "resign_date": true,
	"contract_start_date": true, "contract_end_date": true, "employee_status": true,
	"bank_name": true, "bank_account": true, "bpjs_kes_no": true, "bpjs_tk_no": true,
	"npwp": true, "created_at": true, "updated_at": true, "custom_fields": true,
}

type CustomFieldDefinitionService interface {
	GetAll() ([]dto.CustomFieldDefinitionResponse, error)
	GetByID(id string) (*dto.CustomFieldDefinitionResponse, error)
	GetByCompany(companyID string, entityType model.CustomFieldEntity) ([]dto.CustomFieldDefinitionResponse, error)
	Create(req dto.CreateCustomFieldDefinitionRequest) (*dto.CustomFieldDefinitionResponse, error)
	Update(id string, req dto.UpdateCustomFieldDefinitionRequest) (*dto.CustomFieldDefinitionResponse, error)
	Delete(id string) error

	// ValidateValues checks that the given values map (from a Create/Update
	// employee request) satisfies the active custom field definitions for the
	// given company: required fields present, types coerced correctly, select
	// values within Options. Returns a sanitized map containing only keys with
	// a matching active definition.
	ValidateValues(companyID string, entityType model.CustomFieldEntity, values map[string]interface{}) (map[string]interface{}, error)
}

type customFieldDefinitionService struct {
	repo        repository.CustomFieldDefinitionRepository
	companyRepo repository.CompanyRepository
}

func NewCustomFieldDefinitionService(repo repository.CustomFieldDefinitionRepository, companyRepo repository.CompanyRepository) CustomFieldDefinitionService {
	return &customFieldDefinitionService{repo: repo, companyRepo: companyRepo}
}

func (s *customFieldDefinitionService) GetAll() ([]dto.CustomFieldDefinitionResponse, error) {
	defs, err := s.repo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToCustomFieldDefinitionResponses(defs), nil
}

func (s *customFieldDefinitionService) GetByID(id string) (*dto.CustomFieldDefinitionResponse, error) {
	def, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("custom field definition not found")
	}
	resp := dto.ToCustomFieldDefinitionResponse(def)
	return &resp, nil
}

func (s *customFieldDefinitionService) GetByCompany(companyID string, entityType model.CustomFieldEntity) ([]dto.CustomFieldDefinitionResponse, error) {
	if entityType == "" {
		entityType = model.CustomFieldEntityEmployee
	}
	defs, err := s.repo.FindByCompanyAndEntity(companyID, entityType)
	if err != nil {
		return nil, err
	}
	return dto.ToCustomFieldDefinitionResponses(defs), nil
}

func (s *customFieldDefinitionService) Create(req dto.CreateCustomFieldDefinitionRequest) (*dto.CustomFieldDefinitionResponse, error) {
	// Validate company
	if _, err := s.companyRepo.FindByID(req.CompanyID); err != nil {
		return nil, errors.New("company not found")
	}

	entity := req.EntityType
	if entity == "" {
		entity = model.CustomFieldEntityEmployee
	}

	fieldKey := strings.ToLower(strings.TrimSpace(req.FieldKey))
	if !fieldKeyPattern.MatchString(fieldKey) {
		return nil, errors.New("field_key must be snake_case: lowercase letters, digits and underscores only, 2-60 chars, starting with a letter")
	}

	if entity == model.CustomFieldEntityEmployee && reservedEmployeeKeys[fieldKey] {
		return nil, errors.New("field_key collides with a reserved employee column")
	}

	// Check uniqueness per (company, entity)
	if existing, _ := s.repo.FindByFieldKey(req.CompanyID, entity, fieldKey); existing != nil {
		return nil, errors.New("field_key already exists for this company and entity")
	}

	fieldType := req.FieldType
	if fieldType == "" {
		fieldType = model.CustomFieldText
	}
	if !isValidFieldType(fieldType) {
		return nil, errors.New("invalid field_type (text|number|date|boolean|select)")
	}

	def := &model.CustomFieldDefinition{
		CompanyID:    req.CompanyID,
		EntityType:   entity,
		FieldKey:     fieldKey,
		Label:        strings.TrimSpace(req.Label),
		FieldType:    fieldType,
		IsRequired:   req.IsRequired,
		DisplayOrder: req.DisplayOrder,
		IsActive:     true,
	}

	if fieldType == model.CustomFieldSelect {
		if len(req.Options) == 0 {
			return nil, errors.New("options are required for select field_type")
		}
		optBytes, err := json.Marshal(req.Options)
		if err != nil {
			return nil, errors.New("failed to encode options")
		}
		def.Options = optBytes
	}

	if err := s.repo.Create(def); err != nil {
		return nil, errors.New("failed to create custom field definition")
	}

	resp := dto.ToCustomFieldDefinitionResponse(def)
	return &resp, nil
}

func (s *customFieldDefinitionService) Update(id string, req dto.UpdateCustomFieldDefinitionRequest) (*dto.CustomFieldDefinitionResponse, error) {
	def, err := s.repo.FindByID(id)
	if err != nil {
		return nil, errors.New("custom field definition not found")
	}

	if req.Label != nil {
		def.Label = strings.TrimSpace(*req.Label)
	}
	if req.FieldType != nil {
		if !isValidFieldType(*req.FieldType) {
			return nil, errors.New("invalid field_type")
		}
		def.FieldType = *req.FieldType
	}
	if req.Options != nil {
		optBytes, err := json.Marshal(req.Options)
		if err != nil {
			return nil, errors.New("failed to encode options")
		}
		def.Options = optBytes
	}
	if req.IsRequired != nil {
		def.IsRequired = *req.IsRequired
	}
	if req.DisplayOrder != nil {
		def.DisplayOrder = *req.DisplayOrder
	}
	if req.IsActive != nil {
		def.IsActive = *req.IsActive
	}

	// If effective type is select, options must exist
	if def.FieldType == model.CustomFieldSelect && len(def.Options) == 0 {
		return nil, errors.New("options are required for select field_type")
	}

	if err := s.repo.Update(def); err != nil {
		return nil, errors.New("failed to update custom field definition")
	}

	resp := dto.ToCustomFieldDefinitionResponse(def)
	return &resp, nil
}

func (s *customFieldDefinitionService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return errors.New("custom field definition not found")
	}
	return s.repo.Delete(id)
}

func (s *customFieldDefinitionService) ValidateValues(companyID string, entityType model.CustomFieldEntity, values map[string]interface{}) (map[string]interface{}, error) {
	if entityType == "" {
		entityType = model.CustomFieldEntityEmployee
	}
	defs, err := s.repo.FindByCompanyAndEntity(companyID, entityType)
	if err != nil {
		return nil, err
	}

	// Index definitions by field_key
	defByKey := make(map[string]*model.CustomFieldDefinition, len(defs))
	for i := range defs {
		d := defs[i]
		if d.IsActive {
			defByKey[d.FieldKey] = &d
		}
	}

	sanitized := make(map[string]interface{})

	// Check required fields first
	for key, d := range defByKey {
		if d.IsRequired {
			v, ok := values[key]
			if !ok || isEmptyValue(v) {
				return nil, errors.New("missing required custom field: " + key)
			}
		}
	}

	for key, raw := range values {
		d, ok := defByKey[key]
		if !ok {
			// Ignore unknown / inactive keys (do not surface as error; admins may
			// have deleted a definition while a stale form still submits it)
			continue
		}
		coerced, err := coerceCustomValue(d, raw)
		if err != nil {
			return nil, errors.New("custom field '" + key + "': " + err.Error())
		}
		sanitized[key] = coerced
	}

	return sanitized, nil
}

func isValidFieldType(t model.CustomFieldType) bool {
	switch t {
	case model.CustomFieldText, model.CustomFieldNumber, model.CustomFieldDate,
		model.CustomFieldBoolean, model.CustomFieldSelect:
		return true
	}
	return false
}

func isEmptyValue(v interface{}) bool {
	if v == nil {
		return true
	}
	if s, ok := v.(string); ok {
		return strings.TrimSpace(s) == ""
	}
	return false
}

func coerceCustomValue(d *model.CustomFieldDefinition, raw interface{}) (interface{}, error) {
	switch d.FieldType {
	case model.CustomFieldText:
		s, ok := raw.(string)
		if !ok {
			return nil, errors.New("expected string")
		}
		return s, nil
	case model.CustomFieldNumber:
		switch v := raw.(type) {
		case float64:
			return v, nil
		case int:
			return float64(v), nil
		case string:
			// Allow numeric-looking strings from JSON; parse lazily via json
			var n float64
			if err := json.Unmarshal([]byte(v), &n); err != nil {
				return nil, errors.New("expected number")
			}
			return n, nil
		default:
			return nil, errors.New("expected number")
		}
	case model.CustomFieldDate:
		// Keep as ISO string (YYYY-MM-DD). Basic shape check.
		s, ok := raw.(string)
		if !ok || len(s) < 10 {
			return nil, errors.New("expected YYYY-MM-DD date string")
		}
		return s[:10], nil
	case model.CustomFieldBoolean:
		b, ok := raw.(bool)
		if !ok {
			return nil, errors.New("expected boolean")
		}
		return b, nil
	case model.CustomFieldSelect:
		s, ok := raw.(string)
		if !ok {
			return nil, errors.New("expected string option")
		}
		var opts []string
		_ = json.Unmarshal(d.Options, &opts)
		for _, o := range opts {
			if o == s {
				return s, nil
			}
		}
		return nil, errors.New("value not in allowed options")
	}
	return raw, nil
}
