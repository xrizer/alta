package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type PositionRepository interface {
	Create(pos *model.Position) error
	FindByID(id string) (*model.Position, error)
	FindByCompanyID(companyID string) ([]model.Position, error)
	FindAll() ([]model.Position, error)
	Update(pos *model.Position) error
	Delete(id string) error
}

type positionRepository struct {
	db *gorm.DB
}

func NewPositionRepository(db *gorm.DB) PositionRepository {
	return &positionRepository{db: db}
}

func (r *positionRepository) Create(pos *model.Position) error {
	return r.db.Create(pos).Error
}

func (r *positionRepository) FindByID(id string) (*model.Position, error) {
	var pos model.Position
	if err := r.db.Preload("Company").Preload("Department").First(&pos, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &pos, nil
}

func (r *positionRepository) FindByCompanyID(companyID string) ([]model.Position, error) {
	var positions []model.Position
	if err := r.db.Preload("Company").Preload("Department").Where("company_id = ?", companyID).Order("created_at DESC").Find(&positions).Error; err != nil {
		return nil, err
	}
	return positions, nil
}

func (r *positionRepository) FindAll() ([]model.Position, error) {
	var positions []model.Position
	if err := r.db.Preload("Company").Preload("Department").Order("created_at DESC").Find(&positions).Error; err != nil {
		return nil, err
	}
	return positions, nil
}

func (r *positionRepository) Update(pos *model.Position) error {
	return r.db.Save(pos).Error
}

func (r *positionRepository) Delete(id string) error {
	return r.db.Delete(&model.Position{}, "id = ?", id).Error
}
