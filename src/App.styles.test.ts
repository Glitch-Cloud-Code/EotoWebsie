import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('hero logo presentation', () => {
  it('does not draw a decorative line behind the logo', async () => {
    const css = await readFile(new URL('./App.css', import.meta.url), 'utf8')

    expect(css).not.toContain('.hero-logo-pane::before')
  })
})
