package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type LeaveRepository interface {
	Create(leave *model.Leave) error
	FindByID(id string) (*model.Leave, error)
	FindByEmployeeID(employeeID string) ([]model.Leave, error)
	FindByStatus(status model.LeaveStatus) ([]model.Leave, error)
	FindAll() ([]model.Leave, error)
	Update(leave *model.Leave) error
	Delete(id string) error
}

type leaveRepository struct {
	db *gorm.DB
}

func NewLeaveRepository(db *gorm.DB) LeaveRepository {
	return &leaveRepository{db: db}
}

func (r *leaveRepository) preload(db *gorm.DB) *gorm.DB {
	return db.Preload("Employee").Preload("Employee.User").Preload("Approver")
}

func (r *leaveRepository) Create(leave *model.Leave) error {
	return r.db.Create(leave).Error
}

func (r *leaveRepository) FindByID(id string) (*model.Leave, error) {
	var leave model.Leave
	if err := r.preload(r.db).First(&leave, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &leave, nil
}

func (r *leaveRepository) FindByEmployeeID(employeeID string) ([]model.Leave, error) {
	var leaves []model.Leave
	if err := r.preload(r.db).Where("employee_id = ?", employeeID).Order("created_at DESC").Find(&leaves).Error; err != nil {
		return nil, err
	}
	return leaves, nil
}

func (r *leaveRepository) FindByStatus(status model.LeaveStatus) ([]model.Leave, error) {
	var leaves []model.Leave
	if err := r.preload(r.db).Where("status = ?", status).Order("created_at DESC").Find(&leaves).Error; err != nil {
		return nil, err
	}
	return leaves, nil
}

func (r *leaveRepository) FindAll() ([]model.Leave, error) {
	var leaves []model.Leave
	if err := r.preload(r.db).Order("created_at DESC").Find(&leaves).Error; err != nil {
		return nil, err
	}
	return leaves, nil
}

func (r *leaveRepository) Update(leave *model.Leave) error {
	return r.db.Save(leave).Error
}

func (r *leaveRepository) Delete(id string) error {
	return r.db.Delete(&model.Leave{}, "id = ?", id).Error
}
