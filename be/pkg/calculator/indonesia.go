package calculator

import "math"

// CalculateBPJS calculates BPJS contributions based on basic salary
// Returns: bpjsKesEmployee, bpjsKesCompany, jhtEmployee, jhtCompany, jkk, jkm, jpEmployee, jpCompany
func CalculateBPJS(basicSalary float64) (float64, float64, float64, float64, float64, float64, float64, float64) {
	// BPJS Kesehatan: Employee 1%, Company 4% (max basis salary 12,000,000)
	bpjsKesBasis := math.Min(basicSalary, 12000000)
	bpjsKesEmployee := math.Round(bpjsKesBasis * 0.01)
	bpjsKesCompany := math.Round(bpjsKesBasis * 0.04)

	// BPJS Ketenagakerjaan - JHT: Employee 2%, Company 3.7%
	jhtEmployee := math.Round(basicSalary * 0.02)
	jhtCompany := math.Round(basicSalary * 0.037)

	// JKK: 0.24% (low risk default)
	jkk := math.Round(basicSalary * 0.0024)

	// JKM: 0.3%
	jkm := math.Round(basicSalary * 0.003)

	// JP: Employee 1%, Company 2% (max basis salary 10,042,300 for 2024)
	jpBasis := math.Min(basicSalary, 10042300)
	jpEmployee := math.Round(jpBasis * 0.01)
	jpCompany := math.Round(jpBasis * 0.02)

	return bpjsKesEmployee, bpjsKesCompany, jhtEmployee, jhtCompany, jkk, jkm, jpEmployee, jpCompany
}

// CalculatePPh21Monthly calculates monthly PPh 21 income tax
// Uses progressive tax brackets (UU HPP 2022):
// 0 - 60,000,000 → 5%
// 60,000,001 - 250,000,000 → 15%
// 250,000,001 - 500,000,000 → 25%
// 500,000,001 - 5,000,000,000 → 30%
// > 5,000,000,000 → 35%
// PTKP (non-taxable income) for single: 54,000,000/year
func CalculatePPh21Monthly(annualGrossIncome float64, ptkp float64) float64 {
	if ptkp == 0 {
		ptkp = 54000000 // TK/0 (single, no dependents)
	}

	taxableIncome := annualGrossIncome - ptkp
	if taxableIncome <= 0 {
		return 0
	}

	var annualTax float64

	brackets := []struct {
		limit float64
		rate  float64
	}{
		{60000000, 0.05},
		{250000000, 0.15},
		{500000000, 0.25},
		{5000000000, 0.30},
		{math.MaxFloat64, 0.35},
	}

	remaining := taxableIncome
	prevLimit := 0.0

	for _, bracket := range brackets {
		bracketSize := bracket.limit - prevLimit
		if remaining <= 0 {
			break
		}
		taxable := math.Min(remaining, bracketSize)
		annualTax += taxable * bracket.rate
		remaining -= taxable
		prevLimit = bracket.limit
	}

	// Return monthly tax
	return math.Round(annualTax / 12)
}

// GetPTKP returns PTKP (Penghasilan Tidak Kena Pajak) based on marital status
// TK/0 = 54,000,000
// K/0 = 58,500,000
// K/1 = 63,000,000
// K/2 = 67,500,000
// K/3 = 72,000,000
func GetPTKP(maritalStatus string, dependents int) float64 {
	base := 54000000.0
	if maritalStatus == "kawin" {
		base = 58500000.0
	}
	// Each dependent adds 4,500,000 (max 3 dependents)
	deps := dependents
	if deps > 3 {
		deps = 3
	}
	return base + float64(deps)*4500000.0
}

// CalculateTHR calculates Tunjangan Hari Raya
// >= 12 months: 1x monthly salary
// < 12 months: proportional (months/12 * monthly salary)
func CalculateTHR(monthlySalary float64, monthsWorked int) float64 {
	if monthsWorked >= 12 {
		return monthlySalary
	}
	if monthsWorked <= 0 {
		return 0
	}
	return math.Round(float64(monthsWorked) / 12.0 * monthlySalary)
}

// CalculateOvertime calculates overtime pay per Indonesian law
// Per Kepmenakertrans No. 102/MEN/VI/2004:
// Weekday: hour 1 = 1.5x, hour 2+ = 2x hourly rate
// Holiday: hour 1-7 = 2x, hour 8 = 3x, hour 9+ = 4x hourly rate
// Hourly rate = 1/173 * monthly salary
func CalculateOvertime(monthlySalary float64, overtimeHours float64, isHoliday bool) float64 {
	hourlyRate := monthlySalary / 173.0

	if isHoliday {
		var pay float64
		remaining := overtimeHours
		if remaining > 0 {
			holidayBase := math.Min(remaining, 7)
			pay += holidayBase * 2 * hourlyRate
			remaining -= holidayBase
		}
		if remaining > 0 {
			hour8 := math.Min(remaining, 1)
			pay += hour8 * 3 * hourlyRate
			remaining -= hour8
		}
		if remaining > 0 {
			pay += remaining * 4 * hourlyRate
		}
		return math.Round(pay)
	}

	// Weekday overtime
	var pay float64
	remaining := overtimeHours
	if remaining > 0 {
		firstHour := math.Min(remaining, 1)
		pay += firstHour * 1.5 * hourlyRate
		remaining -= firstHour
	}
	if remaining > 0 {
		pay += remaining * 2 * hourlyRate
	}
	return math.Round(pay)
}
