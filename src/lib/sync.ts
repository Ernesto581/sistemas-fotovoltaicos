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

const LAST_SYNC_KEY = 'sf_last_sync'

function getLastSync(): string {
  return localStorage.getItem(LAST_SYNC_KEY) || new Date(0).toISOString()
}

function setLastSync(iso: string) {
  localStorage.setItem(LAST_SYNC_KEY, iso)
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
  const lastSync = getLastSync()
  const fetchedAt = nowIso()
  for (const table of TABLE_NAMES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .gt('updated_at', lastSync)
      .order('updated_at', { ascending: true })
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
  setLastSync(fetchedAt)
}

export async function syncNow(): Promise<void> {
  if (!(await isOnline())) return
  await pushOutbox()
  await pullChanges()
}

export async function seedDefaultSocios(): Promise<void> {
  const count = await db.socios.count()
  if (count === 0) {
    for (const nombre of ['Raulin', 'Yo']) {
      await createRow('socios', { nombre })
    }
  }
}
