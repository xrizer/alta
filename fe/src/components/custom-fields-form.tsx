"use client";

import { CustomFieldDefinition } from "@/lib/types";

interface CustomFieldsFormProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  disabled?: boolean;
}

const inputClass =
  "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

export default function CustomFieldsForm({
  definitions,
  values,
  onChange,
  disabled = false,
}: CustomFieldsFormProps) {
  const activeDefs = definitions.filter((d) => d.is_active);
  if (activeDefs.length === 0) return null;

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Additional Information
      </h3>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {activeDefs.map((def) => {
          const raw = values[def.field_key];
          const required = def.is_required;

          switch (def.field_type) {
            case "text":
              return (
                <div key={def.id}>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {def.label}
                    {required && " *"}
                  </label>
                  <input
                    type="text"
                    value={typeof raw === "string" ? raw : ""}
                    required={required}
                    disabled={disabled}
                    onChange={(e) => onChange(def.field_key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              );
            case "number":
              return (
                <div key={def.id}>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {def.label}
                    {required && " *"}
                  </label>
                  <input
                    type="number"
                    value={
                      typeof raw === "number"
                        ? raw
                        : typeof raw === "string"
                        ? raw
                        : ""
                    }
                    required={required}
                    disabled={disabled}
                    onChange={(e) => {
                      const v = e.target.value;
                      onChange(def.field_key, v === "" ? "" : Number(v));
                    }}
                    className={inputClass}
                  />
                </div>
              );
            case "date":
              return (
                <div key={def.id}>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {def.label}
                    {required && " *"}
                  </label>
                  <input
                    type="date"
                    value={typeof raw === "string" ? raw.slice(0, 10) : ""}
                    required={required}
                    disabled={disabled}
                    onChange={(e) => onChange(def.field_key, e.target.value)}
                    className={inputClass}
                  />
                </div>
              );
            case "boolean":
              return (
                <div key={def.id} className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={raw === true}
                      disabled={disabled}
                      onChange={(e) => onChange(def.field_key, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                    />
                    {def.label}
                    {required && " *"}
                  </label>
                </div>
              );
            case "select":
              return (
                <div key={def.id}>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                    {def.label}
                    {required && " *"}
                  </label>
                  <select
                    value={typeof raw === "string" ? raw : ""}
                    required={required}
                    disabled={disabled}
                    onChange={(e) => onChange(def.field_key, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {(def.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

// Helper: strip empty values before submitting. Booleans are always kept.
export function serializeCustomValues(
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const def of definitions) {
    if (!def.is_active) continue;
    const v = values[def.field_key];
    if (def.field_type === "boolean") {
      out[def.field_key] = v === true;
      continue;
    }
    if (v === "" || v === null || v === undefined) continue;
    out[def.field_key] = v;
  }
  return out;
}
