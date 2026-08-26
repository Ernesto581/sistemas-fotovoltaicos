import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn, configError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    const res = await signIn(email.trim(), password)
    setBusy(false)
    if (res.error) setError(res.error)
    else navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-slate-900 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
        <div className="mb-6 text-center">
          <div className="text-3xl">☀️</div>
          <h1 className="mt-1 text-lg font-bold text-slate-800">Sistemas Fotovoltaicos</h1>
          <p className="text-xs text-slate-500">Inicia sesión para continuar</p>
        </div>
        {configError && (
          <div className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {configError}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="space-y-3">
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-slate-500">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-brand-600">
            Regístrate
          </Link>
        </p>
      </form>
    </div>
  )
}
