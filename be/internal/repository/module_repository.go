package repository

import (
	"hris-backend/internal/model"

	"gorm.io/gorm"
)

type ModuleRepository interface {
	FindAll() ([]model.Module, error)
	FindByKey(key string) (*model.Module, error)
	UpsertMany(modules []model.Module) error
}

type moduleRepository struct {
	db *gorm.DB
}

func NewModuleRepository(db *gorm.DB) ModuleRepository {
	return &moduleRepository{db}
}

func (r *moduleRepository) FindAll() ([]model.Module, error) {
	var modules []model.Module
	err := r.db.Order("is_core DESC, category ASC, name ASC").Find(&modules).Error
	return modules, err
}

func (r *moduleRepository) FindByKey(key string) (*model.Module, error) {
	var m model.Module
	if err := r.db.Where("key = ?", key).First(&m).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

// UpsertMany inserts or updates all provided modules (by key). Used for seeding from registry.
func (r *moduleRepository) UpsertMany(modules []model.Module) error {
	for i := range modules {
		if err := r.db.Save(&modules[i]).Error; err != nil {
			return err
		}
	}
	return nil
}

type CompanyModuleRepository interface {
	FindByCompanyID(companyID string) ([]model.CompanyModule, error)
	FindByCompanyAndKey(companyID, moduleKey string) (*model.CompanyModule, error)
	EnabledKeysForCompany(companyID string) ([]string, error)
	Upsert(cm *model.CompanyModule) error
}

type companyModuleRepository struct {
	db *gorm.DB
}

func NewCompanyModuleRepository(db *gorm.DB) CompanyModuleRepository {
	return &companyModuleRepository{db}
}

func (r *companyModuleRepository) FindByCompanyID(companyID string) ([]model.CompanyModule, error) {
	var rows []model.CompanyModule
	err := r.db.Preload("Module").Where("company_id = ?", companyID).Find(&rows).Error
	return rows, err
}

func (r *companyModuleRepository) FindByCompanyAndKey(companyID, moduleKey string) (*model.CompanyModule, error) {
	var cm model.CompanyModule
	if err := r.db.Where("company_id = ? AND module_key = ?", companyID, moduleKey).First(&cm).Error; err != nil {
		return nil, err
	}
	return &cm, nil
}

// EnabledKeysForCompany returns just the module keys where enabled = true.
func (r *companyModuleRepository) EnabledKeysForCompany(companyID string) ([]string, error) {
	var keys []string
	err := r.db.Model(&model.CompanyModule{}).
		Where("company_id = ? AND enabled = ?", companyID, true).
		Pluck("module_key", &keys).Error
	return keys, err
}

func (r *companyModuleRepository) Upsert(cm *model.CompanyModule) error {
	// Check if row exists by (company_id, module_key)
	existing, err := r.FindByCompanyAndKey(cm.CompanyID, cm.ModuleKey)
	if err == nil && existing != nil {
		cm.ID = existing.ID
		return r.db.Save(cm).Error
	}
	return r.db.Create(cm).Error
}
