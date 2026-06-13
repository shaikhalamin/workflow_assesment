import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  FormCheckbox,
  FormField,
  FormInput,
  FormSection,
  FormSelect,
  FormShell,
  FormTextarea,
} from './index'

describe('form primitives', () => {
  it('renders labels, helper text, errors, and controls', () => {
    render(
      <FormShell
        title="New request"
        kicker="Operations"
        description="Create a workflow request."
        navigation={<a href="/requests">Back to requests</a>}
        actions={<button type="button">Action</button>}
      >
        <FormSection index="01" title="Details" hint="Required">
          <FormField label="Title" htmlFor="title" error="Title is required">
            <FormInput id="title" value="" onChange={() => undefined} />
          </FormField>
          <FormField label="Type" htmlFor="type" description="Pick one type.">
            <FormSelect id="type" value="annual" onChange={() => undefined}>
              <option value="annual">Annual</option>
            </FormSelect>
          </FormField>
          <FormField label="Reason" htmlFor="reason">
            <FormTextarea id="reason" value="Family event" onChange={() => undefined} />
          </FormField>
          <FormCheckbox label="Allow resubmission" checked onChange={() => undefined} />
        </FormSection>
      </FormShell>,
    )

    expect(screen.getByRole('heading', { name: 'New request' })).toBeInTheDocument()
    expect(screen.getByText('01')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toBeInTheDocument()
    expect(screen.getByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Pick one type.')).toBeInTheDocument()
    expect(screen.getByLabelText('Allow resubmission')).toBeChecked()
    expect(
      screen
        .getByRole('link', { name: /back to requests/i })
        .compareDocumentPosition(screen.getByRole('heading', { name: 'New request' })) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })
})
