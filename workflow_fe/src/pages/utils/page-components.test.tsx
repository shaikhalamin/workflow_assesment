import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PageHeader } from './page-components'

describe('PageHeader', () => {
  it('renders navigation before the title', () => {
    render(
      <PageHeader
        kicker="Detail"
        title="Expense detail"
        navigation={<a href="/expenses">Back to expenses</a>}
        action={<button type="button">Edit</button>}
      />,
    )

    const navigation = screen.getByRole('link', { name: /back to expenses/i })
    const title = screen.getByRole('heading', { name: /expense detail/i })
    const navigationRow = navigation.parentElement
    const titleBlock = title.parentElement

    expect(
      navigation.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(navigationRow?.nextElementSibling).toBe(titleBlock)
  })
})
