import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { computeTotales } from '../lib/calc'
import { fmtMoney, fmtNum } from '../lib/format'
import { Stat, Card, CardHeader, Empty } from '../components/ui'

export default function Dashboard() {
  const proyectos = useLiveQuery(() => db.proyectos.where('deleted').equals(0).toArray(), [])
  const materiales = useLiveQuery(
    () => db.proyecto_materiales.where('deleted').equals(0).toArray(),
    [],
  )
  const manoObra = useLiveQuery(() => db.mano_obra.where('deleted').equals(0).toArray(), [])
  const pagos = useLiveQuery(() => db.pagos.where('deleted').equals(0).toArray(), [])
  const gastos = useLiveQuery(() => db.gastos.where('deleted').equals(0).toArray(), [])
  const clientes = useLiveQuery(() => db.clientes.toArray(), [])

  if (!proyectos || !materiales || !manoObra || !pagos || !gastos) {
    return <div className="text-slate-400">Cargando…</div>
  }

  const clienteNombre = (id?: string) => clientes?.find((c) => c.id === id)?.nombre ?? ''

  const rows = proyectos.map((p) => {
    const t = computeTotales(
      materiales.filter((m) => m.proyecto_id === p.id),
      manoObra.filter((m) => m.proyecto_id === p.id),
      pagos.filter((x) => x.proyecto_id === p.id),
      gastos.filter((x) => x.proyecto_id === p.id),
    )
    return { p, t }
  })

  const quedaMn = rows.reduce((a, r) => a + r.t.queda_mn, 0)
  const quedaUsd = rows.reduce((a, r) => a + r.t.queda_usd, 0)
  const totalMn = rows.reduce((a, r) => a + r.t.total_mn, 0)
  const activos = proyectos.filter((p) => p.estado !== 'terminado').length

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Resumen</h1>
        <p className="text-sm text-slate-500">Estado general del negocio</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Proyectos activos" value={fmtNum(activos)} sub={`${proyectos.length} en total`} />
        <Stat label="Por cobrar (MN)" value={fmtMoney(quedaMn, 'MN')} tone={quedaMn > 0 ? 'amber' : 'default'} />
        <Stat label="Por cobrar (USD)" value={fmtMoney(quedaUsd, 'USD')} tone={quedaUsd > 0 ? 'amber' : 'default'} />
        <Stat label="Total facturado (MN)" value={fmtMoney(totalMn, 'MN')} />
      </div>

      <Card>
        <CardHeader
          title="Proyectos y saldos pendientes"
          action={
            <Link to="/proyectos" className="text-sm font-medium text-brand-600">
              Ver todos
            </Link>
          }
        />
        {rows.length === 0 ? (
          <Empty text="No hay proyectos todavía. Importa el Excel o crea uno nuevo." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-2">Código</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2 text-right">Total MN</th>
                  <th className="px-4 py-2 text-right">Total USD</th>
                  <th className="px-4 py-2 text-right">Pagado</th>
                  <th className="px-4 py-2 text-right">Queda MN</th>
                  <th className="px-4 py-2 text-right">Queda USD</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ p, t }) => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium text-brand-600">
                      <Link to={`/proyectos/${p.id}`}>{p.codigo}</Link>
                    </td>
                    <td className="px-4 py-2">{clienteNombre(p.cliente_id) || p.nombre}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(t.total_mn, 'MN')}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(t.total_usd, 'USD')}</td>
                    <td className="px-4 py-2 text-right text-slate-500">
                      {fmtMoney(t.pagado_mn, 'MN')} / {fmtMoney(t.pagado_usd, 'USD')}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${t.queda_mn > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {fmtMoney(t.queda_mn, 'MN')}
                    </td>
                    <td className={`px-4 py-2 text-right font-medium ${t.queda_usd > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {fmtMoney(t.queda_usd, 'USD')}
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
