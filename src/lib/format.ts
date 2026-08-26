export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function fmtMoney(n: number | undefined | null, currency: 'MN' | 'USD'): string {
  const v = Number(n || 0)
  const rounded = Math.round(v * 100) / 100
  return new Intl.NumberFormat('es', {
    minimumFractionDigits: rounded % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded) + (currency === 'USD' ? ' USD' : ' MN')
}

export function fmtNum(n: number | undefined | null): string {
  return new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(Number(n || 0))
}

export function fechaLabel(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
