'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import Sidebar from '@/components/sidebar';
import Header from '@/components/header';
import Toaster from '@/components/ui/toaster';
import { defaultToaster, ToasterContext } from '@/contexts/ToasterContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { toaster, setToaster } = useContext(ToasterContext);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setToaster(defaultToaster);
    }, 3000);

    return () => {
      clearTimeout(timeout);
    };
  }, [toaster, setToaster]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}

          {toaster.type !== '' && (
            <Toaster type={toaster.type} message={toaster.message} />
          )}
        </main>
      </div>
    </div>
  );
}
