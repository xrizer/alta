// Package modules is the code-defined catalog of feature modules.
// Adding a module = add an entry here + run a migration that inserts the row.
// The DB row is authoritative at runtime; this registry is the source of truth
// for seeding and for developer reference.
package modules

type ModuleDef struct {
	Key         string
	Name        string
	Description string
	Category    string
	DependsOn   []string
	IsCore      bool
}

// Registry enumerates every module known to the system.
// Core modules (IsCore=true) are always-on and cannot be disabled per company.
var Registry = []ModuleDef{
	// Core — always on for every company
	{Key: "dashboard", Name: "Dashboard", Category: "core", IsCore: true},
	{Key: "organization", Name: "Organization", Category: "core", IsCore: true,
		Description: "Companies, departments, positions, shifts, org structure"},
	{Key: "people", Name: "People", Category: "core", IsCore: true,
		Description: "Users & employees"},
	{Key: "attendance", Name: "Attendance", Category: "core", IsCore: true,
		Description: "Attendance records, clock in/out"},
	{Key: "leaves", Name: "Leaves", Category: "core", IsCore: true},
	{Key: "payroll", Name: "Payroll", Category: "core", IsCore: true},
	{Key: "administration", Name: "Administration", Category: "core", IsCore: true,
		Description: "Menu access, admin settings"},
	{Key: "settings", Name: "Settings", Category: "core", IsCore: true,
		Description: "Job levels, grades, company info"},

	// Opt-in — disabled by default per company
	{Key: "geo_attendance", Name: "GPS & Photo Attendance",
		Category: "attendance", DependsOn: []string{"attendance"},
		Description: "GPS coordinates and photo capture on clock in/out"},
	{Key: "visit_tracking", Name: "Multi-Point Visit Tracking",
		Category: "sales", DependsOn: []string{"attendance"},
		Description: "Track multiple sub-location visits within a single attendance session"},
	{Key: "visit_planning", Name: "Visit Planning",
		Category: "sales", DependsOn: []string{"visit_tracking"},
		Description: "Pre-plan visits and reconcile against actual visits"},
	{Key: "distributor_sync", Name: "Distributor Data Sync",
		Category: "sales",
		Description: "Pull external sales data from distributor systems"},
	{Key: "reimbursement", Name: "Reimbursement / Expense Claims",
		Category: "finance",
		Description: "Submit and approve expense reimbursements"},
	{Key: "loan", Name: "Employee Loans",
		Category: "finance",
		Description: "Record cash advances with payroll-deducted installments"},
	{Key: "overtime_request", Name: "Overtime Request",
		Category: "attendance",
		Description: "Pre-approval workflow for overtime"},
	{Key: "announcements", Name: "Announcements",
		Category: "company",
		Description: "Company-wide bulletin board"},
}

// IsCore returns true if the module is always-on regardless of company toggle.
func IsCore(key string) bool {
	for _, m := range Registry {
		if m.Key == key {
			return m.IsCore
		}
	}
	return false
}

// Find returns the registry entry for a key, or nil if unknown.
func Find(key string) *ModuleDef {
	for i := range Registry {
		if Registry[i].Key == key {
			return &Registry[i]
		}
	}
	return nil
}
