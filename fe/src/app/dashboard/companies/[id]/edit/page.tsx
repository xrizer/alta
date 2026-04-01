"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import * as companyService from "@/services/company-service";

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params.id as string;
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", address: "", phone: "", email: "", npwp: "", is_active: true,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await companyService.getCompanyById(companyId);
        if (res.success && res.data) {
          setForm({
            name: res.data.name, address: res.data.address || "", phone: res.data.phone || "",
            email: res.data.email || "", npwp: res.data.npwp || "", is_active: res.data.is_active,
          });
        } else setError("Company not found");
      } catch { setError("Failed to fetch company"); }
      finally { setIsLoading(false); }
    };
    fetch();
  }, [companyId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    else setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await companyService.updateCompany(companyId, form);
      if (res.success) router.push("/dashboard/companies");
      else setError(res.message);
    } catch { setError("Failed to update company"); }
    finally { setIsSubmitting(false); }
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><div className="text-gray-500">Loading...</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Company</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Update company information</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Name</label>
            <input name="name" value={form.name} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white">NPWP</label>
            <input name="npwp" value={form.npwp} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white">Address</label>
          <textarea name="address" rows={3} value={form.address} onChange={handleChange} className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="is_active" id="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-orange-500 accent-orange-500" />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</label>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-medium text-orange-500 hover:bg-orange-50">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting ? "Updating..." : "Update Company"}</button>
        </div>
      </form>
    </div>
  );
}
