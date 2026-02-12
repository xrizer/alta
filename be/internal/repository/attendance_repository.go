package repository

import (
	"time"

	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type AttendanceRepository interface {
	Create(att *model.Attendance) error
	FindByID(id string) (*model.Attendance, error)
	FindByEmployeeIDAndDate(employeeID string, date time.Time) (*model.Attendance, error)
	FindByEmployeeID(employeeID string) ([]model.Attendance, error)
	FindByEmployeeIDAndMonth(employeeID string, month, year int) ([]model.Attendance, error)
	FindByMonth(month, year int) ([]model.Attendance, error)
	FindByDate(date time.Time) ([]model.Attendance, error)
	FindAll() ([]model.Attendance, error)
	Update(att *model.Attendance) error
	Delete(id string) error
}

type attendanceRepository struct {
	db *gorm.DB
}

func NewAttendanceRepository(db *gorm.DB) AttendanceRepository {
	return &attendanceRepository{db: db}
}

func (r *attendanceRepository) preload(db *gorm.DB) *gorm.DB {
	return db.Preload("Employee").Preload("Employee.User").Preload("Shift")
}

func (r *attendanceRepository) Create(att *model.Attendance) error {
	return r.db.Create(att).Error
}

func (r *attendanceRepository) FindByID(id string) (*model.Attendance, error) {
	var att model.Attendance
	if err := r.preload(r.db).First(&att, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &att, nil
}

func (r *attendanceRepository) FindByEmployeeIDAndDate(employeeID string, date time.Time) (*model.Attendance, error) {
	var att model.Attendance
	if err := r.preload(r.db).Where("employee_id = ? AND date = ?", employeeID, date).First(&att).Error; err != nil {
		return nil, err
	}
	return &att, nil
}

func (r *attendanceRepository) FindByEmployeeID(employeeID string) ([]model.Attendance, error) {
	var attendances []model.Attendance
	if err := r.preload(r.db).Where("employee_id = ?", employeeID).Order("date DESC").Find(&attendances).Error; err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *attendanceRepository) FindByEmployeeIDAndMonth(employeeID string, month, year int) ([]model.Attendance, error) {
	var attendances []model.Attendance
	if err := r.preload(r.db).
		Where("employee_id = ? AND EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?", employeeID, month, year).
		Order("date ASC").Find(&attendances).Error; err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *attendanceRepository) FindByMonth(month, year int) ([]model.Attendance, error) {
	var attendances []model.Attendance
	if err := r.preload(r.db).
		Where("EXTRACT(MONTH FROM date) = ? AND EXTRACT(YEAR FROM date) = ?", month, year).
		Order("date DESC, created_at DESC").Find(&attendances).Error; err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *attendanceRepository) FindByDate(date time.Time) ([]model.Attendance, error) {
	var attendances []model.Attendance
	if err := r.preload(r.db).Where("date = ?", date).Order("created_at DESC").Find(&attendances).Error; err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *attendanceRepository) FindAll() ([]model.Attendance, error) {
	var attendances []model.Attendance
	if err := r.preload(r.db).Order("date DESC").Find(&attendances).Error; err != nil {
		return nil, err
	}
	return attendances, nil
}

func (r *attendanceRepository) Update(att *model.Attendance) error {
	return r.db.Save(att).Error
}

func (r *attendanceRepository) Delete(id string) error {
	return r.db.Delete(&model.Attendance{}, "id = ?", id).Error
}
