package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type CompanyRepository interface {
	Create(company *model.Company) error
	FindByID(id string) (*model.Company, error)
	FindAll() ([]model.Company, error)
	FindAllPaginated(page, limit int, search, sortBy, sortOrder string) ([]model.Company, int64, error)
	FindWithStructure(companyID string) (*model.Company, error)
	Update(company *model.Company) error
	Delete(id string) error
	DeleteMultiple(ids []string) error
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

func (r *companyRepository) FindWithStructure(companyID string) (*model.Company, error) {
	var company model.Company
	if err := r.db.
		Preload("Departments", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("name")
		}).
		Preload("Departments.Positions", func(db *gorm.DB) *gorm.DB {
			return db.Where("is_active = ?", true).Order("name")
		}).
		Preload("Departments.Positions.Employees").
		Preload("Departments.Positions.Employees.User").
		First(&company, "id = ?", companyID).Error; err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *companyRepository) Update(company *model.Company) error {
	return r.db.Save(company).Error
}

func (r *companyRepository) FindAllPaginated(page, limit int, search, sortBy, sortOrder string) ([]model.Company, int64, error) {
	query := r.db.Model(&model.Company{})

	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR npwp ILIKE ?", like, like, like, like)
	}

	allowedSortBy := map[string]bool{
		"name": true, "email": true, "phone": true, "npwp": true, "is_active": true, "created_at": true,
	}
	if !allowedSortBy[sortBy] {
		sortBy = "created_at"
	}
	if sortOrder != "asc" {
		sortOrder = "desc"
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var companies []model.Company
	offset := (page - 1) * limit
	if err := query.Order(sortBy + " " + sortOrder).Limit(limit).Offset(offset).Find(&companies).Error; err != nil {
		return nil, 0, err
	}

	return companies, total, nil
}

func (r *companyRepository) Delete(id string) error {
	return r.db.Delete(&model.Company{}, "id = ?", id).Error
}

func (r *companyRepository) DeleteMultiple(ids []string) error {
	return r.db.Delete(&model.Company{}, "id IN ?", ids).Error
}
