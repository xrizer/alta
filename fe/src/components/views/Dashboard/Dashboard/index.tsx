'use client';

import Overview from './Overview';
import { useAuth } from '@/contexts/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Typography from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import Analytics from './Analytics';

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();

  // Real-time clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Date / Time display
  const dayName = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
  });

  const dateStr = currentTime.toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h2>

      {/* Greeting + Date + Quick Actions */}
      <div className="rounded-xl border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800 px-4 py-4 space-y-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography variant="h1" color="primary">
              Halo, {user?.name || 'Alta'}!
            </Typography>
            <Typography variant="base">
              Here&apos;s your HR overview for today
            </Typography>
          </div>

          <div className="text-left sm:text-right">
            <Typography variant="base">
              {dayName}, {dateStr}
            </Typography>
            <Typography variant="base" color="secondary">
              {timeStr}
            </Typography>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Typography variant="base">Quick Actions</Typography>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <Button onClick={() => router.push('/dashboard/attendance')}>
              Review Attendance
            </Button>

            <Button
              onClick={() => router.push('/dashboard/leaves')}
              variant="primary-outline">
              Review Approval
            </Button>

            <Button
              onClick={() => router.push('/dashboard/payroll')}
              variant="primary-outline">
              Process Payroll
            </Button>
          </div>
        </div>
      </div>

      {/* Overview */}
      <Overview />

      {/* Analytics */}
      <Analytics />
    </div>
  );
}
