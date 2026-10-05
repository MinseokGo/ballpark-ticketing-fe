import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMe, login as loginRequest, signup as signupRequest } from '../api/auth'
import { getToken, setToken } from '../lib/authToken'

const TOKEN_KEY = ['auth', 'token'] as const

/**
 * 로그인 상태. 토큰은 query 캐시에 두어서 같은 화면의 모든 컴포넌트가 함께 바뀐다.
 * 토큰이 만료됐거나 틀리면 사용자 정보를 못 받아서 로그아웃 상태로 본다.
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const tokenQuery = useQuery({ queryKey: TOKEN_KEY, queryFn: () => getToken(), staleTime: Infinity })
  const token = tokenQuery.data ?? null
  const meQuery = useQuery({
    queryKey: ['me', token],
    queryFn: getMe,
    enabled: token !== null,
    retry: false,
  })

  const saveToken = (next: string | null) => {
    setToken(next)
    queryClient.setQueryData(TOKEN_KEY, next)
    queryClient.invalidateQueries({ queryKey: ['me'] })
    queryClient.invalidateQueries({ queryKey: ['myReservations'] })
  }

  const login = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => loginRequest(email, password),
    onSuccess: (result) => saveToken(result.token),
  })
  const signup = useMutation({
    mutationFn: ({ email, password, nickname }: { email: string; password: string; nickname: string }) =>
      signupRequest(email, password, nickname),
    onSuccess: (result) => saveToken(result.token),
  })

  const user = token !== null && meQuery.isSuccess ? meQuery.data : null
  return {
    user,
    loading: token !== null && meQuery.isPending,
    login,
    signup,
    logout: () => saveToken(null),
  }
}
