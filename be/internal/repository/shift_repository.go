package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type ShiftRepository interface {
	Create(shift *model.Shift) error
	FindByID(id string) (*model.Shift, error)
	FindByCompanyID(companyID string) ([]model.Shift, error)
	FindAll() ([]model.Shift, error)
	Update(shift *model.Shift) error
	Delete(id string) error
}

type shiftRepository struct {
	db *gorm.DB
}

func NewShiftRepository(db *gorm.DB) ShiftRepository {
	return &shiftRepository{db: db}
}

func (r *shiftRepository) Create(shift *model.Shift) error {
	return r.db.Create(shift).Error
}

func (r *shiftRepository) FindByID(id string) (*model.Shift, error) {
	var shift model.Shift
	if err := r.db.Preload("Company").First(&shift, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &shift, nil
}

func (r *shiftRepository) FindByCompanyID(companyID string) ([]model.Shift, error) {
	var shifts []model.Shift
	if err := r.db.Preload("Company").Where("company_id = ?", companyID).Order("created_at DESC").Find(&shifts).Error; err != nil {
		return nil, err
	}
	return shifts, nil
}

func (r *shiftRepository) FindAll() ([]model.Shift, error) {
	var shifts []model.Shift
	if err := r.db.Preload("Company").Order("created_at DESC").Find(&shifts).Error; err != nil {
		return nil, err
	}
	return shifts, nil
}

func (r *shiftRepository) Update(shift *model.Shift) error {
	return r.db.Save(shift).Error
}

func (r *shiftRepository) Delete(id string) error {
	return r.db.Delete(&model.Shift{}, "id = ?", id).Error
}
