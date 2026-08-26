import Dexie, { type Table } from 'dexie'
import type {
  Socio,
  Cliente,
  Material,
  MaterialAlias,
  Proyecto,
  ProyectoMaterial,
  ManoObra,
  Pago,
  Gasto,
  OutboxOp,
} from '../types'

export class AppDB extends Dexie {
  socios!: Table<Socio, string>
  clientes!: Table<Cliente, string>
  materiales!: Table<Material, string>
  material_alias!: Table<MaterialAlias, string>
  proyectos!: Table<Proyecto, string>
  proyecto_materiales!: Table<ProyectoMaterial, string>
  mano_obra!: Table<ManoObra, string>
  pagos!: Table<Pago, string>
  gastos!: Table<Gasto, string>
  outbox!: Table<OutboxOp, number>

  constructor() {
    super('sistemas-fotovoltaicos')
    this.version(1).stores({
      socios: 'id, nombre, updated_at',
      clientes: 'id, nombre, updated_at',
      materiales: 'id, nombre, updated_at',
      material_alias: 'id, material_id, alias, updated_at',
      proyectos: 'id, codigo, cliente_id, updated_at',
      proyecto_materiales: 'id, proyecto_id, material_id, updated_at',
      mano_obra: 'id, proyecto_id, updated_at',
      pagos: 'id, proyecto_id, updated_at',
      gastos: 'id, proyecto_id, updated_at',
      outbox: '++id, table, row_id',
    })
    this.version(2).stores({
      socios: 'id, nombre, updated_at, deleted',
      clientes: 'id, nombre, updated_at, deleted',
      materiales: 'id, nombre, updated_at, deleted',
      material_alias: 'id, material_id, alias, updated_at, deleted',
      proyectos: 'id, codigo, cliente_id, updated_at, deleted',
      proyecto_materiales: 'id, proyecto_id, material_id, updated_at, deleted',
      mano_obra: 'id, proyecto_id, updated_at, deleted',
      pagos: 'id, proyecto_id, updated_at, deleted',
      gastos: 'id, proyecto_id, updated_at, deleted',
      outbox: '++id, table, row_id',
    })
    this.version(3).stores({
      socios: 'id, nombre, updated_at',
      clientes: 'id, nombre, updated_at',
      materiales: 'id, nombre, updated_at',
      material_alias: 'id, material_id, alias, updated_at',
      proyectos: 'id, codigo, cliente_id, updated_at',
      proyecto_materiales: 'id, proyecto_id, material_id, updated_at',
      mano_obra: 'id, proyecto_id, updated_at',
      pagos: 'id, proyecto_id, updated_at',
      gastos: 'id, proyecto_id, updated_at',
      outbox: '++id, table, row_id',
    })
  }
}

export const db = new AppDB()

export const TABLE_NAMES = [
  'socios',
  'clientes',
  'materiales',
  'material_alias',
  'proyectos',
  'proyecto_materiales',
  'mano_obra',
  'pagos',
  'gastos',
] as const

export type TableName = (typeof TABLE_NAMES)[number]

export function tableRef(name: TableName) {
  return db[name] as unknown as Table<Record<string, unknown>, string>
}
