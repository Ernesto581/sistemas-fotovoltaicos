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
                    <div>
                      <div className="text-xs text-slate-400">Código</div>
                      <div className="font-semibold text-brand-600">{p.codigo}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {p.estado}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cliente</span>
                      <span className="font-medium text-slate-800">{nombreCliente(p.cliente_id) || p.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Potencia</span>
                      <span className="font-medium text-slate-800">{fmtNum(p.watts)} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tarifa</span>
                      <span className="font-medium text-slate-800">${fmtNum(p.tarifa_mo)}/kW</span>
                    </div>
                  </div>
                </Link>
                <div className="mt-3 flex justify-end border-t border-slate-100 pt-2">
                  <button className="text-sm text-red-500" onClick={() => borrar(p)}>
                    Borrar
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden sm:block">
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
