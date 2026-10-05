import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorBanner } from '../components/Banner'
import { ApiError } from '../api/client'
import { useAuth } from '../hooks/useAuth'

/** 로그인과 가입을 한 화면에서 전환한다. 성공하면 홈으로 간다. */
export function AuthPage() {
  const navigate = useNavigate()
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const pending = login.isPending || signup.isPending
  const error = login.error ?? signup.error
  const isSignup = mode === 'signup'

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (isSignup) {
      signup.mutate({ email, password, nickname }, { onSuccess: () => navigate('/') })
    } else {
      login.mutate({ email, password }, { onSuccess: () => navigate('/') })
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400 dark:border-slate-700 dark:bg-slate-900'

  return (
    <div className="mx-auto max-w-md space-y-6 py-6">
      <header className="animate-fade-up space-y-1 text-center">
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">{isSignup ? '처음 오셨나요?' : '다시 오셨네요'}</p>
        <h1 className="text-3xl font-extrabold tracking-tight">{isSignup ? '회원가입' : '로그인'}</h1>
      </header>

      <form onSubmit={submit} className="animate-fade-up space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <label className="block space-y-1.5 text-sm font-semibold">
          이메일
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} autoComplete="email" />
        </label>
        {isSignup && (
          <label className="block space-y-1.5 text-sm font-semibold">
            닉네임
            <input required maxLength={20} value={nickname} onChange={(event) => setNickname(event.target.value)} className={inputClass} />
          </label>
        )}
        <label className="block space-y-1.5 text-sm font-semibold">
          비밀번호 {isSignup && <span className="font-normal text-slate-500">(8자 이상)</span>}
          <input
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </label>

        {error instanceof ApiError && <ErrorBanner error={error} />}

        <button
          type="submit"
          disabled={pending}
          className="press w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-blue-600/30 hover:bg-blue-700 disabled:opacity-40"
        >
          {pending ? '잠시만요...' : isSignup ? '가입하고 시작하기' : '로그인'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500">
        {isSignup ? '이미 계정이 있나요?' : '계정이 없나요?'}{' '}
        <button
          type="button"
          onClick={() => setMode(isSignup ? 'login' : 'signup')}
          className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          {isSignup ? '로그인하기' : '회원가입하기'}
        </button>
      </p>
      <p className="text-center text-xs text-slate-400">
        <Link to="/" className="hover:underline">
          나중에 할게요
        </Link>
      </p>
    </div>
  )
}
