import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../lib/db'
import { createRow, updateRow, softDeleteRow } from '../lib/sync'
import { computeTotales } from '../lib/calc'
import { fmtMoney, fmtNum, nowIso } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'
import { generarCotizacion } from '../lib/cotizacion'
import type { ProyectoMaterial } from '../types'

export default function ProyectoDetalle() {
  const { id } = useParams<{ id: string }>()
  const proyecto = useLiveQuery(() => db.proyectos.get(id!), [id])
  const clientes = useLiveQuery(() => db.clientes.toArray(), [])
  const socios = useLiveQuery(() => db.socios.toArray(), [])
  const catalogo = useLiveQuery(() => db.materiales.where('deleted').equals(0).toArray(), [])
  const materiales = useLiveQuery(
    () => db.proyecto_materiales.where('proyecto_id').equals(id!).toArray(),
    [id],
  )
  const manoObra = useLiveQuery(() => db.mano_obra.where('proyecto_id').equals(id!).toArray(), [id])
  const pagos = useLiveQuery(() => db.pagos.where('proyecto_id').equals(id!).toArray(), [id])
  const gastos = useLiveQuery(() => db.gastos.where('proyecto_id').equals(id!).toArray(), [id])

  const [generando, setGenerando] = useState(false)

  const cliente = useMemo(
    () => clientes?.find((c) => c.id === proyecto?.cliente_id),
    [clientes, proyecto],
  )

  if (!proyecto) return <div className="text-slate-400">Cargando…</div>

  const totals = computeTotales(
    materiales ?? [],
    manoObra ?? [],
    pagos ?? [],
    gastos ?? [],
  )

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <Link to="/proyectos" className="text-sm text-brand-600 hover:underline">
            ← Proyectos
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-800">
            {proyecto.codigo} · {cliente?.nombre || proyecto.nombre}
          </h1>
          <p className="text-sm text-slate-500">
            {fmtNum(proyecto.watts)} W · MO ${fmtNum(proyecto.tarifa_mo)}/{proyecto.tarifa_tipo} ·{' '}
            {proyecto.estado}
          </p>
        </div>
        <button
          className="btn-primary"
          disabled={generando}
          onClick={async () => {
            setGenerando(true)
            try {
              await generarCotizacion({ proyecto, cliente: cliente?.nombre ?? proyecto.nombre, materiales: materiales ?? [], manoObra: manoObra ?? [], totals })
            } finally {
              setGenerando(false)
            }
          }}
        >
          {generando ? 'Generando…' : 'Cotización PDF'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500">Total (MN)</div>
          <div className="text-xl font-bold">{fmtMoney(totals.total_mn, 'MN')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Total (USD)</div>
          <div className="text-xl font-bold">{fmtMoney(totals.total_usd, 'USD')}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Pagado</div>
          <div className="text-xl font-bold text-emerald-600">
            {fmtMoney(totals.pagado_mn, 'MN')} / {fmtMoney(totals.pagado_usd, 'USD')}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500">Queda por cobrar</div>
          <div className="text-xl font-bold text-amber-600">
            {fmtMoney(totals.queda_mn, 'MN')} / {fmtMoney(totals.queda_usd, 'USD')}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Materiales"
          action={
            <button
              className="btn-secondary"
              onClick={() => createRow('proyecto_materiales', { proyecto_id: id!, descripcion: '', cantidad: 0, precio_mn: 0, precio_usd: 0 })}
            >
              + Material
            </button>
          }
        />
        {!materiales || materiales.length === 0 ? (
          <Empty text="Sin materiales. Agrega el primero." />
        ) : (
          <TablaMateriales items={materiales} catalogo={catalogo ?? []} socios={socios ?? []} />
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Mano de obra"
            action={
              <button
                className="btn-secondary"
                onClick={() => createRow('mano_obra', { proyecto_id: id!, descripcion: 'Mano de obra', monto_mn: 0, monto_usd: 0 })}
              >
                + MO
              </button>
            }
          />
          <ListaMonto
            items={(manoObra ?? []).map((m) => ({ id: m.id, descripcion: m.descripcion, monto_mn: m.monto_mn, monto_usd: m.monto_usd }))}
            onDesc={async (rid, v) => updateRow('mano_obra', { id: rid, descripcion: v } as never)}
            onMn={async (rid, v) => updateRow('mano_obra', { id: rid, monto_mn: v } as never)}
            onUsd={async (rid, v) => updateRow('mano_obra', { id: rid, monto_usd: v } as never)}
            onDel={(rid) => softDeleteRow('mano_obra', rid)}
          />
        </Card>

        <Card>
          <CardHeader
            title="Pagos del cliente"
            action={
              <button
                className="btn-secondary"
                onClick={() => createRow('pagos', { proyecto_id: id!, fecha: nowIso().slice(0, 10), monto_mn: 0, monto_usd: 0, concepto: '' })}
              >
                + Pago
              </button>
            }
          />
          <ListaMonto
            items={(pagos ?? []).map((m) => ({ id: m.id, descripcion: m.concepto || 'Pago', monto_mn: m.monto_mn, monto_usd: m.monto_usd }))}
            onDesc={async (rid, v) => updateRow('pagos', { id: rid, concepto: v } as never)}
            onMn={async (rid, v) => updateRow('pagos', { id: rid, monto_mn: v } as never)}
            onUsd={async (rid, v) => updateRow('pagos', { id: rid, monto_usd: v } as never)}
            onDel={(rid) => softDeleteRow('pagos', rid)}
          />
        </Card>

        <Card>
          <CardHeader
            title="Gastos"
            action={
              <button
                className="btn-secondary"
                onClick={() => createRow('gastos', { proyecto_id: id!, fecha: nowIso().slice(0, 10), descripcion: '', monto_mn: 0, monto_usd: 0 })}
              >
                + Gasto
              </button>
            }
          />
          <ListaMonto
            items={(gastos ?? []).map((m) => ({ id: m.id, descripcion: m.descripcion, monto_mn: m.monto_mn, monto_usd: m.monto_usd }))}
            onDesc={async (rid, v) => updateRow('gastos', { id: rid, descripcion: v } as never)}
            onMn={async (rid, v) => updateRow('gastos', { id: rid, monto_mn: v } as never)}
            onUsd={async (rid, v) => updateRow('gastos', { id: rid, monto_usd: v } as never)}
            onDel={(rid) => softDeleteRow('gastos', rid)}
          />
        </Card>
      </div>
    </div>
  )
}

function TablaMateriales({
  items,
  catalogo,
  socios,
}: {
  items: ProyectoMaterial[]
  catalogo: { id: string; nombre: string; precio_mn: number; precio_usd: number }[]
  socios: { id: string; nombre: string }[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
            <th className="px-4 py-2">Material</th>
            <th className="px-4 py-2 w-16 text-right">Cant</th>
            <th className="px-4 py-2 w-24 text-right">Precio MN</th>
            <th className="px-4 py-2 w-24 text-right">Precio USD</th>
            <th className="px-4 py-2 w-32">Quién paga</th>
            <th className="px-4 py-2 w-28 text-right">Total MN</th>
            <th className="px-4 py-2 w-28 text-right">Total USD</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => {
            const elegir = (nombre: string) => {
              const mat = catalogo.find((c) => c.nombre.toLowerCase() === nombre.toLowerCase())
              if (mat) {
                updateRow('proyecto_materiales', {
                  id: m.id,
                  descripcion: mat.nombre,
                  material_id: mat.id,
                  precio_mn: mat.precio_mn,
                  precio_usd: mat.precio_usd,
                } as never)
              } else {
                updateRow('proyecto_materiales', { id: m.id, descripcion: nombre } as never)
              }
            }
            return (
              <tr key={m.id} className="border-b border-slate-50">
                <td className="px-4 py-1">
                  <input
                    className="input border-0 px-1 py-1"
                    list={`cat-${m.id}`}
                    value={m.descripcion}
                    onChange={(e) => elegir(e.target.value)}
                  />
                  <datalist id={`cat-${m.id}`}>
                    {catalogo.map((c) => (
                      <option key={c.id} value={c.nombre} />
                    ))}
                  </datalist>
                </td>
                <td className="px-4 py-1">
                  <input
                    className="input border-0 px-1 py-1 text-right"
                    type="number"
                    step="any"
                    defaultValue={m.cantidad || ''}
                    onBlur={(e) => updateRow('proyecto_materiales', { id: m.id, cantidad: Number(e.target.value) || 0 } as never)}
                  />
                </td>
                <td className="px-4 py-1">
                  <input
                    className="input border-0 px-1 py-1 text-right"
                    type="number"
                    step="any"
                    defaultValue={m.precio_mn || ''}
                    onBlur={(e) => updateRow('proyecto_materiales', { id: m.id, precio_mn: Number(e.target.value) || 0 } as never)}
                  />
                </td>
                <td className="px-4 py-1">
                  <input
                    className="input border-0 px-1 py-1 text-right"
                    type="number"
                    step="any"
                    defaultValue={m.precio_usd || ''}
                    onBlur={(e) => updateRow('proyecto_materiales', { id: m.id, precio_usd: Number(e.target.value) || 0 } as never)}
                  />
                </td>
                <td className="px-4 py-1">
                  <select
                    className="input border-0 px-1 py-1"
                    value={m.socio_comprador ?? ''}
                    onChange={(e) => updateRow('proyecto_materiales', { id: m.id, socio_comprador: e.target.value } as never)}
                  >
                    <option value="">—</option>
                    {socios.map((s) => (
                      <option key={s.id} value={s.nombre}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-1 text-right">{fmtMoney((m.cantidad || 0) * (m.precio_mn || 0), 'MN')}</td>
                <td className="px-4 py-1 text-right">{fmtMoney((m.cantidad || 0) * (m.precio_usd || 0), 'USD')}</td>
                <td className="px-4 py-1 text-right">
                  <button className="text-red-500 hover:underline" onClick={() => softDeleteRow('proyecto_materiales', m.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ListaMonto({
  items,
  onDesc,
  onMn,
  onUsd,
  onDel,
}: {
  items: { id: string; descripcion: string; monto_mn: number; monto_usd: number }[]
  onDesc: (id: string, v: string) => void
  onMn: (id: string, v: number) => void
  onUsd: (id: string, v: number) => void
  onDel: (id: string) => void
}) {
  if (items.length === 0) return <Empty text="Vacío" />
  return (
    <div className="divide-y divide-slate-50">
      {items.map((m) => (
        <div key={m.id} className="flex items-center gap-2 px-4 py-2">
          <input
            className="input flex-1 border-0 px-1 py-1"
            value={m.descripcion}
            onChange={(e) => onDesc(m.id, e.target.value)}
          />
          <input
            className="input w-28 border-0 px-1 py-1 text-right"
            type="number"
            step="any"
            defaultValue={m.monto_mn || ''}
            placeholder="MN"
            onBlur={(e) => onMn(m.id, Number(e.target.value) || 0)}
          />
          <input
            className="input w-28 border-0 px-1 py-1 text-right"
            type="number"
            step="any"
            defaultValue={m.monto_usd || ''}
            placeholder="USD"
            onBlur={(e) => onUsd(m.id, Number(e.target.value) || 0)}
          />
          <button className="text-red-500" onClick={() => onDel(m.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
