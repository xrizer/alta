package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type GradeRepository interface {
	Create(g *model.Grade) error
	FindByID(id string) (*model.Grade, error)
	FindAll() ([]model.Grade, error)
	FindByCompanyID(companyID string) ([]model.Grade, error)
	FindByJobLevelID(jobLevelID string) ([]model.Grade, error)
	Update(g *model.Grade) error
	Delete(id string) error
}

type gradeRepository struct {
	db *gorm.DB
}

func NewGradeRepository(db *gorm.DB) GradeRepository {
	return &gradeRepository{db: db}
}

func (r *gradeRepository) Create(g *model.Grade) error {
	return r.db.Create(g).Error
}

func (r *gradeRepository) FindByID(id string) (*model.Grade, error) {
	var g model.Grade
	if err := r.db.Preload("JobLevel").First(&g, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *gradeRepository) FindAll() ([]model.Grade, error) {
	var grades []model.Grade
	if err := r.db.Preload("JobLevel").Order("name ASC").Find(&grades).Error; err != nil {
		return nil, err
	}
	return grades, nil
}

func (r *gradeRepository) FindByCompanyID(companyID string) ([]model.Grade, error) {
	var grades []model.Grade
	if err := r.db.Preload("JobLevel").Where("company_id = ?", companyID).Order("name ASC").Find(&grades).Error; err != nil {
		return nil, err
	}
	return grades, nil
}

func (r *gradeRepository) FindByJobLevelID(jobLevelID string) ([]model.Grade, error) {
	var grades []model.Grade
	if err := r.db.Preload("JobLevel").Where("job_level_id = ?", jobLevelID).Order("name ASC").Find(&grades).Error; err != nil {
		return nil, err
	}
	return grades, nil
}

func (r *gradeRepository) Update(g *model.Grade) error {
	return r.db.Save(g).Error
}

func (r *gradeRepository) Delete(id string) error {
	return r.db.Delete(&model.Grade{}, "id = ?", id).Error
}
