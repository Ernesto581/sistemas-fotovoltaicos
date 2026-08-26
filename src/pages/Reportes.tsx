import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../lib/db'
import { fmtMoney } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'

export default function Reportes() {
  const socios = useLiveQuery(() => db.socios.toArray(), [])
  const materiales = useLiveQuery(() => db.proyecto_materiales.filter(r => !r.deleted).toArray(), [])
  const gastos = useLiveQuery(() => db.gastos.filter(r => !r.deleted).toArray(), [])

  if (!socios || !materiales || !gastos) return <div className="text-slate-400">Cargando…</div>

  interface Fila {
    nombre: string
    materialesMn: number
    materialesUsd: number
    gastosMn: number
    gastosUsd: number
  }

  const filas: Fila[] = socios.map((s) => {
    const mats = materiales.filter((m) => m.socio_comprador === s.nombre)
    const gs = gastos.filter((g) => g.socio === s.nombre)
    const mn = mats.reduce((a, m) => a + (m.cantidad || 0) * (m.precio_mn || 0), 0)
    const usd = mats.reduce((a, m) => a + (m.cantidad || 0) * (m.precio_usd || 0), 0)
    const gmn = gs.reduce((a, g) => a + (g.monto_mn || 0), 0)
    const gusd = gs.reduce((a, g) => a + (g.monto_usd || 0), 0)
    return { nombre: s.nombre, materialesMn: mn, materialesUsd: usd, gastosMn: gmn, gastosUsd: gusd }
  })

  const todas: Fila[] = [
    ...filas,
    {
      nombre: 'Sin asignar',
      materialesMn: materiales
        .filter((m) => !m.socio_comprador)
        .reduce((a, m) => a + (m.cantidad || 0) * (m.precio_mn || 0), 0),
      materialesUsd: materiales
        .filter((m) => !m.socio_comprador)
        .reduce((a, m) => a + (m.cantidad || 0) * (m.precio_usd || 0), 0),
      gastosMn: gastos.filter((g) => !g.socio).reduce((a, g) => a + (g.monto_mn || 0), 0),
      gastosUsd: gastos.filter((g) => !g.socio).reduce((a, g) => a + (g.monto_usd || 0), 0),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Reparto entre socios</h1>
        <p className="text-sm text-slate-500">Cuánto puso cada socio en materiales y gastos</p>
      </div>

      <Card>
        <CardHeader title="Por socio" />
        {todas.length === 0 ? (
          <Empty text="Sin datos de socios." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-2">Socio</th>
                  <th className="px-4 py-2 text-right">Materiales MN</th>
                  <th className="px-4 py-2 text-right">Materiales USD</th>
                  <th className="px-4 py-2 text-right">Gastos MN</th>
                  <th className="px-4 py-2 text-right">Gastos USD</th>
                </tr>
              </thead>
              <tbody>
                {todas.map((f) => (
                  <tr key={f.nombre} className="border-b border-slate-50">
                    <td className="px-4 py-2 font-medium">{f.nombre}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(f.materialesMn, 'MN')}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(f.materialesUsd, 'USD')}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(f.gastosMn, 'MN')}</td>
                    <td className="px-4 py-2 text-right">{fmtMoney(f.gastosUsd, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        Para asignar un material o gasto a un socio, edítalo dentro de cada proyecto.
      </p>
    </div>
  )
}
