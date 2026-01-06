import type { MentionPayload } from "./types"
import { useEffect, useMemo, useRef, useState } from "react"

export type MentionSuggestion = {
  type: string
  id: string
  label: string
}

export type MentionComposerValue = {
  text: string
  mentions: MentionPayload[]
}

export type MentionComposerProps = {
  value: MentionComposerValue
  onChange: (next: MentionComposerValue) => void

  placeholder?: string

  /**
   * Called when the user is trying to insert a mention. Your app should return
   * suggestions (usually via an API call) based on the typed query.
   */
  getSuggestions: (query: string) => Promise<MentionSuggestion[]>
}

type ActiveAtToken = {
  atIndex: number
  caretIndex: number
  query: string
}

function getActiveAtToken(text: string, caretIndex: number): ActiveAtToken | null {
  // Look at the text up to the caret and find the last "@"
  const upto = text.slice(0, Math.max(0, caretIndex))

  // Require that the "@" begins a token (start of string or preceded by whitespace).
  // This avoids triggering on emails like "a@b.com".
  const atIndex = upto.lastIndexOf("@")
  if (atIndex === -1) return null

  const prevChar = atIndex > 0 ? upto[atIndex - 1] : ""
  if (prevChar && !/\s/.test(prevChar)) return null

  // The query is whatever the user typed after "@" up to the caret.
  // We allow spaces so apps can support patterns like "@contact Dwight".
  const rawQuery = upto.slice(atIndex + 1)
  if (rawQuery.includes("\n")) return null

  return {
    atIndex,
    caretIndex,
    query: rawQuery,
  }
}

/**
 * Minimal v0.1 scaffold.
 *
 * This currently behaves like a plain textarea; upcoming steps will add:
 * - `@` detection
 * - pill rendering
 * - suggestion UI + insertion
 */
export function MentionComposer(props: MentionComposerProps) {
  const { value, onChange, placeholder, getSuggestions } = props

  const [caretIndex, setCaretIndex] = useState<number>(value.text.length)
  const active = useMemo(() => getActiveAtToken(value.text, caretIndex), [value.text, caretIndex])

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<MentionSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const requestSeq = useRef(0)

  useEffect(() => {
    if (!active) {
      setOpen(false)
      setItems([])
      setLoading(false)
      return
    }

    const q = active.query
    // Don't spam requests for very long queries
    if (q.length > 120) {
      setOpen(false)
      setItems([])
      setLoading(false)
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
        })
        .catch(() => {
          if (seq !== requestSeq.current) return
          setItems([])
        })
        .finally(() => {
          if (seq !== requestSeq.current) return
          setLoading(false)
        })
    }, 150)

    return () => window.clearTimeout(handle)
  }, [active?.query, getSuggestions])

  const insertMention = (m: MentionSuggestion) => {
    if (!active) return

    const before = value.text.slice(0, active.atIndex)
    const after = value.text.slice(active.caretIndex)
    const insertedText = `${m.label} `
    const nextText = before + insertedText + after

    const nextMentions = value.mentions.concat([{ type: m.type, id: m.id, label: m.label }])
    onChange({ text: nextText, mentions: nextMentions })

    // Close menu and move caret after the inserted label
    setOpen(false)
    setItems([])
    setLoading(false)
    setCaretIndex((before + insertedText).length)
  }

  return (
    <div>
      {value.mentions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {value.mentions.map((m, idx) => {
            const label = m.label || m.id
            return (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`${m.type}:${m.id}:${idx}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 999,
                  border: "1px solid rgba(0,0,0,0.2)",
                  padding: "2px 10px",
                  fontSize: 12,
                  lineHeight: "18px",
                  userSelect: "none",
                }}
              >
                <span style={{ opacity: 0.7 }}>@{m.type}</span>
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = value.mentions.slice()
                    next.splice(idx, 1)
                    onChange({ ...value, mentions: next })
                  }}
                  aria-label={`Remove mention ${label}`}
                  title="Remove mention"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    border: "none",
                    background: "transparent",
                    padding: 0,
                    cursor: "pointer",
                    opacity: 0.7,
                  }}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            )
          })}
        </div>
      )}

      <textarea
        value={value.text}
        placeholder={placeholder}
        onChange={(e) => {
          const nextText = e.target.value
          const nextCaret = e.target.selectionStart ?? nextText.length
          setCaretIndex(nextCaret)
          onChange({ ...value, text: nextText })
        }}
        onSelect={(e) => {
          const el = e.target as HTMLTextAreaElement
          setCaretIndex(el.selectionStart ?? el.value.length)
        }}
        onKeyUp={(e) => {
          const el = e.currentTarget
          setCaretIndex(el.selectionStart ?? el.value.length)
        }}
      />

      {open && (
        <div
          style={{
            marginTop: 6,
            border: "1px solid rgba(0,0,0,0.2)",
            borderRadius: 8,
            overflow: "hidden",
            maxWidth: 480,
          }}
        >
          {loading && (
            <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>
              Searching…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, opacity: 0.7 }}>
              No matches
            </div>
          )}
          {!loading &&
            items.map((m) => (
              <button
                key={`${m.type}:${m.id}`}
                type="button"
                onClick={() => insertMention(m)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  background: "transparent",
                  padding: "8px 10px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>@{m.type}</div>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}


