import type { MentionComposerDuplicatePolicy, MentionComposerValue, MentionSuggestion } from "./composerTypes"
import { useEffect, useId, useMemo, useRef, useState } from "react"

type ActiveAtToken = {
  atIndex: number
  caretIndex: number
  query: string
}

function getActiveAtToken(text: string, caretIndex: number): ActiveAtToken | null {
  const upto = text.slice(0, Math.max(0, caretIndex))

  const atIndex = upto.lastIndexOf("@")
  if (atIndex === -1) return null

  // Require token start (avoid triggering on emails).
  const prevChar = atIndex > 0 ? upto[atIndex - 1] : ""
  if (prevChar && !/\s/.test(prevChar)) return null

  // Allow spaces so apps can support patterns like "@contact Dwight".
  const rawQuery = upto.slice(atIndex + 1)
  if (rawQuery.includes("\n")) return null

  return { atIndex, caretIndex, query: rawQuery }
}

export type UseMentionComposerArgs = {
  value: MentionComposerValue
  onChange: (next: MentionComposerValue) => void
  getSuggestions: (query: string) => Promise<MentionSuggestion[]>

  duplicatePolicy?: MentionComposerDuplicatePolicy
  debounceMs?: number
  maxQueryLength?: number
}

export type UseMentionComposerResult = {
  rootRef: React.RefObject<HTMLDivElement>
  textareaRef: React.RefObject<HTMLTextAreaElement>

  open: boolean
  loading: boolean
  items: MentionSuggestion[]
  highlightedIndex: number
  listboxId: string
  activeDescendantId?: string

  setHighlightedIndex: (idx: number) => void

  removeMentionAt: (index: number) => void
  selectSuggestion: (m: MentionSuggestion) => void
  closeMenu: () => void

  onTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onTextSelect: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void
  onTextKeyUp: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onTextKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onTextBlur: () => void

  getOptionId: (index: number) => string
  getOptionProps: (index: number, item: MentionSuggestion) => {
    id: string
    role: "option"
    "aria-selected": boolean
    onMouseEnter: () => void
    onMouseDown: (e: React.MouseEvent) => void
    onClick: () => void
  }
  getListboxProps: () => { id: string; role: "listbox" }
}

