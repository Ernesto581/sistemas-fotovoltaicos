import { useMemo, useState } from 'react'
import { addMaterialLine } from '../lib/inventory'
import { fmtNum } from '../lib/format'
import type { Material } from '../types'

interface Props {
  proyectoId: string
  catalogo: Material[]
  socios: { id: string; nombre: string }[]
  onDone: () => void
  onCancel: () => void
}

export function MaterialLineForm({ proyectoId, catalogo, socios, onDone, onCancel }: Props) {
  const [modo, setModo] = useState<'almacen' | 'nuevo'>('almacen')
  const [materialId, setMaterialId] = useState('')
  const [nombre, setNombre] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioMn, setPrecioMn] = useState('')
  const [precioUsd, setPrecioUsd] = useState('')
  const [socio, setSocio] = useState('')
  const [busy, setBusy] = useState(false)

  const selected = useMemo(() => catalogo.find((m) => m.id === materialId), [materialId, catalogo])

  const elegirMaterial = (id: string) => {
    setMaterialId(id)
    const m = catalogo.find((x) => x.id === id)
    if (m) {
      setPrecioMn(String(m.precio_mn || ''))
      setPrecioUsd(String(m.precio_usd || ''))
      setNombre(m.nombre)
    }
  }

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault()
    const cant = Number(cantidad) || 0
    const descripcion = modo === 'almacen' ? (selected?.nombre ?? '') : nombre.trim()
    if (!descripcion || cant <= 0) return
    setBusy(true)
    try {
      await addMaterialLine(proyectoId, {
        descripcion,
        material_id: modo === 'almacen' ? materialId : undefined,
        cantidad: cant,
        precio_mn: Number(precioMn) || 0,
        precio_usd: Number(precioUsd) || 0,
        socio_comprador: socio || undefined,
      })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={guardar} className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn ${modo === 'almacen' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setModo('almacen')}
        >
          Del almacén
        </button>
        <button
          type="button"
          className={`btn ${modo === 'nuevo' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setModo('nuevo')}
        >
          Nuevo (solo este proyecto)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {modo === 'almacen' ? (
          <div className="col-span-2">
            <label className="label">Material</label>
            <select className="input" value={materialId} onChange={(e) => elegirMaterial(e.target.value)}>
              <option value="">Selecciona…</option>
              {catalogo.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} — stock {fmtNum(m.stock)}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-xs text-slate-500">
                Stock disponible: <span className="font-semibold">{fmtNum(selected.stock)}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="col-span-2">
            <label className="label">Nombre del material</label>
            <input
              className="input"
              placeholder="Ej. soporte especial"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="label">Cantidad</label>
          <input
            className="input"
            type="number"
            step="any"
            placeholder="0"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="label">Precio MN</label>
          <input
            className="input"
            type="number"
            step="any"
            placeholder="0"
            value={precioMn}
            onChange={(e) => setPrecioMn(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Precio USD</label>
          <input
            className="input"
            type="number"
            step="any"
            placeholder="0"
            value={precioUsd}
            onChange={(e) => setPrecioUsd(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Quién paga</label>
          <select className="input" value={socio} onChange={(e) => setSocio(e.target.value)}>
            <option value="">—</option>
            {socios.map((s) => (
              <option key={s.id} value={s.nombre}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn-primary" disabled={busy}>
          Agregar
        </button>
      </div>
    </form>
  )
}
