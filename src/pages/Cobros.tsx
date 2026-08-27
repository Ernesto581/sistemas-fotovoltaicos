import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { computeTotales } from '../lib/calc'
import { fmtMoney } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'

export default function Cobros() {
  const proyectos = useLiveQuery(() => db.proyectos.filter((r) => !r.deleted).toArray(), [])
  const materiales = useLiveQuery(() => db.proyecto_materiales.filter((r) => !r.deleted).toArray(), [])
  const manoObra = useLiveQuery(() => db.mano_obra.filter((r) => !r.deleted).toArray(), [])
  const pagos = useLiveQuery(() => db.pagos.filter((r) => !r.deleted).toArray(), [])
  const gastos = useLiveQuery(() => db.gastos.filter((r) => !r.deleted).toArray(), [])
  const clientes = useLiveQuery(() => db.clientes.toArray(), [])

  if (!proyectos || !materiales || !manoObra || !pagos || !gastos) {
    return <div className="text-slate-400">Cargando…</div>
  }

  const nombreCliente = (id?: string) => clientes?.find((c) => c.id === id)?.nombre ?? ''

  const rows = proyectos.map((p) => ({
    p,
    t: computeTotales(
      materiales.filter((m) => m.proyecto_id === p.id),
      manoObra.filter((m) => m.proyecto_id === p.id),
      pagos.filter((x) => x.proyecto_id === p.id),
      gastos.filter((x) => x.proyecto_id === p.id),
    ),
  }))

  const tot = rows.reduce(
    (a, r) => ({
      gastos_mn: a.gastos_mn + r.t.gastos_mn,
      gastos_usd: a.gastos_usd + r.t.gastos_usd,
      pagado_mn: a.pagado_mn + r.t.pagado_mn,
      pagado_usd: a.pagado_usd + r.t.pagado_usd,
      queda_mn: a.queda_mn + r.t.queda_mn,
      queda_usd: a.queda_usd + r.t.queda_usd,
    }),
    { gastos_mn: 0, gastos_usd: 0, pagado_mn: 0, pagado_usd: 0, queda_mn: 0, queda_usd: 0 },
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Cobros / Recuperación</h1>
        <p className="text-sm text-slate-500">Qué se ha pagado y qué queda por recobrar</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Gastos totales</div>
          <div className="text-lg font-bold">
            {fmtMoney(tot.gastos_mn, 'MN')} / {fmtMoney(tot.gastos_usd, 'USD')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Pagado total</div>
          <div className="text-lg font-bold text-emerald-600">
            {fmtMoney(tot.pagado_mn, 'MN')} / {fmtMoney(tot.pagado_usd, 'USD')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Queda por recobrar</div>
          <div className="text-lg font-bold text-amber-600">
            {fmtMoney(tot.queda_mn, 'MN')} / {fmtMoney(tot.queda_usd, 'USD')}
          </div>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <Empty text="Sin datos." />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {rows.map(({ p, t }) => (
              <Card key={p.id} className="p-4">
                <Link to={`/proyectos/${p.id}`} className="block">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-brand-600">{p.codigo}</span>
                    <span className="text-sm text-slate-500">{nombreCliente(p.cliente_id) || p.nombre}</span>
                  </div>
                </Link>
                <div className="mt-2 space-y-1 text-sm">
                  <Fila label="Gastos" mn={t.gastos_mn} usd={t.gastos_usd} />
                  <Fila label="Pagado" mn={t.pagado_mn} usd={t.pagado_usd} tone="green" />
                  <Fila label="Queda" mn={t.queda_mn} usd={t.queda_usd} tone="amber" />
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card>
            <CardHeader title="Libro de recuperación" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-2">Proyecto</th>
                    <th className="px-4 py-2 text-right">Gastos MN</th>
                    <th className="px-4 py-2 text-right">Gastos USD</th>
                    <th className="px-4 py-2 text-right">Pagado MN</th>
                    <th className="px-4 py-2 text-right">Pagado USD</th>
                    <th className="px-4 py-2 text-right">Queda MN</th>
                    <th className="px-4 py-2 text-right">Queda USD</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ p, t }) => (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <Link to={`/proyectos/${p.id}`} className="font-medium text-brand-600">
                          {p.codigo}
                        </Link>{' '}
                        <span className="text-slate-500">{nombreCliente(p.cliente_id) || p.nombre}</span>
                      </td>
                      <td className="px-4 py-2 text-right">{fmtMoney(t.gastos_mn, 'MN')}</td>
                      <td className="px-4 py-2 text-right">{fmtMoney(t.gastos_usd, 'USD')}</td>
                      <td className="px-4 py-2 text-right">{fmtMoney(t.pagado_mn, 'MN')}</td>
                      <td className="px-4 py-2 text-right">{fmtMoney(t.pagado_usd, 'USD')}</td>
                      <td className="px-4 py-2 text-right font-medium text-amber-600">{fmtMoney(t.queda_mn, 'MN')}</td>
                      <td className="px-4 py-2 text-right font-medium text-amber-600">{fmtMoney(t.queda_usd, 'USD')}</td>
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

function Fila({ label, mn, usd, tone = 'default' }: { label: string; mn: number; usd: number; tone?: 'default' | 'green' | 'amber' }) {
  const tones: Record<string, string> = {
    default: 'text-slate-700',
    green: 'text-emerald-600',
    amber: 'text-amber-600',
  }
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${tones[tone]}`}>
        {fmtMoney(mn, 'MN')} / {fmtMoney(usd, 'USD')}
      </span>
    </div>
  )
}
