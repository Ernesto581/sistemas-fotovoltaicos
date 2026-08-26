import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import type { Proyecto, ProyectoMaterial, ManoObra } from '../types'
import type { ProyectoTotales } from './calc'

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  subtitle: { fontSize: 11, color: '#444', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { color: '#555' },
  value: { fontWeight: 'bold' },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 4,
  },
  cell: { flex: 1 },
  cellN: { flex: 0.7, textAlign: 'right' },
  cellQty: { flex: 0.4, textAlign: 'right' },
  total: { fontSize: 12, fontWeight: 'bold' },
})

function money(n: number, cur: 'MN' | 'USD') {
  const v = Math.round(n * 100) / 100
  return `${new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(v)} ${cur}`
}

export function CotizacionDoc({
  proyecto,
  cliente,
  materiales,
  manoObra,
  totals,
}: {
  proyecto: Proyecto
  cliente: string
  materiales: ProyectoMaterial[]
  manoObra: ManoObra[]
  totals: ProyectoTotales
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Cotización — Sistema Fotovoltaico</Text>
        <Text style={styles.subtitle}>
          Proyecto {proyecto.codigo} · {cliente}
        </Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Potencia</Text>
            <Text style={styles.value}>{proyecto.watts} W</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Mano de obra</Text>
            <Text style={styles.value}>
              ${proyecto.tarifa_mo} / {proyecto.tarifa_tipo}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Materiales</Text>
          <View style={[styles.tableRow, { borderBottomColor: '#999' }]}>
            <Text style={styles.cell}>Item</Text>
            <Text style={styles.cellQty}>Cant.</Text>
            <Text style={styles.cellN}>Total MN</Text>
            <Text style={styles.cellN}>Total USD</Text>
          </View>
          {materiales.map((m) => (
            <View key={m.id} style={styles.tableRow}>
              <Text style={styles.cell}>{m.descripcion}</Text>
              <Text style={styles.cellQty}>{m.cantidad}</Text>
              <Text style={styles.cellN}>{money((m.cantidad || 0) * (m.precio_mn || 0), 'MN')}</Text>
              <Text style={styles.cellN}>{money((m.cantidad || 0) * (m.precio_usd || 0), 'USD')}</Text>
            </View>
          ))}
          {manoObra.map((mo) => (
            <View key={mo.id} style={styles.tableRow}>
              <Text style={styles.cell}>{mo.descripcion}</Text>
              <Text style={styles.cellQty}></Text>
              <Text style={styles.cellN}>{money(mo.monto_mn || 0, 'MN')}</Text>
              <Text style={styles.cellN}>{money(mo.monto_usd || 0, 'USD')}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.total}>Total MN</Text>
            <Text style={styles.total}>{money(totals.total_mn, 'MN')}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.total}>Total USD</Text>
            <Text style={styles.total}>{money(totals.total_usd, 'USD')}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generarCotizacion(args: {
  proyecto: Proyecto
  cliente: string
  materiales: ProyectoMaterial[]
  manoObra: ManoObra[]
  totals: ProyectoTotales
}) {
  const blob = await pdf(<CotizacionDoc {...args} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cotizacion-${args.proyecto.codigo}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
