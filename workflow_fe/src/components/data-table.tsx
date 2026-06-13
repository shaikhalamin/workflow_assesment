import type { ReactNode } from 'react'
import type { ColumnDef } from '@tanstack/react-table'

type RenderColumn<TData> = {
  id?: string
  accessorKey?: string
  header?: ReactNode | (() => ReactNode)
  cell?: (context: { row: { original: TData } }) => ReactNode
}

function readAccessor<TData>(row: TData, accessorKey: string) {
  if (row && typeof row === 'object' && accessorKey in row) {
    return (row as Record<string, unknown>)[accessorKey]
  }
  return undefined
}

function renderValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value)
  }
  return String(value)
}

function rowKey<TData>(row: TData, index: number) {
  if (row && typeof row === 'object' && 'id' in row) {
    return String(row.id)
  }
  return String(index)
}

export function DataTable<TData>({
  columns,
  data,
  empty = 'No records found.',
}: {
  columns: ColumnDef<TData>[]
  data: TData[]
  empty?: ReactNode
}) {
  const renderColumns = columns as unknown as RenderColumn<TData>[]

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-sm">
          <thead>
            <tr>
              {renderColumns.map((column, index) => (
                <th
                  key={column.id ?? column.accessorKey ?? index}
                  className="border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]"
                >
                  {typeof column.header === 'function'
                    ? column.header()
                    : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length ? (
              data.map((row, rowIndex) => (
                <tr key={rowKey(row, rowIndex)} className="border-b border-[var(--border)] transition last:border-b-0 hover:bg-[var(--surface-2)]">
                  {renderColumns.map((column, columnIndex) => (
                    <td key={column.id ?? column.accessorKey ?? columnIndex} className="px-4 py-3 align-top text-[13px] text-[var(--foreground)]">
                      {column.cell
                        ? column.cell({ row: { original: row } })
                        : renderValue(
                            column.accessorKey
                              ? readAccessor(row, column.accessorKey)
                              : undefined,
                          )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-[var(--muted-foreground)]"
                  colSpan={columns.length}
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
