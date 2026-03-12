'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Company } from '@/lib/types';
import * as departmentService from '@/services/department-service';
import * as companyService from '@/services/company-service';

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    company_id: '',
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await companyService.getCompaniesAll();
        if (res.success && res.data)
          setCompanies(res.data.filter((c) => c.is_active));
      } catch {
        setError('Failed to fetch companies');
      }
    };
    fetchCompanies();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await departmentService.createDepartment(form);
      if (res.success) router.push('/dashboard/departments');
      else setError(res.message);
    } catch {
      setError('Failed to create department');
    } finally {
      setIsSubmitting(false);
    }
  };

  // export default function DepartmentsPage() {
  //   return (
  //     <div>
  //       <CreateDepartments />
  //     </div>
  //   );
  // }
}
