package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type CompanyRepository interface {
	Create(company *model.Company) error
	FindByID(id string) (*model.Company, error)
	FindAll() ([]model.Company, error)
	Update(company *model.Company) error
	Delete(id string) error
}

type companyRepository struct {
	db *gorm.DB
}

func NewCompanyRepository(db *gorm.DB) CompanyRepository {
	return &companyRepository{db: db}
}

func (r *companyRepository) Create(company *model.Company) error {
	return r.db.Create(company).Error
}

func (r *companyRepository) FindByID(id string) (*model.Company, error) {
	var company model.Company
	if err := r.db.First(&company, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) FindAll() ([]model.Company, error) {
	var companies []model.Company
	if err := r.db.Order("created_at DESC").Find(&companies).Error; err != nil {
		return nil, err
	}
	return companies, nil
}

func (r *companyRepository) Update(company *model.Company) error {
	return r.db.Save(company).Error
}

func (r *companyRepository) Delete(id string) error {
	return r.db.Delete(&model.Company{}, "id = ?", id).Error
}
