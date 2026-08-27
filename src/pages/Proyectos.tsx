import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../lib/db'
import { softDeleteRow } from '../lib/sync'
import { fmtNum } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'

export default function Proyectos() {
  const navigate = useNavigate()
  const proyectos = useLiveQuery(() => db.proyectos.filter((r) => !r.deleted).toArray(), [])
  const clientes = useLiveQuery(() => db.clientes.filter((r) => !r.deleted).toArray(), [])

  if (!proyectos || !clientes) return <div className="text-slate-400">Cargando…</div>

  const nombreCliente = (id?: string) => clientes.find((c) => c.id === id)?.nombre ?? ''

  const borrar = (p: (typeof proyectos)[number]) => {
    if (confirm(`¿Eliminar proyecto ${p.codigo}?`)) softDeleteRow('proyectos', p.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Proyectos</h1>
          <p className="text-sm text-slate-500">{proyectos.length} proyectos</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/proyectos/nuevo')}>
          + Nuevo
        </button>
      </div>

      {proyectos.length === 0 ? (
        <Card>
          <Empty text="No hay proyectos. Crea uno nuevo." />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {proyectos.map((p) => (
              <Card key={p.id} className="p-4">
                <Link to={`/proyectos/${p.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-600">{p.codigo}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {p.estado}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{nombreCliente(p.cliente_id) || p.nombre}</div>
                  <div className="mt-2 flex gap-4 text-sm">
                    <span className="text-slate-500">
                      {fmtNum(p.watts)} kW
                    </span>
                    <span className="text-slate-500">
                      ${fmtNum(p.tarifa_mo)}/kW
                    </span>
                  </div>
                </Link>
                <div className="mt-2 flex justify-end">
                  <button className="text-sm text-red-500" onClick={() => borrar(p)}>
                    Borrar
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card>
            <CardHeader title="Lista de proyectos" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-2">Código</th>
                    <th className="px-4 py-2">Cliente</th>
                    <th className="px-4 py-2 text-right">Potencia (kW)</th>
                    <th className="px-4 py-2 text-right">Tarifa ($/kW)</th>
                    <th className="px-4 py-2">Estado</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {proyectos.map((p) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium text-brand-600">
                        <Link to={`/proyectos/${p.id}`}>{p.codigo}</Link>
                      </td>
                      <td className="px-4 py-2">{nombreCliente(p.cliente_id) || p.nombre}</td>
                      <td className="px-4 py-2 text-right">{fmtNum(p.watts)}</td>
                      <td className="px-4 py-2 text-right">${fmtNum(p.tarifa_mo)}</td>
                      <td className="px-4 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {p.estado}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button className="text-red-500 hover:underline" onClick={() => borrar(p)}>
                          Borrar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
