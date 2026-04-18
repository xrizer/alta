package service

import (
	"errors"
	"strings"
	"time"

	"hris-backend/internal/dto"
	"hris-backend/internal/model"
	"hris-backend/internal/modules"
	"hris-backend/internal/repository"
)

type ModuleService interface {
	// Catalog
	ListAllModules() ([]dto.ModuleResponse, error)

	// Per-company config
	ListForCompany(companyID string) ([]dto.CompanyModuleResponse, error)
	SetForCompany(companyID, moduleKey, actorUserID string, req dto.SetCompanyModuleRequest) (*dto.CompanyModuleResponse, error)

	// Runtime checks
	EnabledKeysForCompany(companyID string) ([]string, error)
	IsEnabled(companyID, moduleKey string) (bool, error)

	// Seeding
	SyncRegistry() error
}

type moduleService struct {
	modRepo      repository.ModuleRepository
	compModRepo  repository.CompanyModuleRepository
	companyRepo  repository.CompanyRepository
}

func NewModuleService(modRepo repository.ModuleRepository, compModRepo repository.CompanyModuleRepository, companyRepo repository.CompanyRepository) ModuleService {
	return &moduleService{modRepo, compModRepo, companyRepo}
}

func (s *moduleService) ListAllModules() ([]dto.ModuleResponse, error) {
	ms, err := s.modRepo.FindAll()
	if err != nil {
		return nil, err
	}
	return dto.ToModuleResponses(ms), nil
}

func (s *moduleService) ListForCompany(companyID string) ([]dto.CompanyModuleResponse, error) {
	// Start with every module in the catalog so the UI can render the full list
	// even for companies that have never toggled anything.
	all, err := s.modRepo.FindAll()
	if err != nil {
		return nil, err
	}

	existing, err := s.compModRepo.FindByCompanyID(companyID)
	if err != nil {
		return nil, err
	}
	byKey := make(map[string]model.CompanyModule, len(existing))
	for _, cm := range existing {
		byKey[cm.ModuleKey] = cm
	}

	out := make([]dto.CompanyModuleResponse, 0, len(all))
	for i := range all {
		m := all[i]
		resp := dto.CompanyModuleResponse{
			CompanyID: companyID,
			ModuleKey: m.Key,
			// Core modules are effectively always on; represent that to the UI
			Enabled:   m.IsCore,
		}
		mr := dto.ToModuleResponse(&m)
		resp.Module = &mr
		if cm, ok := byKey[m.Key]; ok {
			resp.ID = cm.ID
			resp.Enabled = cm.Enabled || m.IsCore
			resp.Config = cm.Config
			resp.EnabledAt = cm.EnabledAt
			resp.EnabledBy = cm.EnabledBy
			resp.UpdatedAt = cm.UpdatedAt
		}
		out = append(out, resp)
	}
	return out, nil
}

func (s *moduleService) SetForCompany(companyID, moduleKey, actorUserID string, req dto.SetCompanyModuleRequest) (*dto.CompanyModuleResponse, error) {
	// Validate company exists
	if _, err := s.companyRepo.FindByID(companyID); err != nil {
		return nil, errors.New("company not found")
	}

	// Validate module exists in registry / db
	m, err := s.modRepo.FindByKey(moduleKey)
	if err != nil {
		return nil, errors.New("module not found")
	}
	if m.IsCore && !req.Enabled {
		return nil, errors.New("core modules cannot be disabled")
	}

	// Enforce dependencies when enabling
	if req.Enabled && m.DependsOn != "" {
		enabled, err := s.compModRepo.EnabledKeysForCompany(companyID)
		if err != nil {
			return nil, err
		}
		enabledSet := make(map[string]bool, len(enabled))
		for _, k := range enabled {
			enabledSet[k] = true
		}
		// Core deps count as always-enabled
		for _, dep := range strings.Split(m.DependsOn, ",") {
			dep = strings.TrimSpace(dep)
			if dep == "" {
				continue
			}
			if modules.IsCore(dep) {
				continue
			}
			if !enabledSet[dep] {
				return nil, errors.New("dependency not enabled: " + dep)
			}
		}
	}

	now := time.Now()
	cm := &model.CompanyModule{
		CompanyID: companyID,
		ModuleKey: moduleKey,
		Enabled:   req.Enabled,
		Config:    req.Config,
		EnabledBy: actorUserID,
	}
	if req.Enabled {
		cm.EnabledAt = &now
	}
	if err := s.compModRepo.Upsert(cm); err != nil {
		return nil, err
	}

	// Reload with module preloaded
	saved, err := s.compModRepo.FindByCompanyAndKey(companyID, moduleKey)
	if err != nil {
		return nil, err
	}
	resp := dto.ToCompanyModuleResponse(saved)
	return &resp, nil
}

func (s *moduleService) EnabledKeysForCompany(companyID string) ([]string, error) {
	keys, err := s.compModRepo.EnabledKeysForCompany(companyID)
	if err != nil {
		return nil, err
	}
	// Always include core module keys
	seen := make(map[string]bool, len(keys))
	for _, k := range keys {
		seen[k] = true
	}
	for _, m := range modules.Registry {
		if m.IsCore && !seen[m.Key] {
			keys = append(keys, m.Key)
			seen[m.Key] = true
		}
	}
	return keys, nil
}

func (s *moduleService) IsEnabled(companyID, moduleKey string) (bool, error) {
	if modules.IsCore(moduleKey) {
		return true, nil
	}
	row, err := s.compModRepo.FindByCompanyAndKey(companyID, moduleKey)
	if err != nil {
		// No row = disabled (not an error)
		return false, nil
	}
	return row.Enabled, nil
}

// SyncRegistry pushes the code-defined registry into the DB so every registered
// module has a row. Safe to call on every startup.
func (s *moduleService) SyncRegistry() error {
	rows := make([]model.Module, 0, len(modules.Registry))
	for _, m := range modules.Registry {
		rows = append(rows, model.Module{
			Key:         m.Key,
			Name:        m.Name,
			Description: m.Description,
			Category:    m.Category,
			DependsOn:   strings.Join(m.DependsOn, ","),
			IsCore:      m.IsCore,
		})
	}
	return s.modRepo.UpsertMany(rows)
}
