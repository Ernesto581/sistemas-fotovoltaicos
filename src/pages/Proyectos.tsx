import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../lib/db'
import { createRow, softDeleteRow } from '../lib/sync'
import { ESTADOS } from '../types'
import { fmtNum } from '../lib/format'
import { Card, CardHeader, Empty } from '../components/ui'

export default function Proyectos() {
  const proyectos = useLiveQuery(() => db.proyectos.where('deleted').equals(0).toArray(), [])
  const clientes = useLiveQuery(() => db.clientes.where('deleted').equals(0).toArray(), [])
  const [showForm, setShowForm] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [cliente, setCliente] = useState('')
  const [watts, setWatts] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [tarifaTipo, setTarifaTipo] = useState<'W' | 'KW'>('W')
  const [estado, setEstado] = useState<string>('en proceso')

  if (!proyectos || !clientes) return <div className="text-slate-400">Cargando…</div>

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    let clienteId: string | undefined
    const nombreCliente = cliente.trim()
    if (nombreCliente) {
      const existente = clientes.find(
        (c) => c.nombre.toLowerCase() === nombreCliente.toLowerCase(),
      )
      if (existente) clienteId = existente.id
      else clienteId = await createRow('clientes', { nombre: nombreCliente })
    }
    await createRow('proyectos', {
      codigo: codigo.trim() || `W${proyectos.length + 1}`,
      nombre: nombreCliente || codigo.trim(),
      cliente_id: clienteId,
      watts: Number(watts) || 0,
      tarifa_mo: Number(tarifa) || 0,
      tarifa_tipo: tarifaTipo,
      estado,
    })
    setShowForm(false)
    setCodigo('')
    setCliente('')
    setWatts('')
    setTarifa('')
  }

  const nombreCliente = (id?: string) => clientes.find((c) => c.id === id)?.nombre ?? ''

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Proyectos</h1>
          <p className="text-sm text-slate-500">{proyectos.length} proyectos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          + Nuevo proyecto
        </button>
      </div>

      {showForm && (
        <Card className="p-4">
          <form onSubmit={crear} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
            <input
              className="input"
              placeholder="Código (W38…)"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />
            <input
              className="input sm:col-span-2"
              list="clientes-list"
              placeholder="Cliente"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            />
            <datalist id="clientes-list">
              {clientes.map((c) => (
                <option key={c.id} value={c.nombre} />
              ))}
            </datalist>
            <input
              className="input"
              placeholder="Watts (ej. 3000)"
              type="number"
              value={watts}
              onChange={(e) => setWatts(e.target.value)}
            />
            <input
              className="input"
              placeholder="Tarifa MO ($/W)"
              type="number"
              step="any"
              value={tarifa}
              onChange={(e) => setTarifa(e.target.value)}
            />
            <select
              className="input"
              value={tarifaTipo}
              onChange={(e) => setTarifaTipo(e.target.value as 'W' | 'KW')}
            >
              <option value="W">por Watt</option>
              <option value="KW">por kW</option>
            </select>
            <div className="col-span-2 flex items-center gap-2 sm:col-span-6">
              <select className="input w-40" value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button className="btn-primary" type="submit">
                Crear
              </button>
              <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHeader title="Lista de proyectos" />
        {proyectos.length === 0 ? (
          <Empty text="No hay proyectos. Crea uno o importa el Excel." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="px-4 py-2">Código</th>
                  <th className="px-4 py-2">Cliente</th>
                  <th className="px-4 py-2 text-right">Watts</th>
                  <th className="px-4 py-2 text-right">Tarifa MO</th>
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
                    <td className="px-4 py-2 text-right">
                      ${fmtNum(p.tarifa_mo)}/{p.tarifa_tipo === 'W' ? 'W' : 'kW'}
                    </td>
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
