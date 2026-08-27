import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../lib/db'
import { createRow, updateRow, softDeleteRow } from '../lib/sync'
import { fmtMoney, fmtNum } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'

interface Form {
  id?: string
  nombre: string
  unidad: string
  precio_mn: string
  precio_usd: string
  stock: string
}

const empty: Form = { nombre: '', unidad: '', precio_mn: '', precio_usd: '', stock: '' }

export default function Materiales() {
  const materiales = useLiveQuery(() => db.materiales.filter((r) => !r.deleted).toArray(), [])
  const [form, setForm] = useState<Form>(empty)
  const [busqueda, setBusqueda] = useState('')

  if (!materiales) return <div className="text-slate-400">Cargando…</div>

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      nombre: form.nombre.trim(),
      unidad: form.unidad.trim(),
      precio_mn: Number(form.precio_mn) || 0,
      precio_usd: Number(form.precio_usd) || 0,
      stock: Number(form.stock) || 0,
    }
    if (!data.nombre) return
    if (form.id) await updateRow('materiales', { id: form.id, ...data })
    else await createRow('materiales', data)
    setForm(empty)
  }

  const editar = (m: (typeof materiales)[number]) => {
    setForm({
      id: m.id,
      nombre: m.nombre,
      unidad: m.unidad ?? '',
      precio_mn: String(m.precio_mn || ''),
      precio_usd: String(m.precio_usd || ''),
      stock: String(m.stock || ''),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtrados = materiales
    .filter((m) => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => a.nombre.localeCompare(b.nombre))

  const stockColor = (s: number) => (s > 0 ? 'text-emerald-600' : 'text-red-500')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Almacén de materiales</h1>
        <p className="text-sm text-slate-500">
          {materiales.length} materiales · el stock baja automáticamente al usarlos en un proyecto
        </p>
      </div>

      <Card className="p-4">
        <form onSubmit={guardar} className="grid grid-cols-1 gap-3 sm:grid-cols-6">
          <input
            className="input sm:col-span-2"
            placeholder="Nombre del material"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            className="input"
            placeholder="Unidad (m, u, L…)"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
          />
          <input
            className="input"
            placeholder="Precio MN"
            type="number"
            step="any"
            value={form.precio_mn}
            onChange={(e) => setForm({ ...form, precio_mn: e.target.value })}
          />
          <input
            className="input"
            placeholder="Precio USD"
            type="number"
            step="any"
            value={form.precio_usd}
            onChange={(e) => setForm({ ...form, precio_usd: e.target.value })}
          />
          <input
            className="input"
            placeholder="Stock inicial"
            type="number"
            step="any"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <div className="flex gap-2 sm:col-span-6">
            <button className="btn-primary" type="submit">
              {form.id ? 'Guardar cambios' : 'Agregar material'}
            </button>
            {form.id && (
              <button className="btn-secondary" type="button" onClick={() => setForm(empty)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <input
          className="input"
          placeholder="Buscar material…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <Empty text="Sin materiales. Agrega el primero arriba." />
        </Card>
      ) : (
        <>
          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {filtrados.map((m) => (
              <Card key={m.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-slate-800">{m.nombre}</div>
                    <div className="text-xs text-slate-400">{m.unidad || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${stockColor(m.stock || 0)}`}>
                      {fmtNum(m.stock)}
                    </div>
                    <div className="text-xs text-slate-400">stock</div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div className="space-x-3 text-slate-600">
                    <span>{fmtMoney(m.precio_mn, 'MN')}</span>
                    <span>{fmtMoney(m.precio_usd, 'USD')}</span>
                  </div>
                  <div className="space-x-3">
                    <button className="text-brand-600" onClick={() => editar(m)}>
                      Editar
                    </button>
                    <button
                      className="text-red-500"
                      onClick={() => {
                        if (confirm(`¿Eliminar "${m.nombre}"?`)) softDeleteRow('materiales', m.id)
                      }}
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: table */}
          <Card className="hidden sm:block">
            <CardHeader title="Materiales" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th className="px-4 py-2">Material</th>
                    <th className="px-4 py-2">Unidad</th>
                    <th className="px-4 py-2 text-right">Precio MN</th>
                    <th className="px-4 py-2 text-right">Precio USD</th>
                    <th className="px-4 py-2 text-right">Stock</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((m) => (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-2 font-medium">{m.nombre}</td>
                      <td className="px-4 py-2 text-slate-500">{m.unidad || '—'}</td>
                      <td className="px-4 py-2 text-right">{fmtMoney(m.precio_mn, 'MN')}</td>
                      <td className="px-4 py-2 text-right">{fmtMoney(m.precio_usd, 'USD')}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${stockColor(m.stock || 0)}`}>
                        {fmtNum(m.stock)}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button className="text-brand-600 hover:underline" onClick={() => editar(m)}>
                          Editar
                        </button>
                        <button
                          className="ml-3 text-red-500 hover:underline"
                          onClick={() => {
                            if (confirm(`¿Eliminar "${m.nombre}"?`)) softDeleteRow('materiales', m.id)
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
          </Card>
        </>
      )}
    </div>
  )
}
