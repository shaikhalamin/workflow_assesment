import {
  Document,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import type { ReactNode } from 'react'

export type InvoicePdfData = {
  id: string
  invoiceNumber: string
  title: string
  amount: string
  currency: string
  status: string
  billingRequestId?: string | null
  customerName?: string | null
  customerEmail?: string | null
  customerAddress?: string | null
  dueDate?: string | null
  issuedAt?: string | null
  paidAt?: string | null
  description?: string | null
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 18,
    marginBottom: 24,
  },
  brand: {
    fontSize: 18,
    fontWeight: 700,
  },
  label: {
    color: '#6b7280',
    fontSize: 8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'right',
  },
  section: {
    marginBottom: 18,
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 24,
  },
  column: {
    flexGrow: 1,
    flexBasis: 0,
  },
  value: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  table: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
  },
  tableRow: {
    flexDirection: 'row',
  },
  itemCell: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 10,
  },
  amountCell: {
    width: 140,
    padding: 10,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  totalLabel: {
    width: 100,
    textAlign: 'right',
    paddingRight: 12,
    fontWeight: 700,
  },
  totalValue: {
    width: 140,
    textAlign: 'right',
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    color: '#6b7280',
    fontSize: 8,
  },
})

export function InvoiceDownloadLink({
  invoice,
  children = 'Download invoice',
  className,
}: {
  invoice: InvoicePdfData
  children?: ReactNode
  className?: string
}) {
  return (
    <PDFDownloadLink
      document={<InvoicePdf invoice={invoice} />}
      fileName={`${safeFileName(invoice.invoiceNumber)}.pdf`}
      className={className}
    >
      {({ loading }) => (loading ? 'Preparing invoice...' : children)}
    </PDFDownloadLink>
  )
}

function InvoicePdf({ invoice }: { invoice: InvoicePdfData }) {
  const amount = `${invoice.amount} ${invoice.currency}`

  return (
    <Document title={invoice.invoiceNumber}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>WorkflowIQ</Text>
            <Text style={styles.value}>Fiber@Home workflow billing</Text>
          </View>
          <View>
            <Text style={styles.label}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.value}>Status: {invoice.status}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.twoColumns]}>
          <View style={styles.column}>
            <Text style={styles.label}>Bill to</Text>
            <Text style={styles.value}>
              {invoice.customerName ?? 'Customer'}
            </Text>
            {invoice.customerEmail ? (
              <Text style={styles.value}>{invoice.customerEmail}</Text>
            ) : null}
            {invoice.customerAddress ? (
              <Text style={styles.value}>{invoice.customerAddress}</Text>
            ) : null}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Invoice details</Text>
            <Text style={styles.value}>Issued: {invoice.issuedAt ?? '-'}</Text>
            <Text style={styles.value}>Due: {invoice.dueDate ?? '-'}</Text>
            <Text style={styles.value}>Paid: {invoice.paidAt ?? '-'}</Text>
            <Text style={styles.value}>
              Billing request: {invoice.billingRequestId ?? '-'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Line items</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.itemCell}>Description</Text>
              <Text style={styles.amountCell}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.itemCell}>
                {invoice.title}
                {invoice.description ? `\n${invoice.description}` : ''}
              </Text>
              <Text style={styles.amountCell}>{amount}</Text>
            </View>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{amount}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Generated from WorkflowIQ. This invoice was created from an approved
          billing request.
        </Text>
      </Page>
    </Document>
  )
}

function safeFileName(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, '_')
}
