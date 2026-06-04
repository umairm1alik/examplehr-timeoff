import { QueryClient } from '@tanstack/react-query'

let queryClientInstance: QueryClient | null = null

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30_000,
          refetchInterval: 30_000,
          retry: 1,
        },
      },
    })
  }
  return queryClientInstance
}
