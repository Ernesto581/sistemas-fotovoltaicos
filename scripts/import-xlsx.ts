import * as XLSX from 'xlsx'
import { randomUUID } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const XLSX_PATH =
  process.env.XLSX_PATH ||
  'G:/Cosas Ernesto/((Trabajo/(((mios/Sistemas F/Sistemas_Fotovoltaicos.xlsx'

// ---------- helpers ----------
const esc = (s: string) => (s ?? '').replace(/'/g, "''")
const num = (v: unknown): number => {
  const s = String(v ?? '').trim()
  if (!s) return 0
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) return 0 // fecha
  const n = parseFloat(s.replace(/[^\d.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}
const str = (v: unknown): string => String(v ?? '').trim()

const HEADERS = /^(item|SUBTOTAL|sub totales|total|totales|materiales|mano|moneda|moneda\b|W\b|FECHA|Gastos|Pagado|Logrado|Queda|Anterior|Hoy|Yo|Raulin|MN|USD|X|Lugar|Sub\b|proyecto)/i

function canonical(name: string): string {
  return name
    .toLowerCase()
    .replace(/\*\*\*/g, '')
    .replace(/\(\s*\+?\s*caro\s*\)/g, 'mas caro')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSkip(item: string): boolean {
  const t = item.trim()
  if (!t) return true
  if (HEADERS.test(t)) return true
  if (/^(sub totales|subtotal|total|totales|total usd|total inversor|total mn)/i.test(t)) return true
  return false
}

// ---------- state ----------
const socios = new Map<string, string>() // nombre -> id
const clientes = new Map<string, string>() // nombre -> id
const materiales = new Map<string, { id: string; nombre: string }>() // canonical -> {id,nombre}
const proyectos: any[] = []
const proyecto_materiales: any[] = []
const mano_obra: any[] = []
const pagos: any[] = []
const gastos: any[] = []

function socioId(nombre: string): string | null {
  const n = nombre.trim()
  if (!n) return null
  if (!socios.has(n)) socios.set(n, randomUUID())
  return socios.get(n)!
}
function clienteId(nombre: string): string | null {
  const n = nombre.trim()
  if (!n) return null
  if (!clientes.has(n)) clientes.set(n, randomUUID())
  return clientes.get(n)!
}
function materialId(nombre: string): string {
  const key = canonical(nombre)
  if (!materiales.has(key)) materiales.set(key, { id: randomUUID(), nombre: nombre.trim() })
  return materiales.get(key)!.id
}

// ---------- main ----------
console.log('Leyendo', XLSX_PATH)
const wb = XLSX.read(readFileSync(XLSX_PATH), { type: 'buffer', cellDates: false })

for (const sheetName of wb.SheetNames) {
  const sheet = wb.Sheets[sheetName]
  const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })

  if (/recuperacion/i.test(sheetName)) {
    parseRecuperacion(aoa)
    continue
  }
  if (/materiales|piezas/i.test(sheetName)) {
    parseMateriales(aoa)
    continue
  }
  parseProyecto(sheetName, aoa)
}

function parseProyecto(sheetName: string, aoa: any[][]) {
  let codigo = sheetName.trim()
  const m = codigo.match(/W\s*(\d+)/i)
  if (m) codigo = `W${m[1]}`

  // extraer watts del nombre
  let watts = 0
  const kw = codigo.match(/(\d+(?:\.\d+)?)\s*[Kk][Ww]/)
  if (kw) watts = Math.round(parseFloat(kw[1]) * 1000)
  else {
    const wm = codigo.match(/[^\d](\d{3,})\s*W/i)
    if (wm) watts = parseInt(wm[1])
  }

  // buscar fila de encabezado
  let headerRow = -1
  let itemCol = -1
  let cantCol = -1
  let usadoCol = -1
  let precioMnCol = -1
  let precioUsdCol = -1
  for (let r = 0; r < Math.min(aoa.length, 6); r++) {
    const row = (aoa[r] || []) as any[]
    if (row.some((c) => str(c).toLowerCase() === 'item')) {
      headerRow = r
      row.forEach((c, i) => {
        const t = str(c).toLowerCase()
        if (t === 'item') itemCol = i
        else if (/^cant\.?$/.test(t)) cantCol = i
        else if (/^usado$/.test(t)) usadoCol = i
        else if (t === 'precio mn') precioMnCol = i
        else if (t === 'precio usd') precioUsdCol = i
      })
      break
    }
  }
  if (headerRow < 0) {
    // fallback: sin encabezado "Item" (formato descripcion | cant | precio | total)
    itemCol = 0
    cantCol = 1
    precioMnCol = 2
    headerRow = 1
  }

  const proyId = randomUUID()
  const nombreCliente = sheetName.replace(/^W\s*\d+\s*/i, '').replace(/[()]/g, '').trim() || codigo
  const cId = clienteId(nombreCliente)

  proyectos.push({
    id: proyId,
    codigo,
    nombre: nombreCliente,
    cliente_id: cId,
    watts,
    tarifa_mo: 0,
    tarifa_tipo: 'W',
    estado: 'en proceso',
  })

  let tarifa = 0
  let tarifaTipo = 'W'

  for (let r = headerRow + 1; r < aoa.length; r++) {
    const row = (aoa[r] || []) as any[]
    const item = str(row[itemCol])
    if (isSkip(item)) {
      if (/mano de obra/i.test(item)) {
        const nums = row.slice(1).map(num).filter((n) => n > 0)
        const amount = nums.length ? Math.max(...nums) : 0
        const mo = item.match(/mano de obra[^\d]*\$?\s*([\d.]+)/i)
        if (mo) tarifa = parseFloat(mo[1])
        const wm = item.match(/al ser\s*(\d+)|(\d{3,})\s*W\b/i)
        if (wm && watts === 0) watts = parseInt(wm[1] || wm[2])
        if (amount > 0) {
          mano_obra.push({
            id: randomUUID(),
            proyecto_id: proyId,
            descripcion: item,
            monto_mn: amount,
            monto_usd: 0,
          })
        }
      }
      continue
    }

    const cant = cantCol >= 0 ? num(row[cantCol]) : 1
    const precioMn = precioMnCol >= 0 ? num(row[precioMnCol]) : 0
    const precioUsd = precioUsdCol >= 0 ? num(row[precioUsdCol]) : 0

    proyecto_materiales.push({
      id: randomUUID(),
      proyecto_id: proyId,
      material_id: materialId(item),
      descripcion: item,
      cantidad: cant,
      usado: usadoCol >= 0 ? num(row[usadoCol]) || undefined : undefined,
      precio_mn: precioMn,
      precio_usd: precioUsd,
      socio_comprador: null,
    })
  }

  // si hay tarifa y watts y no se capturó mano de obra, calcularla
  if (tarifa > 0 && watts > 0 && mano_obra.filter((x) => x.proyecto_id === proyId).length === 0) {
    const monto = tarifa * (tarifaTipo === 'KW' ? watts / 1000 : watts)
    if (monto > 0) {
      mano_obra.push({
        id: randomUUID(),
        proyecto_id: proyId,
        descripcion: `Mano de obra a $${tarifa}/${tarifaTipo}`,
        monto_mn: monto,
        monto_usd: 0,
      })
    }
  }

  // actualizar proyecto con watts/tarifa detectados
  const proyRec = proyectos.find((p) => p.id === proyId)
  if (proyRec) {
    proyRec.watts = watts
    proyRec.tarifa_mo = tarifa
  }

  console.log(`  ${codigo}: ${proyecto_materiales.filter((x) => x.proyecto_id === proyId).length} materiales`)
}

function parseMateriales(aoa: any[][]) {
  let headerRow = -1
  let itemCol = -1
  let cantCol = -1
  let precioMnCol = -1
  let precioUsdCol = -1
  for (let r = 0; r < Math.min(aoa.length, 6); r++) {
    const row = (aoa[r] || []) as any[]
    if (row.some((c) => str(c).toLowerCase() === 'item')) {
      headerRow = r
      row.forEach((c, i) => {
        const t = str(c).toLowerCase()
        if (t === 'item') itemCol = i
        else if (/^cant\.?$/.test(t)) cantCol = i
        else if (t === 'precio mn') precioMnCol = i
        else if (t === 'precio usd') precioUsdCol = i
      })
      break
    }
  }
  if (headerRow < 0) return
  for (let r = headerRow + 1; r < aoa.length; r++) {
    const row = (aoa[r] || []) as any[]
    const item = str(row[itemCol])
    if (isSkip(item)) continue
    if (precioMnCol >= 0 && num(row[precioMnCol]) > 0) {
      materialId(item)
    } else if (precioUsdCol >= 0 && num(row[precioUsdCol]) > 0) {
      materialId(item)
    } else if (cantCol >= 0 && num(row[cantCol]) > 0) {
      materialId(item)
    }
  }
}

function parseRecuperacion(aoa: any[][]) {
  // columnas: 0=W, 1=FECHA, 2..?=Gastos MN/USD, PAGADO..., etc. Best effort.
  for (const row of aoa) {
    const w = str(row[0])
    const m = w.match(/^(\d+)$/)
    if (!m) continue
    const codigo = `W${m[1]}`
    const proy = proyectos.find((p) => p.codigo === codigo)
    if (!proy) continue
    // heurística: primer par de números > 0 tras fecha => gastos; siguiente => pagado
    const nums = row.slice(1).map((c) => num(c))
    const positivos = nums.filter((n) => n > 0)
    if (positivos.length >= 2) {
      gastos.push({
        id: randomUUID(),
        proyecto_id: proy.id,
        fecha: str(row[1]) || undefined,
        descripcion: 'Gastos',
        monto_mn: positivos[0],
        monto_usd: 0,
        socio: null,
      })
    }
    // pagado: usar el par de columnas PAGADO (más adelante)
    if (positivos.length >= 4) {
      pagos.push({
        id: randomUUID(),
        proyecto_id: proy.id,
        fecha: str(row[1]) || undefined,
        monto_mn: positivos[2],
        monto_usd: positivos[3] || 0,
        concepto: 'Pago cliente',
        socio: null,
      })
    }
  }
}

// ---------- emitir SQL ----------
const out: string[] = []
out.push('-- Importado desde Sistemas_Fotovoltaicos.xlsx (generado automáticamente)')
out.push('-- Ejecutar en: SQL Editor -> New query -> Run\n')

socios.forEach((id, nombre) => {
  out.push(
    `insert into public.socios (id, nombre) values ('${id}', '${esc(nombre)}') on conflict (id) do nothing;`,
  )
})
clientes.forEach((id, nombre) => {
  out.push(
    `insert into public.clientes (id, nombre) values ('${id}', '${esc(nombre)}') on conflict (id) do nothing;`,
  )
})
materiales.forEach((m) => {
  out.push(
    `insert into public.materiales (id, nombre) values ('${m.id}', '${esc(m.nombre)}') on conflict (id) do nothing;`,
  )
})
for (const p of proyectos) {
  out.push(
    `insert into public.proyectos (id, codigo, nombre, cliente_id, watts, tarifa_mo, tarifa_tipo, estado) values (` +
      `'${p.id}', '${esc(p.codigo)}', '${esc(p.nombre)}', ${p.cliente_id ? `'${p.cliente_id}'` : 'null'}, ` +
      `${p.watts}, ${p.tarifa_mo}, '${p.tarifa_tipo}', '${esc(p.estado)}') on conflict (id) do nothing;`,
  )
}
for (const x of proyecto_materiales) {
  out.push(
    `insert into public.proyecto_materiales (id, proyecto_id, material_id, descripcion, cantidad, usado, precio_mn, precio_usd, socio_comprador) values (` +
      `'${x.id}', '${x.proyecto_id}', '${x.material_id}', '${esc(x.descripcion)}', ${x.cantidad}, ` +
      `${x.usado != null ? x.usado : 'null'}, ${x.precio_mn}, ${x.precio_usd}, null) on conflict (id) do nothing;`,
  )
}
for (const x of mano_obra) {
  out.push(
    `insert into public.mano_obra (id, proyecto_id, descripcion, monto_mn, monto_usd) values (` +
      `'${x.id}', '${x.proyecto_id}', '${esc(x.descripcion)}', ${x.monto_mn}, ${x.monto_usd}) on conflict (id) do nothing;`,
  )
}
for (const x of pagos) {
  out.push(
    `insert into public.pagos (id, proyecto_id, fecha, monto_mn, monto_usd, concepto) values (` +
      `'${x.id}', '${x.proyecto_id}', ${x.fecha ? `'${esc(x.fecha)}'` : 'null'}, ${x.monto_mn}, ${x.monto_usd}, '${esc(x.concepto)}') on conflict (id) do nothing;`,
  )
}
for (const x of gastos) {
  out.push(
    `insert into public.gastos (id, proyecto_id, fecha, descripcion, monto_mn, monto_usd, socio) values (` +
      `'${x.id}', '${x.proyecto_id}', ${x.fecha ? `'${esc(x.fecha)}'` : 'null'}, '${esc(x.descripcion)}', ${x.monto_mn}, ${x.monto_usd}, null) on conflict (id) do nothing;`,
  )
}

const outPath = join(__dirname, '..', 'supabase', 'migrations', '0002_import_data.sql')
mkdirSync(dirname(outPath), { recursive: true })
writeFileSync(outPath, out.join('\n'), 'utf8')

console.log(`\nProyectos: ${proyectos.length}`)
console.log(`Materiales (catálogo): ${materiales.size}`)
console.log(`Líneas de material: ${proyecto_materiales.length}`)
console.log(`Mano de obra: ${mano_obra.length}`)
console.log(`Pagos: ${pagos.length}`)
console.log(`Gastos: ${gastos.length}`)
console.log(`\nSQL generado en: ${outPath}`)
