'use client';

import { ToasterProvider } from '@/contexts/ToasterContext';
// import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ToasterProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </ToasterProvider>
    </QueryClientProvider>
  );
}
