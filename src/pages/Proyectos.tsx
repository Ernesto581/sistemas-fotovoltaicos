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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Proyectos</h1>
          <p className="text-sm text-slate-500">{proyectos.length} proyectos</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/proyectos/nuevo')}>
          + Nuevo proyecto
        </button>
      </div>

      <Card>
        <CardHeader title="Lista de proyectos" />
        {proyectos.length === 0 ? (
          <Empty text="No hay proyectos. Crea uno nuevo." />
        ) : (
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
                      <button
                        className="text-red-500 hover:underline"
                        onClick={() => {
                          if (confirm(`¿Eliminar proyecto ${p.codigo}?`)) softDeleteRow('proyectos', p.id)
                        }}
                      >
                        Borrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
