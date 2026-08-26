export type SocioId = string

export interface Socio {
  id: string
  nombre: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Cliente {
  id: string
  nombre: string
  lugar?: string
  contacto?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Material {
  id: string
  nombre: string
  unidad?: string
  precio_mn: number
  precio_usd: number
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface MaterialAlias {
  id: string
  material_id: string
  alias: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Proyecto {
  id: string
  codigo: string
  nombre: string
  cliente_id?: string
  watts: number
  tarifa_mo: number
  tarifa_tipo: 'W' | 'KW'
  fecha?: string
  estado: string
  notas?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface ProyectoMaterial {
  id: string
  proyecto_id: string
  material_id?: string
  descripcion: string
  cantidad: number
  usado?: number
  precio_mn: number
  precio_usd: number
  socio_comprador?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface ManoObra {
  id: string
  proyecto_id: string
  descripcion: string
  monto_mn: number
  monto_usd: number
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Pago {
  id: string
  proyecto_id: string
  fecha: string
  monto_mn: number
  monto_usd: number
  concepto: string
  socio?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface Gasto {
  id: string
  proyecto_id: string
  fecha: string
  descripcion: string
  monto_mn: number
  monto_usd: number
  socio?: string
  created_at: string
  updated_at: string
  deleted: boolean
}

export interface OutboxOp {
  id?: number
  table: string
  row_id: string
  op: 'upsert' | 'delete'
  created_at: number
}

export const ESTADOS = [
  'en proceso',
  'terminado',
  'pendiente',
  'cotizacion',
] as const
