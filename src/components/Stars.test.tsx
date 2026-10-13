// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Stars } from './Stars'

afterEach(cleanup)

describe('Stars', () => {
  it('draws earned stars filled and unearned ones hollow, not just in another colour', () => {
    const { container } = render(<Stars count={1} />)
    const glyphs = [...container.querySelectorAll('[aria-hidden="true"]')].map((s) => s.textContent)
    expect(glyphs).toEqual(['★', '☆', '☆'])
    expect(container.textContent).toContain('1 of 3 stars')
  })
})
