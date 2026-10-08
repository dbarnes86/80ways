import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, Button } from '@/components/ui'

describe('variant overrides', () => {
  it('lets a passed background replace the variant background', () => {
    render(<Button className="bg-secondary hover:bg-secondary/90">Strike</Button>)
    const cls = screen.getByRole('button').className
    expect(cls).toContain('bg-secondary')
    expect(cls).not.toMatch(/\bbg-primary\b/)
    expect(cls).not.toContain('hover:bg-primary/90')
    expect(cls).toContain('text-background')
  })

  it('keeps variant classes nothing overrides', () => {
    render(<Badge className="bg-muted text-muted-foreground">COMMON</Badge>)
    const cls = screen.getByText('COMMON').className
    expect(cls).not.toMatch(/\bbg-primary\b/)
    expect(cls).not.toContain('text-background')
    expect(cls).toContain('border-transparent')
  })

  it('does not treat text sizes as colour overrides', () => {
    render(<Button className="text-lg">Go</Button>)
    expect(screen.getByRole('button').className).toContain('text-background')
  })
})
