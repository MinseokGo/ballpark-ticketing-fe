import { useQuery } from '@tanstack/react-query'
import { listStandings } from '../api/standings'

/** 순위는 경기가 끝날 때마다 바뀌므로 30초마다 다시 받는다. */
export function useStandings() {
  return useQuery({
    queryKey: ['standings'],
    queryFn: listStandings,
    refetchInterval: 30_000,
  })
}
