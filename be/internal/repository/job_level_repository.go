package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type JobLevelRepository interface {
	Create(jl *model.JobLevel) error
	FindByID(id string) (*model.JobLevel, error)
	FindAll() ([]model.JobLevel, error)
	FindByCompanyID(companyID string) ([]model.JobLevel, error)
	Update(jl *model.JobLevel) error
	Delete(id string) error
}

type jobLevelRepository struct {
	db *gorm.DB
}

func NewJobLevelRepository(db *gorm.DB) JobLevelRepository {
	return &jobLevelRepository{db: db}
}

func (r *jobLevelRepository) Create(jl *model.JobLevel) error {
	return r.db.Create(jl).Error
}

func (r *jobLevelRepository) FindByID(id string) (*model.JobLevel, error) {
	var jl model.JobLevel
	if err := r.db.First(&jl, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &jl, nil
}

func (r *jobLevelRepository) FindAll() ([]model.JobLevel, error) {
	var levels []model.JobLevel
	if err := r.db.Order("level_order ASC, name ASC").Find(&levels).Error; err != nil {
		return nil, err
	}
	return levels, nil
}

func (r *jobLevelRepository) FindByCompanyID(companyID string) ([]model.JobLevel, error) {
	var levels []model.JobLevel
	if err := r.db.Where("company_id = ?", companyID).Order("level_order ASC, name ASC").Find(&levels).Error; err != nil {
		return nil, err
	}
	return levels, nil
}

func (r *jobLevelRepository) Update(jl *model.JobLevel) error {
	return r.db.Save(jl).Error
}

func (r *jobLevelRepository) Delete(id string) error {
	return r.db.Delete(&model.JobLevel{}, "id = ?", id).Error
}
