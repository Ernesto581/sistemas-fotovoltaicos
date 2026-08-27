import { db } from './db'
import { createRow, updateRow, softDeleteRow } from './sync'
import type { ProyectoMaterial } from '../types'

async function adjustStock(materialId: string | undefined, delta: number) {
  if (!materialId || !delta) return
  const mat = await db.materiales.get(materialId)
  if (!mat) return
  await updateRow('materiales', { id: materialId, stock: (mat.stock || 0) + delta } as never)
}

export async function addMaterialLine(
  proyectoId: string,
  data: {
    material_id?: string
    descripcion: string
    cantidad: number
    precio_mn: number
    precio_usd: number
  },
) {
  const id = await createRow('proyecto_materiales', { proyecto_id: proyectoId, ...data })
  if (data.material_id) await adjustStock(data.material_id, -data.cantidad)
  return id
}

export async function updateMaterialLine(id: string, patch: Partial<ProyectoMaterial>) {
  const line = await db.proyecto_materiales.get(id)
  if (line) {
    const cambia = patch.cantidad !== undefined || patch.material_id !== undefined
    if (cambia) {
      if (line.material_id) await adjustStock(line.material_id, line.cantidad)
      const newMat = patch.material_id !== undefined ? patch.material_id : line.material_id
      const newCant = patch.cantidad !== undefined ? patch.cantidad : line.cantidad
      if (newMat) await adjustStock(newMat, -newCant)
    }
  }
  await updateRow('proyecto_materiales', { id, ...patch } as ProyectoMaterial)
}

export async function deleteMaterialLine(id: string) {
  const line = await db.proyecto_materiales.get(id)
  await softDeleteRow('proyecto_materiales', id)
  if (line?.material_id) await adjustStock(line.material_id, line.cantidad)
}
