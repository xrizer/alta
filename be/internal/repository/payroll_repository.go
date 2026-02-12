package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type PayrollRepository interface {
	Create(payroll *model.Payroll) error
	FindByID(id string) (*model.Payroll, error)
	FindByEmployeeID(employeeID string) ([]model.Payroll, error)
	FindByPeriod(month, year int) ([]model.Payroll, error)
	FindByEmployeeIDAndPeriod(employeeID string, month, year int) (*model.Payroll, error)
	FindAll() ([]model.Payroll, error)
	Update(payroll *model.Payroll) error
	Delete(id string) error
}

type payrollRepository struct {
	db *gorm.DB
}

func NewPayrollRepository(db *gorm.DB) PayrollRepository {
	return &payrollRepository{db: db}
}

func (r *payrollRepository) preload(db *gorm.DB) *gorm.DB {
	return db.Preload("Employee").Preload("Employee.User").Preload("Employee.Company").Preload("Employee.Department").Preload("Employee.Position")
}

func (r *payrollRepository) Create(payroll *model.Payroll) error {
	return r.db.Create(payroll).Error
}

func (r *payrollRepository) FindByID(id string) (*model.Payroll, error) {
	var payroll model.Payroll
	if err := r.preload(r.db).First(&payroll, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &payroll, nil
}

func (r *payrollRepository) FindByEmployeeID(employeeID string) ([]model.Payroll, error) {
	var payrolls []model.Payroll
	if err := r.preload(r.db).Where("employee_id = ?", employeeID).Order("period_year DESC, period_month DESC").Find(&payrolls).Error; err != nil {
		return nil, err
	}
	return payrolls, nil
}

func (r *payrollRepository) FindByPeriod(month, year int) ([]model.Payroll, error) {
	var payrolls []model.Payroll
	if err := r.preload(r.db).Where("period_month = ? AND period_year = ?", month, year).Order("created_at DESC").Find(&payrolls).Error; err != nil {
		return nil, err
	}
	return payrolls, nil
}

func (r *payrollRepository) FindByEmployeeIDAndPeriod(employeeID string, month, year int) (*model.Payroll, error) {
	var payroll model.Payroll
	if err := r.preload(r.db).Where("employee_id = ? AND period_month = ? AND period_year = ?", employeeID, month, year).First(&payroll).Error; err != nil {
		return nil, err
	}
	return &payroll, nil
}

func (r *payrollRepository) FindAll() ([]model.Payroll, error) {
	var payrolls []model.Payroll
	if err := r.preload(r.db).Order("period_year DESC, period_month DESC").Find(&payrolls).Error; err != nil {
		return nil, err
	}
	return payrolls, nil
}

func (r *payrollRepository) Update(payroll *model.Payroll) error {
	return r.db.Save(payroll).Error
}

func (r *payrollRepository) Delete(id string) error {
	return r.db.Delete(&model.Payroll{}, "id = ?", id).Error
}
