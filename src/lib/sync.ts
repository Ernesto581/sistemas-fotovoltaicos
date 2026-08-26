import { supabase } from './supabase'
import { db, tableRef, TABLE_NAMES, type TableName } from './db'
import { uuid, nowIso } from './format'

export async function enqueue(table: TableName, rowId: string, op: 'upsert' | 'delete' = 'upsert') {
  await db.outbox.put({ table, row_id: rowId, op, created_at: Date.now() })
}

async function localWrite(table: TableName, row: Record<string, unknown>) {
  row.updated_at = nowIso()
  await (tableRef(table) as any).put(row)
  await enqueue(table, row.id as string)
}

export async function createRow<T extends { id?: string; created_at?: string; updated_at?: string }>(
  table: TableName,
  data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
): Promise<string> {
  const id = uuid()
  const now = nowIso()
  const row = { ...data, id, created_at: now, updated_at: now, deleted: false } as unknown as Record<
    string,
    unknown
  >
  await (tableRef(table) as any).put(row)
  await enqueue(table, id)
  return id
}

export async function updateRow<T extends { id: string; updated_at?: string }>(
  table: TableName,
  data: T,
): Promise<void> {
  const existing = await (tableRef(table) as any).get(data.id)
  const row = { ...(existing || {}), ...data, id: data.id }
  await localWrite(table, row)
}

export async function softDeleteRow(table: TableName, id: string): Promise<void> {
  const existing = await (tableRef(table) as any).get(id)
  if (!existing) return
  await localWrite(table, { ...existing, deleted: true })
}

export async function isOnline(): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, { method: 'HEAD' })
    return true
  } catch {
    return false
  }
}

async function pushOutbox(): Promise<void> {
  const ops = await db.outbox.toArray()
  for (const op of ops) {
    const row = await (tableRef(op.table as TableName) as any).get(op.row_id)
    if (!row) {
      if (op.id != null) await db.outbox.delete(op.id)
      continue
    }
    try {
      await supabase.from(op.table).upsert(row, { onConflict: 'id' })
      if (op.id != null) await db.outbox.delete(op.id)
    } catch (e) {
      console.warn('push falló para', op.table, op.row_id, e)
      return
    }
  }
}

async function pullChanges(): Promise<void> {
  for (const table of TABLE_NAMES) {
    const { data, error } = await supabase.from(table).select('*').order('updated_at', {
      ascending: true,
    })
    if (error) {
      console.warn('pull falló para', table, error)
      continue
    }
    for (const remote of data || []) {
      const local = await (tableRef(table) as any).get(remote.id)
      if (!local || (remote.updated_at as string) > (local.updated_at as string)) {
        await (tableRef(table) as any).put(remote)
      } else if ((local.updated_at as string) > (remote.updated_at as string)) {
        await enqueue(table, local.id)
      }
    }
  }
}

export async function syncNow(): Promise<void> {
  if (!(await isOnline())) return
  await pushOutbox()
  await pullChanges()
}

export async function seedDefaultSocios(): Promise<void> {
  const socios = [
    { id: '00000000-0000-0000-0000-000000000001', nombre: 'Raulin' },
    { id: '00000000-0000-0000-0000-000000000002', nombre: 'Avilio' },
  ]
  for (const s of socios) {
    const existe = await db.socios.get(s.id)
    if (existe) continue
    const now = nowIso()
    await db.socios.put({ id: s.id, nombre: s.nombre, created_at: now, updated_at: now, deleted: false })
    await enqueue('socios', s.id)
  }
}
