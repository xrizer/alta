package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type EmployeeSalaryRepository interface {
	Create(salary *model.EmployeeSalary) error
	FindByID(id string) (*model.EmployeeSalary, error)
	FindByEmployeeID(employeeID string) ([]model.EmployeeSalary, error)
	FindLatestByEmployeeID(employeeID string) (*model.EmployeeSalary, error)
	FindAll() ([]model.EmployeeSalary, error)
	Update(salary *model.EmployeeSalary) error
	Delete(id string) error
}

type employeeSalaryRepository struct {
	db *gorm.DB
}

func NewEmployeeSalaryRepository(db *gorm.DB) EmployeeSalaryRepository {
	return &employeeSalaryRepository{db: db}
}

func (r *employeeSalaryRepository) Create(salary *model.EmployeeSalary) error {
	return r.db.Create(salary).Error
}

func (r *employeeSalaryRepository) FindByID(id string) (*model.EmployeeSalary, error) {
	var salary model.EmployeeSalary
	if err := r.db.Preload("Employee").First(&salary, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &salary, nil
}

func (r *employeeSalaryRepository) FindByEmployeeID(employeeID string) ([]model.EmployeeSalary, error) {
	var salaries []model.EmployeeSalary
	if err := r.db.Where("employee_id = ?", employeeID).Order("effective_date DESC").Find(&salaries).Error; err != nil {
		return nil, err
	}
	return salaries, nil
}

func (r *employeeSalaryRepository) FindLatestByEmployeeID(employeeID string) (*model.EmployeeSalary, error) {
	var salary model.EmployeeSalary
	if err := r.db.Where("employee_id = ?", employeeID).Order("effective_date DESC").First(&salary).Error; err != nil {
		return nil, err
	}
	return &salary, nil
}

func (r *employeeSalaryRepository) FindAll() ([]model.EmployeeSalary, error) {
	var salaries []model.EmployeeSalary
	if err := r.db.Preload("Employee").Order("created_at DESC").Find(&salaries).Error; err != nil {
		return nil, err
	}
	return salaries, nil
}

func (r *employeeSalaryRepository) Update(salary *model.EmployeeSalary) error {
	return r.db.Save(salary).Error
}

func (r *employeeSalaryRepository) Delete(id string) error {
	return r.db.Delete(&model.EmployeeSalary{}, "id = ?", id).Error
}
