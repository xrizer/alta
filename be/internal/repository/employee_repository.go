package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type EmployeeRepository interface {
	Create(emp *model.Employee) error
	FindByID(id string) (*model.Employee, error)
	FindByUserID(userID string) (*model.Employee, error)
	FindByEmployeeNumber(empNumber string) (*model.Employee, error)
	FindByCompanyID(companyID string) ([]model.Employee, error)
	FindAll() ([]model.Employee, error)
	Update(emp *model.Employee) error
	Delete(id string) error
}

type employeeRepository struct {
	db *gorm.DB
}

func NewEmployeeRepository(db *gorm.DB) EmployeeRepository {
	return &employeeRepository{db: db}
}

func (r *employeeRepository) preload(db *gorm.DB) *gorm.DB {
	return db.Preload("User").Preload("Company").Preload("Department").Preload("Position").Preload("Shift")
}

func (r *employeeRepository) Create(emp *model.Employee) error {
	return r.db.Create(emp).Error
}

func (r *employeeRepository) FindByID(id string) (*model.Employee, error) {
	var emp model.Employee
	if err := r.preload(r.db).First(&emp, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepository) FindByUserID(userID string) (*model.Employee, error) {
	var emp model.Employee
	if err := r.preload(r.db).First(&emp, "user_id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepository) FindByEmployeeNumber(empNumber string) (*model.Employee, error) {
	var emp model.Employee
	if err := r.preload(r.db).First(&emp, "employee_number = ?", empNumber).Error; err != nil {
		return nil, err
	}
	return &emp, nil
}

func (r *employeeRepository) FindByCompanyID(companyID string) ([]model.Employee, error) {
	var employees []model.Employee
	if err := r.preload(r.db).Where("company_id = ?", companyID).Order("created_at DESC").Find(&employees).Error; err != nil {
		return nil, err
	}
	return employees, nil
}

func (r *employeeRepository) FindAll() ([]model.Employee, error) {
	var employees []model.Employee
	if err := r.preload(r.db).Order("created_at DESC").Find(&employees).Error; err != nil {
		return nil, err
	}
	return employees, nil
}

func (r *employeeRepository) Update(emp *model.Employee) error {
	return r.db.Save(emp).Error
}

func (r *employeeRepository) Delete(id string) error {
	return r.db.Delete(&model.Employee{}, "id = ?", id).Error
}
