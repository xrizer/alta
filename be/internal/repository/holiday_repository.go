package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type HolidayRepository interface {
	Create(holiday *model.Holiday) error
	FindByID(id string) (*model.Holiday, error)
	FindByCompanyID(companyID string) ([]model.Holiday, error)
	FindByCompanyIDAndYear(companyID string, year int) ([]model.Holiday, error)
	FindAll() ([]model.Holiday, error)
	Update(holiday *model.Holiday) error
	Delete(id string) error
}

type holidayRepository struct {
	db *gorm.DB
}

func NewHolidayRepository(db *gorm.DB) HolidayRepository {
	return &holidayRepository{db: db}
}

func (r *holidayRepository) Create(holiday *model.Holiday) error {
	return r.db.Create(holiday).Error
}

func (r *holidayRepository) FindByID(id string) (*model.Holiday, error) {
	var holiday model.Holiday
	if err := r.db.Preload("Company").First(&holiday, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &holiday, nil
}

func (r *holidayRepository) FindByCompanyID(companyID string) ([]model.Holiday, error) {
	var holidays []model.Holiday
	if err := r.db.Preload("Company").Where("company_id = ?", companyID).Order("date ASC").Find(&holidays).Error; err != nil {
		return nil, err
	}
	return holidays, nil
}

func (r *holidayRepository) FindByCompanyIDAndYear(companyID string, year int) ([]model.Holiday, error) {
	var holidays []model.Holiday
	if err := r.db.Preload("Company").
		Where("company_id = ? AND EXTRACT(YEAR FROM date) = ?", companyID, year).
		Order("date ASC").Find(&holidays).Error; err != nil {
		return nil, err
	}
	return holidays, nil
}

func (r *holidayRepository) FindAll() ([]model.Holiday, error) {
	var holidays []model.Holiday
	if err := r.db.Preload("Company").Order("date ASC").Find(&holidays).Error; err != nil {
		return nil, err
	}
	return holidays, nil
}

func (r *holidayRepository) Update(holiday *model.Holiday) error {
	return r.db.Save(holiday).Error
}

func (r *holidayRepository) Delete(id string) error {
	// Holiday has no soft delete, this is a hard delete
	return r.db.Unscoped().Delete(&model.Holiday{}, "id = ?", id).Error
}
