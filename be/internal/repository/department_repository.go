package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type DepartmentRepository interface {
	Create(dept *model.Department) error
	FindByID(id string) (*model.Department, error)
	FindByCompanyID(companyID string) ([]model.Department, error)
	FindAll() ([]model.Department, error)
	Update(dept *model.Department) error
	Delete(id string) error
}

type departmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) Create(dept *model.Department) error {
	return r.db.Create(dept).Error
}

func (r *departmentRepository) FindByID(id string) (*model.Department, error) {
	var dept model.Department
	if err := r.db.Preload("Company").First(&dept, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *departmentRepository) FindByCompanyID(companyID string) ([]model.Department, error) {
	var depts []model.Department
	if err := r.db.Preload("Company").Where("company_id = ?", companyID).Order("created_at DESC").Find(&depts).Error; err != nil {
		return nil, err
	}
	return depts, nil
}

func (r *departmentRepository) FindAll() ([]model.Department, error) {
	var depts []model.Department
	if err := r.db.Preload("Company").Order("created_at DESC").Find(&depts).Error; err != nil {
		return nil, err
	}
	return depts, nil
}

func (r *departmentRepository) Update(dept *model.Department) error {
	return r.db.Save(dept).Error
}

func (r *departmentRepository) Delete(id string) error {
	return r.db.Delete(&model.Department{}, "id = ?", id).Error
}
