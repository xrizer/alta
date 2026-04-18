package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type CustomFieldDefinitionRepository interface {
	Create(def *model.CustomFieldDefinition) error
	FindByID(id string) (*model.CustomFieldDefinition, error)
	FindByCompanyAndEntity(companyID string, entityType model.CustomFieldEntity) ([]model.CustomFieldDefinition, error)
	FindAll() ([]model.CustomFieldDefinition, error)
	FindByFieldKey(companyID string, entityType model.CustomFieldEntity, fieldKey string) (*model.CustomFieldDefinition, error)
	Update(def *model.CustomFieldDefinition) error
	Delete(id string) error
}

type customFieldDefinitionRepository struct {
	db *gorm.DB
}

func NewCustomFieldDefinitionRepository(db *gorm.DB) CustomFieldDefinitionRepository {
	return &customFieldDefinitionRepository{db: db}
}

func (r *customFieldDefinitionRepository) Create(def *model.CustomFieldDefinition) error {
	return r.db.Create(def).Error
}

func (r *customFieldDefinitionRepository) FindByID(id string) (*model.CustomFieldDefinition, error) {
	var def model.CustomFieldDefinition
	if err := r.db.First(&def, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &def, nil
}

func (r *customFieldDefinitionRepository) FindByCompanyAndEntity(companyID string, entityType model.CustomFieldEntity) ([]model.CustomFieldDefinition, error) {
	var defs []model.CustomFieldDefinition
	if err := r.db.
		Where("company_id = ? AND entity_type = ?", companyID, entityType).
		Order("display_order ASC, label ASC").
		Find(&defs).Error; err != nil {
		return nil, err
	}
	return defs, nil
}

func (r *customFieldDefinitionRepository) FindAll() ([]model.CustomFieldDefinition, error) {
	var defs []model.CustomFieldDefinition
	if err := r.db.Order("display_order ASC, label ASC").Find(&defs).Error; err != nil {
		return nil, err
	}
	return defs, nil
}

func (r *customFieldDefinitionRepository) FindByFieldKey(companyID string, entityType model.CustomFieldEntity, fieldKey string) (*model.CustomFieldDefinition, error) {
	var def model.CustomFieldDefinition
	if err := r.db.
		Where("company_id = ? AND entity_type = ? AND field_key = ?", companyID, entityType, fieldKey).
		First(&def).Error; err != nil {
		return nil, err
	}
	return &def, nil
}

func (r *customFieldDefinitionRepository) Update(def *model.CustomFieldDefinition) error {
	return r.db.Save(def).Error
}

func (r *customFieldDefinitionRepository) Delete(id string) error {
	return r.db.Delete(&model.CustomFieldDefinition{}, "id = ?", id).Error
}
