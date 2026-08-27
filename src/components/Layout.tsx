import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const nav = [
  { to: '/', label: 'Inicio', icon: '▦', end: true },
  { to: '/materiales', label: 'Almacén', icon: '▤' },
  { to: '/proyectos', label: 'Proyectos', icon: '⚡' },
  { to: '/cobros', label: 'Cobros', icon: '$' },
]

export function Layout() {
  const { user, online, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-slate-900 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-xl">☀️</span>
          <span className="font-semibold">Sistemas Fotovoltaicos</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span
            className={`rounded-full px-2 py-1 ${online ? 'bg-emerald-600' : 'bg-slate-600'}`}
          >
            {online ? 'En línea' : 'Offline'}
          </span>
          <span className="hidden text-slate-300 sm:inline">{user?.email}</span>
          <button
            className="rounded-md px-2 py-1 text-slate-300 hover:bg-slate-700"
            onClick={async () => {
              await signOut()
              navigate('/login')
            }}
          >
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <nav className="hidden shrink-0 flex-col gap-1 border-r border-slate-200 bg-white py-3 sm:flex sm:w-48">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-sm ${
                  isActive
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span className="text-base">{n.icon}</span>
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 overflow-y-auto p-4 pb-24 sm:pb-4">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-slate-200 bg-white sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive ? 'text-brand-700' : 'text-slate-500'
              }`
            }
          >
            <span className="text-lg leading-none">{n.icon}</span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
