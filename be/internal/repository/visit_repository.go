package repository

import (
	"time"

	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type VisitRepository interface {
	Create(v *model.Visit) error
	Update(v *model.Visit) error
	FindByID(id string) (*model.Visit, error)
	FindByAttendanceID(attendanceID string) ([]model.Visit, error)
	FindPaginated(page, limit int, employeeID, companyID string, from, to *time.Time) ([]model.Visit, int64, error)
	Delete(id string) error
}

type visitRepository struct {
	db *gorm.DB
}

func NewVisitRepository(db *gorm.DB) VisitRepository {
	return &visitRepository{db}
}

func (r *visitRepository) Create(v *model.Visit) error {
	return r.db.Create(v).Error
}

func (r *visitRepository) Update(v *model.Visit) error {
	return r.db.Save(v).Error
}

func (r *visitRepository) FindByID(id string) (*model.Visit, error) {
	var v model.Visit
	if err := r.db.Where("id = ?", id).First(&v).Error; err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *visitRepository) FindByAttendanceID(attendanceID string) ([]model.Visit, error) {
	var out []model.Visit
	err := r.db.Where("attendance_id = ?", attendanceID).
		Order("arrived_at ASC").
		Find(&out).Error
	return out, err
}

func (r *visitRepository) FindPaginated(page, limit int, employeeID, companyID string, from, to *time.Time) ([]model.Visit, int64, error) {
	q := r.db.Model(&model.Visit{})
	if employeeID != "" {
		q = q.Where("employee_id = ?", employeeID)
	}
	if companyID != "" {
		q = q.Where("company_id = ?", companyID)
	}
	if from != nil {
		q = q.Where("arrived_at >= ?", *from)
	}
	if to != nil {
		q = q.Where("arrived_at <= ?", *to)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var out []model.Visit
	err := q.Order("arrived_at DESC").
		Limit(limit).
		Offset((page - 1) * limit).
		Find(&out).Error
	return out, total, err
}

func (r *visitRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.Visit{}).Error
}
