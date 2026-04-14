import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30s before refetch
      retry: (failCount, error: any) => {
        // Don't retry 4xx errors — they won't fix themselves
        if (error?.response?.status >= 400 && error?.response?.status < 500) return false;
        return failCount < 2;
      },
    },
  },
});
