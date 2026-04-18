"use client";

import { useState, useEffect, useCallback } from "react";
import { CustomFieldDefinition, CustomFieldType } from "@/lib/types";
import { useAuth } from "@/contexts/auth-context";
import * as companyService from "@/services/company-service";
import * as customFieldService from "@/services/custom-field-service";
import { getErrorMessage } from "@/lib/api";
import { SquarePen, Trash, Plus } from "lucide-react";

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean (checkbox)" },
  { value: "select", label: "Select (dropdown)" },
];

export default function CustomFieldsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [defs, setDefs] = useState<CustomFieldDefinition[]>([]);
  const [companyID, setCompanyID] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [formType, setFormType] = useState<CustomFieldType>("text");
  const [formOptions, setFormOptions] = useState("");
  const [formRequired, setFormRequired] = useState(false);
  const [formOrder, setFormOrder] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const fetchDefs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [compRes, defsRes] = await Promise.allSettled([
        companyService.getCompaniesAll(),
        customFieldService.getCustomFields(),
      ]);
      if (
        compRes.status === "fulfilled" &&
        compRes.value.success &&
        compRes.value.data?.length
      ) {
        setCompanyID(compRes.value.data[0].id);
      }
      if (defsRes.status === "fulfilled" && defsRes.value.success) {
        setDefs(defsRes.value.data || []);
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to fetch custom fields"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefs();
  }, [fetchDefs]);

  const openCreate = () => {
    setEditing(null);
    setFormKey("");
    setFormLabel("");
    setFormType("text");
    setFormOptions("");
    setFormRequired(false);
    setFormOrder(defs.length + 1);
    setShowModal(true);
  };

  const openEdit = (d: CustomFieldDefinition) => {
    setEditing(d);
    setFormKey(d.field_key);
    setFormLabel(d.label);
    setFormType(d.field_type);
    setFormOptions((d.options || []).join("\n"));
    setFormRequired(d.is_required);
    setFormOrder(d.display_order);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim()) return;
    if (!editing && !formKey.trim()) return;
    setIsSaving(true);
    setError("");
    try {
      const options = formOptions
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      if (editing) {
        const res = await customFieldService.updateCustomField(editing.id, {
          label: formLabel,
          field_type: formType,
          options: formType === "select" ? options : undefined,
          is_required: formRequired,
          display_order: formOrder,
        });
        if (!res.success) {
          setError(res.message);
          return;
        }
        setSuccess("Custom field updated");
      } else {
        if (!companyID) {
          setError("No company found — create a company first");
          return;
        }
        const res = await customFieldService.createCustomField({
          company_id: companyID,
          field_key: formKey,
          label: formLabel,
          field_type: formType,
          options: formType === "select" ? options : undefined,
          is_required: formRequired,
          display_order: formOrder,
        });
        if (!res.success) {
          setError(res.message);
          return;
        }
        setSuccess("Custom field created");
      }
      setShowModal(false);
      await fetchDefs();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save custom field"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this custom field? Existing values will remain on records but stop rendering.")) return;
    try {
      const res = await customFieldService.deleteCustomField(id);
      if (!res.success) {
        setError(res.message);
        return;
      }
      setSuccess("Custom field deleted");
      await fetchDefs();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete custom field"));
    }
  };

  const toggleActive = async (d: CustomFieldDefinition) => {
    try {
      const res = await customFieldService.updateCustomField(d.id, {
        is_active: !d.is_active,
      });
      if (!res.success) setError(res.message);
      else await fetchDefs();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to toggle status"));
    }
  };

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Custom Fields
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Define company-specific employee fields (stored as JSONB)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            <Plus size={16} /> New Field
          </button>
        )}
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Required</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">Loading...</td>
              </tr>
            ) : defs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  No custom fields yet. Create one to capture company-specific employee data.
                </td>
              </tr>
            ) : (
              defs.map((d) => (
                <tr key={d.id} className="text-gray-900 dark:text-gray-100">
                  <td className="px-4 py-3 font-medium">{d.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.field_key}</td>
                  <td className="px-4 py-3">{d.field_type}</td>
                  <td className="px-4 py-3">{d.is_required ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{d.display_order}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => isAdmin && toggleActive(d)}
                      disabled={!isAdmin}
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        d.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-700"
                      } ${isAdmin ? "cursor-pointer hover:opacity-80" : ""}`}
                    >
                      {d.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                          title="Edit"
                        >
                          <SquarePen size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="rounded p-1.5 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? "Edit Custom Field" : "Create Custom Field"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">Label *</label>
                <input
                  value={formLabel}
                  onChange={(e) => setFormLabel(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. T-Shirt Size"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">
                  Field Key {editing ? "(read-only)" : "*"}
                </label>
                <input
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  disabled={!!editing}
                  className={`${inputClass} ${editing ? "opacity-60" : ""}`}
                  placeholder="e.g. tshirt_size (snake_case)"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, digits and underscores; starts with a letter. Used as the JSON key.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as CustomFieldType)}
                  className={inputClass}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {formType === "select" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">Options</label>
                  <textarea
                    value={formOptions}
                    onChange={(e) => setFormOptions(e.target.value)}
                    className={`${inputClass} min-h-[100px] font-mono text-xs`}
                    placeholder="One option per line&#10;e.g.&#10;Small&#10;Medium&#10;Large"
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={formRequired}
                    onChange={(e) => setFormRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  Required
                </label>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-300">Display Order</label>
                  <input
                    type="number"
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value) || 0)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
