package dto

import (
	"hris-backend/internal/model"
	"strings"
	"time"
)

type ModuleResponse struct {
	Key         string   `json:"key"`
	Name        string   `json:"name"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	DependsOn   []string `json:"depends_on"`
	IsCore      bool     `json:"is_core"`
}

func ToModuleResponse(m *model.Module) ModuleResponse {
	var deps []string
	if m.DependsOn != "" {
		deps = strings.Split(m.DependsOn, ",")
	}
	return ModuleResponse{
		Key:         m.Key,
		Name:        m.Name,
		Description: m.Description,
		Category:    m.Category,
		DependsOn:   deps,
		IsCore:      m.IsCore,
	}
}

func ToModuleResponses(ms []model.Module) []ModuleResponse {
	out := make([]ModuleResponse, len(ms))
	for i := range ms {
		out[i] = ToModuleResponse(&ms[i])
	}
	return out
}

type CompanyModuleResponse struct {
	ID        string     `json:"id"`
	CompanyID string     `json:"company_id"`
	ModuleKey string     `json:"module_key"`
	Module    *ModuleResponse `json:"module,omitempty"`
	Enabled   bool       `json:"enabled"`
	Config    string     `json:"config"`
	EnabledAt *time.Time `json:"enabled_at"`
	EnabledBy string     `json:"enabled_by"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func ToCompanyModuleResponse(cm *model.CompanyModule) CompanyModuleResponse {
	resp := CompanyModuleResponse{
		ID:        cm.ID,
		CompanyID: cm.CompanyID,
		ModuleKey: cm.ModuleKey,
		Enabled:   cm.Enabled,
		Config:    cm.Config,
		EnabledAt: cm.EnabledAt,
		EnabledBy: cm.EnabledBy,
		UpdatedAt: cm.UpdatedAt,
	}
	if cm.Module.Key != "" {
		mr := ToModuleResponse(&cm.Module)
		resp.Module = &mr
	}
	return resp
}

func ToCompanyModuleResponses(cms []model.CompanyModule) []CompanyModuleResponse {
	out := make([]CompanyModuleResponse, len(cms))
	for i := range cms {
		out[i] = ToCompanyModuleResponse(&cms[i])
	}
	return out
}

// SetCompanyModuleRequest is the payload for enabling/disabling a module for a company.
type SetCompanyModuleRequest struct {
	Enabled bool   `json:"enabled"`
	Config  string `json:"config"` // raw JSON string; empty = keep existing
}

// MyModulesResponse is what GET /api/me/modules returns — the effective list for the caller's company.
type MyModulesResponse struct {
	CompanyID       string   `json:"company_id"`
	EnabledModules  []string `json:"enabled_modules"`
}
