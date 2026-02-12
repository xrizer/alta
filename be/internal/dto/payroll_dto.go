package dto

import "hris-backend/internal/model"

type GeneratePayrollRequest struct {
	EmployeeID string `json:"employee_id" validate:"required"`
	Month      int    `json:"month" validate:"required"`
	Year       int    `json:"year" validate:"required"`
}

type UpdatePayrollRequest struct {
	OvertimePay     *float64 `json:"overtime_pay"`
	THR             *float64 `json:"thr"`
	OtherDeductions *float64 `json:"other_deductions"`
	Notes           string   `json:"notes"`
}

type PayrollStatusRequest struct {
	Status model.PayrollStatus `json:"status" validate:"required"`
}

type PayrollResponse struct {
	ID               string              `json:"id"`
	EmployeeID       string              `json:"employee_id"`
	Employee         *EmployeeResponse   `json:"employee,omitempty"`
	PeriodMonth      int                 `json:"period_month"`
	PeriodYear       int                 `json:"period_year"`
	WorkingDays      int                 `json:"working_days"`
	PresentDays      int                 `json:"present_days"`
	BasicSalary      float64             `json:"basic_salary"`
	TotalAllowances  float64             `json:"total_allowances"`
	OvertimePay      float64             `json:"overtime_pay"`
	THR              float64             `json:"thr"`
	GrossSalary      float64             `json:"gross_salary"`
	TotalDeductions  float64             `json:"total_deductions"`
	BPJSKesDeduction float64             `json:"bpjs_kes_deduction"`
	BPJSTKDeduction  float64             `json:"bpjs_tk_deduction"`
	PPH21            float64             `json:"pph21"`
	OtherDeductions  float64             `json:"other_deductions"`
	NetSalary        float64             `json:"net_salary"`
	Status           model.PayrollStatus `json:"status"`
	PaidAt           string              `json:"paid_at"`
	Notes            string              `json:"notes"`
	CreatedAt        string              `json:"created_at"`
	UpdatedAt        string              `json:"updated_at"`
}

func ToPayrollResponse(p *model.Payroll) PayrollResponse {
	resp := PayrollResponse{
		ID:               p.ID,
		EmployeeID:       p.EmployeeID,
		PeriodMonth:      p.PeriodMonth,
		PeriodYear:       p.PeriodYear,
		WorkingDays:      p.WorkingDays,
		PresentDays:      p.PresentDays,
		BasicSalary:      p.BasicSalary,
		TotalAllowances:  p.TotalAllowances,
		OvertimePay:      p.OvertimePay,
		THR:              p.THR,
		GrossSalary:      p.GrossSalary,
		TotalDeductions:  p.TotalDeductions,
		BPJSKesDeduction: p.BPJSKesDeduction,
		BPJSTKDeduction:  p.BPJSTKDeduction,
		PPH21:            p.PPH21,
		OtherDeductions:  p.OtherDeductions,
		NetSalary:        p.NetSalary,
		Status:           p.Status,
		Notes:            p.Notes,
		CreatedAt:        p.CreatedAt.Format("2006-01-02T15:04:05Z"),
		UpdatedAt:        p.UpdatedAt.Format("2006-01-02T15:04:05Z"),
	}

	if p.PaidAt != nil {
		resp.PaidAt = p.PaidAt.Format("2006-01-02T15:04:05Z")
	}

	if p.Employee.ID != "" {
		empResp := ToEmployeeResponse(&p.Employee)
		resp.Employee = &empResp
	}

	return resp
}

func ToPayrollResponses(payrolls []model.Payroll) []PayrollResponse {
	responses := make([]PayrollResponse, len(payrolls))
	for i, p := range payrolls {
		responses[i] = ToPayrollResponse(&p)
	}
	return responses
}
