import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DataTable } from './data-table'

type TestRow = {
  id: string
  name: string
  status: string
}

describe('DataTable', () => {
  it('renders an Inspectio-style dense table shell', () => {
    render(
      <DataTable<TestRow>
        columns={[
          { header: 'Name', accessorKey: 'name' },
          { header: 'Status', accessorKey: 'status' },
        ]}
        data={[{ id: 'row-1', name: 'Expense approval', status: 'ACTIVE' }]}
      />,
    )

    const table = screen.getByRole('table')
    const row = screen.getByText('Expense approval').closest('tr')

    if (row === null) {
      throw new Error('Expected table row to render')
    }

    expect(table).toHaveClass('min-w-[920px]')
    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveClass(
      'bg-[var(--surface-2)]',
    )
    expect(row).toHaveClass('hover:bg-[var(--surface-2)]')
    expect(within(table).getByText('ACTIVE')).toBeInTheDocument()
  })
})