export function useMentionComposer(args: UseMentionComposerArgs): UseMentionComposerResult {
  const {
    value,
    onChange,
    getSuggestions,
    duplicatePolicy = "allow",
    debounceMs = 150,
    maxQueryLength = 120,
  } = args

  const rootRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [caretIndex, setCaretIndex] = useState<number>(value.text.length)
  const active = useMemo(() => getActiveAtToken(value.text, caretIndex), [value.text, caretIndex])

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MentionSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const requestSeq = useRef(0)
  const pendingSelection = useRef<number | null>(null)

  const listboxId = useId()
  const activeDescendantId = open && items.length > 0 ? `${listboxId}-opt-${highlightedIndex}` : undefined

  const closeMenu = () => {
    setOpen(false)
    setItems([])
    setLoading(false)
    setHighlightedIndex(0)
  }

  useEffect(() => {
    if (!active) {
      closeMenu()
      return
    }

    const q = active.query
    if (q.length > maxQueryLength) {
      closeMenu()
      return
    }

    setOpen(true)
    setLoading(true)

    const seq = ++requestSeq.current
    const handle = window.setTimeout(() => {
      Promise.resolve(getSuggestions(q))
        .then((res) => {
          if (seq !== requestSeq.current) return
          setItems(Array.isArray(res) ? res : [])
          setHighlightedIndex(0)
        })
        .catch(() => {
          if (seq !== requestSeq.current) return
          setItems([])
          setHighlightedIndex(0)
        })
        .finally(() => {
          if (seq !== requestSeq.current) return
          setLoading(false)
        })
    }, debounceMs)

    return () => window.clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.query, getSuggestions, debounceMs, maxQueryLength])

  useEffect(() => {
    if (!open) return

    const onDocMouseDown = (e: MouseEvent) => {
      const root = rootRef.current
      if (!root) return
      if (e.target instanceof Node && root.contains(e.target)) return
      closeMenu()
    }

    document.addEventListener("mousedown", onDocMouseDown, true)
    return () => document.removeEventListener("mousedown", onDocMouseDown, true)
  }, [open])

  useEffect(() => {
    const pos = pendingSelection.current
    if (pos == null) return
    const el = textareaRef.current
    if (!el) return

    const clamped = Math.max(0, Math.min(pos, el.value.length))
    el.setSelectionRange(clamped, clamped)
    pendingSelection.current = null
    setCaretIndex(clamped)
  }, [value.text])

  const removeMentionAt = (index: number) => {
    const next = value.mentions.slice()
    next.splice(index, 1)
    onChange({ ...value, mentions: next })
  }

  const selectSuggestion = (m: MentionSuggestion) => {
    if (!active) return

    if (duplicatePolicy === "dedupeByTypeId") {
      const exists = value.mentions.some((x) => x.type === m.type && x.id === m.id)
      if (exists) {
        closeMenu()
        return
      }
    }

    const before = value.text.slice(0, active.atIndex)
    const after = value.text.slice(active.caretIndex)
    const insertedText = `${m.label} `
    const nextText = before + insertedText + after

    const nextMentions = value.mentions.concat([{ type: m.type, id: m.id, label: m.label }])
    onChange({ text: nextText, mentions: nextMentions })

    pendingSelection.current = (before + insertedText).length
    closeMenu()
  }

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextText = e.target.value
    const nextCaret = e.target.selectionStart ?? nextText.length
    setCaretIndex(nextCaret)
    onChange({ ...value, text: nextText })
  }

  const onTextSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.target as HTMLTextAreaElement
    setCaretIndex(el.selectionStart ?? el.value.length)
  }

  const onTextKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    setCaretIndex(el.selectionStart ?? el.value.length)
  }

  const onTextKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open) return

    if (e.key === "Escape") {
      e.preventDefault()
      closeMenu()
      return
    }

    if (e.key === "ArrowDown") {
      if (items.length === 0) return
      e.preventDefault()
      setHighlightedIndex((idx) => Math.min(items.length - 1, idx + 1))
      return
    }

    if (e.key === "ArrowUp") {
      if (items.length === 0) return
      e.preventDefault()
      setHighlightedIndex((idx) => Math.max(0, idx - 1))
      return
    }

    if (e.key === "Enter") {
      if (items.length === 0) return
      e.preventDefault()
      const m = items[Math.max(0, Math.min(highlightedIndex, items.length - 1))]
      if (m) selectSuggestion(m)
    }
  }

  const onTextBlur = () => {
    window.setTimeout(() => {
      const root = rootRef.current
      if (!root) return
      const activeEl = document.activeElement
      if (activeEl && root.contains(activeEl)) return
      closeMenu()
    }, 0)
  }

  const getOptionId = (index: number) => `${listboxId}-opt-${index}`

  const getOptionProps = (index: number, item: MentionSuggestion) => {
    return {
      id: getOptionId(index),
      role: "option" as const,
      "aria-selected": index === highlightedIndex,
      onMouseEnter: () => setHighlightedIndex(index),
      onMouseDown: (ev: React.MouseEvent) => {
        // Keep focus on textarea so selection/caret stays stable.
        ev.preventDefault()
      },
      onClick: () => selectSuggestion(item),
    }
  }

  const getListboxProps = () => ({ id: listboxId, role: "listbox" as const })

  return {
    rootRef,
    textareaRef,
    open,
    loading,
    items,
    highlightedIndex,
    listboxId,
    activeDescendantId,
    setHighlightedIndex,
    removeMentionAt,
    selectSuggestion,
    closeMenu,
    onTextChange,
    onTextSelect,
    onTextKeyUp,
    onTextKeyDown,
    onTextBlur,
    getOptionId,
    getOptionProps,
    getListboxProps,
  }
}


