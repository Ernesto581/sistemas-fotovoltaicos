import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../lib/db'
import { createRow, updateRow } from '../lib/sync'
import { ESTADOS, type Proyecto } from '../types'

interface Props {
  initial?: Proyecto
  initialClienteNombre?: string
  onDone: () => void
  onCancel: () => void
}

export function ProjectForm({ initial, initialClienteNombre, onDone, onCancel }: Props) {
  const clientes = useLiveQuery(() => db.clientes.filter((r) => !r.deleted).toArray(), [])

  const [codigo, setCodigo] = useState(initial?.codigo ?? '')
  const [cliente, setCliente] = useState(initialClienteNombre ?? '')
  const [potencia, setPotencia] = useState(initial ? String(initial.watts || '') : '')
  const [tarifa, setTarifa] = useState(initial ? String(initial.tarifa_mo || '') : '')
  const [estado, setEstado] = useState(initial?.estado ?? 'en proceso')
  const [fecha, setFecha] = useState(initial?.fecha ?? '')
  const [notas, setNotas] = useState(initial?.notas ?? '')
  const [busy, setBusy] = useState(false)

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      let clienteId: string | undefined
      const nombreCliente = cliente.trim()
      if (nombreCliente) {
        const existente = clientes?.find(
          (c) => c.nombre.toLowerCase() === nombreCliente.toLowerCase(),
        )
        if (existente) clienteId = existente.id
        else clienteId = await createRow('clientes', { nombre: nombreCliente })
      }

      const data = {
        codigo: codigo.trim() || `W${Date.now().toString().slice(-4)}`,
        nombre: nombreCliente || codigo.trim() || 'Proyecto',
        cliente_id: clienteId,
        watts: Number(potencia) || 0,
        tarifa_mo: Number(tarifa) || 0,
        tarifa_tipo: 'KW' as const,
        estado,
        fecha: fecha || undefined,
        notas: notas.trim() || undefined,
      }

      if (initial?.id) {
        await updateRow('proyectos', { id: initial.id, ...data })
      } else {
        await createRow('proyectos', data)
      }
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Código</label>
          <input
            className="input"
            placeholder="W38"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">Déjalo vacío para autogenerar.</p>
        </div>

        <div>
          <label className="label">Cliente</label>
          <input
            className="input"
            list="clientes-list"
            placeholder="Nombre del cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            required
          />
          <datalist id="clientes-list">
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="label">Potencia (kW)</label>
          <input
            className="input"
            type="number"
            step="any"
            placeholder="Ej. 6"
            value={potencia}
            onChange={(e) => setPotencia(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Tarifa mano de obra ($/kW)</label>
          <input
            className="input"
            type="number"
            step="any"
            placeholder="Ej. 50"
            value={tarifa}
            onChange={(e) => setTarifa(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Estado</label>
          <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {ESTADOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Fecha</label>
          <input
            className="input"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea
          className="input min-h-20"
          placeholder="Observaciones del proyecto…"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Guardando…' : initial?.id ? 'Guardar cambios' : 'Crear proyecto'}
        </button>
      </div>
    </form>
  )
}
