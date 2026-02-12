package dto

import "hris-backend/internal/model"

type CreateEmployeeSalaryRequest struct {
	EmployeeID         string  `json:"employee_id" validate:"required"`
	BasicSalary        float64 `json:"basic_salary" validate:"required"`
	TransportAllowance float64 `json:"transport_allowance"`
	MealAllowance      float64 `json:"meal_allowance"`
	HousingAllowance   float64 `json:"housing_allowance"`
	PositionAllowance  float64 `json:"position_allowance"`
	EffectiveDate      string  `json:"effective_date" validate:"required"`
}

type UpdateEmployeeSalaryRequest struct {
	BasicSalary        *float64 `json:"basic_salary"`
	TransportAllowance *float64 `json:"transport_allowance"`
	MealAllowance      *float64 `json:"meal_allowance"`
	HousingAllowance   *float64 `json:"housing_allowance"`
	PositionAllowance  *float64 `json:"position_allowance"`
	EffectiveDate      string   `json:"effective_date"`
}

type EmployeeSalaryResponse struct {
	ID                 string  `json:"id"`
	EmployeeID         string  `json:"employee_id"`
	BasicSalary        float64 `json:"basic_salary"`
	TransportAllowance float64 `json:"transport_allowance"`
	MealAllowance      float64 `json:"meal_allowance"`
	HousingAllowance   float64 `json:"housing_allowance"`
	PositionAllowance  float64 `json:"position_allowance"`
	BPJSKesEmployee    float64 `json:"bpjs_kes_employee"`
	BPJSKesCompany     float64 `json:"bpjs_kes_company"`
	BPJSTKJHTEmployee  float64 `json:"bpjs_tk_jht_employee"`
	BPJSTKJHTCompany   float64 `json:"bpjs_tk_jht_company"`
	BPJSTKJKK          float64 `json:"bpjs_tk_jkk"`
	BPJSTKJKM          float64 `json:"bpjs_tk_jkm"`
	BPJSTKJPEmployee   float64 `json:"bpjs_tk_jp_employee"`
	BPJSTKJPCompany    float64 `json:"bpjs_tk_jp_company"`
	EffectiveDate      string  `json:"effective_date"`
	CreatedAt          string  `json:"created_at"`
	UpdatedAt          string  `json:"updated_at"`
}

func ToEmployeeSalaryResponse(es *model.EmployeeSalary) EmployeeSalaryResponse {
	return EmployeeSalaryResponse{
		ID:                 es.ID,
		EmployeeID:         es.EmployeeID,
		BasicSalary:        es.BasicSalary,
		TransportAllowance: es.TransportAllowance,
		MealAllowance:      es.MealAllowance,
		HousingAllowance:   es.HousingAllowance,
		PositionAllowance:  es.PositionAllowance,
		BPJSKesEmployee:    es.BPJSKesEmployee,
		BPJSKesCompany:     es.BPJSKesCompany,
		BPJSTKJHTEmployee:  es.BPJSTKJHTEmployee,
		BPJSTKJHTCompany:   es.BPJSTKJHTCompany,
		BPJSTKJKK:          es.BPJSTKJKK,
		BPJSTKJKM:          es.BPJSTKJKM,
		BPJSTKJPEmployee:   es.BPJSTKJPEmployee,
		BPJSTKJPCompany:    es.BPJSTKJPCompany,
		EffectiveDate:      es.EffectiveDate.Format("2006-01-02"),
		CreatedAt:          es.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:          es.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}
}

func ToEmployeeSalaryResponses(salaries []model.EmployeeSalary) []EmployeeSalaryResponse {
	responses := make([]EmployeeSalaryResponse, len(salaries))
	for i, es := range salaries {
		responses[i] = ToEmployeeSalaryResponse(&es)
	}
	return responses
}
