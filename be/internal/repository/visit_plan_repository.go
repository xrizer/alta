package repository

import (
	"time"

	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type VisitPlanRepository interface {
	Create(p *model.VisitPlan) error
	Update(p *model.VisitPlan) error
	FindByID(id string) (*model.VisitPlan, error)
	FindByEmployeeAndDate(employeeID string, date time.Time) (*model.VisitPlan, error)
	FindByCompanyAndDate(companyID string, date time.Time) ([]model.VisitPlan, error)
	ListByEmployee(employeeID string, from, to *time.Time) ([]model.VisitPlan, error)
	Delete(id string) error

	// Items
	CreateItem(i *model.VisitPlanItem) error
	UpdateItem(i *model.VisitPlanItem) error
	FindItemByID(id string) (*model.VisitPlanItem, error)
	DeleteItem(id string) error
}

type visitPlanRepository struct {
	db *gorm.DB
}

func NewVisitPlanRepository(db *gorm.DB) VisitPlanRepository {
	return &visitPlanRepository{db}
}

func (r *visitPlanRepository) Create(p *model.VisitPlan) error {
	return r.db.Create(p).Error
}

func (r *visitPlanRepository) Update(p *model.VisitPlan) error {
	return r.db.Save(p).Error
}

func (r *visitPlanRepository) FindByID(id string) (*model.VisitPlan, error) {
	var p model.VisitPlan
	err := r.db.Preload("Items").Where("id = ?", id).First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *visitPlanRepository) FindByEmployeeAndDate(employeeID string, date time.Time) (*model.VisitPlan, error) {
	var p model.VisitPlan
	day := date.Format("2006-01-02")
	err := r.db.Preload("Items").
		Where("employee_id = ? AND plan_date = ?", employeeID, day).
		First(&p).Error
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *visitPlanRepository) FindByCompanyAndDate(companyID string, date time.Time) ([]model.VisitPlan, error) {
	var out []model.VisitPlan
	day := date.Format("2006-01-02")
	err := r.db.Preload("Items").
		Where("company_id = ? AND plan_date = ?", companyID, day).
		Find(&out).Error
	return out, err
}

func (r *visitPlanRepository) ListByEmployee(employeeID string, from, to *time.Time) ([]model.VisitPlan, error) {
	q := r.db.Preload("Items").Where("employee_id = ?", employeeID)
	if from != nil {
		q = q.Where("plan_date >= ?", from.Format("2006-01-02"))
	}
	if to != nil {
		q = q.Where("plan_date <= ?", to.Format("2006-01-02"))
	}
	var out []model.VisitPlan
	err := q.Order("plan_date DESC").Find(&out).Error
	return out, err
}

func (r *visitPlanRepository) Delete(id string) error {
	// Cascade items via GORM soft delete — delete items first for cleanliness.
	if err := r.db.Where("visit_plan_id = ?", id).Delete(&model.VisitPlanItem{}).Error; err != nil {
		return err
	}
	return r.db.Where("id = ?", id).Delete(&model.VisitPlan{}).Error
}

func (r *visitPlanRepository) CreateItem(i *model.VisitPlanItem) error {
	return r.db.Create(i).Error
}

func (r *visitPlanRepository) UpdateItem(i *model.VisitPlanItem) error {
	return r.db.Save(i).Error
}

func (r *visitPlanRepository) FindItemByID(id string) (*model.VisitPlanItem, error) {
	var i model.VisitPlanItem
	if err := r.db.Where("id = ?", id).First(&i).Error; err != nil {
		return nil, err
	}
	return &i, nil
}

func (r *visitPlanRepository) DeleteItem(id string) error {
	return r.db.Where("id = ?", id).Delete(&model.VisitPlanItem{}).Error
}
