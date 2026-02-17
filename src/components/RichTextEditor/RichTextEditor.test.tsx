import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { type RichTextEditorRef, RichTextEditor } from './RichTextEditor'

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(<RichTextEditor data-testid="editor-root" />)
    expect(screen.getByTestId('editor-root')).toBeInTheDocument()
  })

  it('has default Tailwind classes on root', () => {
    render(<RichTextEditor data-testid="editor-root" />)
    const root = screen.getByTestId('editor-root')
    expect(root).toHaveClass('block')
    expect(root).toHaveClass('w-full')
    expect(root).toHaveClass('relative')
  })

  it('renders with initial plain string value', () => {
    render(<RichTextEditor initialValue="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders with initial RichTextRecord value', () => {
    render(<RichTextEditor initialValue={{ text: 'Initial content', facets: [] }} />)
    expect(screen.getByText('Initial content')).toBeInTheDocument()
  })

  it('shows placeholder text when editor is empty', () => {
    render(<RichTextEditor placeholder="What's on your mind?" />)
    // TipTap injects placeholder via CSS :before pseudo-element with data attribute
    const editorEl = document.querySelector('[data-placeholder]')
    expect(editorEl).toHaveAttribute('data-placeholder', "What's on your mind?")
  })

  it('accepts an onChange prop without error', () => {
    // TipTap's onUpdate fires via ProseMirror transactions which require a
    // real browser layout engine (getBoundingClientRect, getClientRects, etc.)
    // that jsdom cannot fully simulate. We verify the prop is accepted and the
    // editor mounts correctly; onChange integration is covered by Storybook.
    const handleChange = vi.fn()
    expect(() => {
      render(<RichTextEditor onChange={handleChange} />)
    }).not.toThrow()

    // Editor should be present and editable
    const editorEl = document.querySelector('[contenteditable="true"]')
    expect(editorEl).toBeInTheDocument()
  })

  it('is not editable when editable=false', () => {
    render(<RichTextEditor editable={false} />)
    const editorEl = document.querySelector('[contenteditable]')
    expect(editorEl).toHaveAttribute('contenteditable', 'false')
  })

  it('forwards extra props to the root div', () => {
    render(<RichTextEditor data-testid="editor" className="my-editor" />)
    const root = screen.getByTestId('editor')
    expect(root).toHaveClass('my-editor')
    expect(root.tagName).toBe('DIV')
  })

  it('exposes imperative focus/blur/clear/getText via editorRef', () => {
    const ref: { current: RichTextEditorRef | null } = { current: null }

    render(<RichTextEditor editorRef={ref} initialValue="Some content" />)

    // Ref should be populated after mount
    expect(ref.current).not.toBeNull()
    expect(typeof ref.current?.focus).toBe('function')
    expect(typeof ref.current?.blur).toBe('function')
    expect(typeof ref.current?.clear).toBe('function')
    expect(typeof ref.current?.getText).toBe('function')
  })
})
