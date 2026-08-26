import type { ProyectoMaterial, ManoObra, Pago, Gasto } from '../types'

export interface ProyectoTotales {
  materiales_mn: number
  materiales_usd: number
  mano_obra_mn: number
  mano_obra_usd: number
  total_mn: number
  total_usd: number
  pagado_mn: number
  pagado_usd: number
  gastos_mn: number
  gastos_usd: number
  queda_mn: number
  queda_usd: number
}

export function computeTotales(
  materiales: ProyectoMaterial[],
  manoObra: ManoObra[],
  pagos: Pago[],
  gastos: Gasto[],
): ProyectoTotales {
  const sum = (xs: { monto_mn?: number; monto_usd?: number }[]) =>
    xs.reduce(
      (acc, x) => ({
        mn: acc.mn + Number(x.monto_mn || 0),
        usd: acc.usd + Number(x.monto_usd || 0),
      }),
      { mn: 0, usd: 0 },
    )

  const mat = materiales.reduce(
    (acc, m) => {
      const cant = Number(m.cantidad || 0)
      return {
        mn: acc.mn + cant * Number(m.precio_mn || 0),
        usd: acc.usd + cant * Number(m.precio_usd || 0),
      }
    },
    { mn: 0, usd: 0 },
  )
  const mo = sum(manoObra)
  const pag = sum(pagos)
  const gas = sum(gastos)

  const total_mn = mat.mn + mo.mn
  const total_usd = mat.usd + mo.usd

  return {
    materiales_mn: mat.mn,
    materiales_usd: mat.usd,
    mano_obra_mn: mo.mn,
    mano_obra_usd: mo.usd,
    total_mn,
    total_usd,
    pagado_mn: pag.mn,
    pagado_usd: pag.usd,
    gastos_mn: gas.mn,
    gastos_usd: gas.usd,
    queda_mn: total_mn - pag.mn,
    queda_usd: total_usd - pag.usd,
  }
}
