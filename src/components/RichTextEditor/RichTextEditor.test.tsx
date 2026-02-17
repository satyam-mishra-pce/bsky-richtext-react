import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { type RichTextEditorRef, RichTextEditor } from './RichTextEditor'

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(<RichTextEditor data-testid="editor-root" />)
    expect(screen.getByTestId('editor-root')).toBeInTheDocument()
  })

  it('has data-bsky-richtext-editor attribute on root', () => {
    render(<RichTextEditor data-testid="editor-root" />)
    const root = screen.getByTestId('editor-root')
    expect(root).toHaveAttribute('data-bsky-richtext-editor')
  })

  it('renders with initial plain string value', () => {
    render(<RichTextEditor initialValue="Hello world" />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders with initial RichTextRecord value', () => {
    render(
      <RichTextEditor
        initialValue={{ text: 'Initial content', facets: [] }}
      />,
    )
    expect(screen.getByText('Initial content')).toBeInTheDocument()
  })

  it('shows placeholder text when editor is empty', () => {
    render(<RichTextEditor placeholder="What's on your mind?" />)
    // TipTap injects placeholder via CSS :before pseudo-element with data attribute
    const editorEl = document.querySelector('[data-placeholder]')
    expect(editorEl).toHaveAttribute('data-placeholder', "What's on your mind?")
  })

  it('calls onChange when user types', () => {
    const handleChange = vi.fn()

    render(<RichTextEditor onChange={handleChange} />)

    const editorEl = document.querySelector('[contenteditable="true"]')
    expect(editorEl).toBeInTheDocument()

    // ProseMirror reads DOM mutations via MutationObserver.
    // Simulate typing by mutating the DOM and firing an input event — this
    // avoids triggering ProseMirror's mouse-click / layout-dependent code paths
    // that don't work in jsdom.
    act(() => {
      // Insert a text node into the editor's paragraph
      const p = editorEl?.querySelector('p') ?? editorEl
      if (p) p.textContent = 'Hello'
      if (editorEl) fireEvent.input(editorEl, { bubbles: true })
    })

    expect(handleChange).toHaveBeenCalled()
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
