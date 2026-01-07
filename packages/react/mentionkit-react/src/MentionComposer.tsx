import { useEffect, useState } from "react"
import type { MentionComposerDuplicatePolicy, MentionComposerValue, MentionSuggestion } from "./composerTypes"
import { useMentionComposer } from "./useMentionComposer"

export type MentionComposerProps = {
  value: MentionComposerValue
  onChange: (next: MentionComposerValue) => void

  placeholder?: string
  duplicatePolicy?: MentionComposerDuplicatePolicy

  /**
   * Called when the user is trying to insert a mention. Your app should return
   * suggestions (usually via an API call) based on the typed query.
   */
  getSuggestions: (query: string) => Promise<MentionSuggestion[]>
}

/**
 * Vanilla renderer built on the headless `useMentionComposer` hook.
 */
export function MentionComposer(props: MentionComposerProps) {
  const { value, onChange, placeholder, getSuggestions, duplicatePolicy } = props

  const composer = useMentionComposer({
    value,
    onChange,
    getSuggestions,
    duplicatePolicy,
  })

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document === "undefined") return false
    return document.documentElement.getAttribute("data-theme") === "dark"
  })

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.getAttribute("data-theme") === "dark")
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    return () => observer.disconnect()
  }, [])

  const borderColor = "var(--border-color, rgba(0,0,0,0.2))"
  const menuBg = "var(--bg-secondary, #ffffff)"
  const menuHoverBg = "var(--bg-tertiary, rgba(0,0,0,0.05))"
  const textPrimary = "var(--text-primary, #1a1a1a)"
  const textSecondary = "var(--text-secondary, rgba(0,0,0,0.7))"

  return (
    <div ref={composer.rootRef}>
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
                  border: `1px solid ${borderColor}`,
                  padding: "2px 10px",
                  fontSize: 12,
                  lineHeight: "18px",
                  userSelect: "none",
                  color: textPrimary,
                }}
              >
                <span style={{ opacity: 0.7 }}>@{m.type}</span>
                <span style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    composer.removeMentionAt(idx)
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
                    color: isDarkMode ? "#ffffff" : "#1a1a1a",
                    opacity: 1,
                  }}
                >
                  <span aria-hidden="true" style={{ color: isDarkMode ? "#ffffff" : "#1a1a1a" }}>×</span>
                </button>
              </span>
            )
          })}
        </div>
      )}

      <textarea
        ref={composer.textareaRef}
        value={value.text}
        placeholder={placeholder}
        onChange={composer.onTextChange}
        onSelect={composer.onTextSelect}
        onKeyUp={composer.onTextKeyUp}
        onKeyDown={composer.onTextKeyDown}
        onBlur={composer.onTextBlur}
        role="combobox"
        aria-expanded={composer.open}
        aria-controls={composer.open ? composer.listboxId : undefined}
        aria-activedescendant={composer.activeDescendantId}
      />

      {composer.open && (
        <div
          style={{
            marginTop: 6,
            border: `1px solid ${borderColor}`,
            borderRadius: 8,
            overflow: "hidden",
            maxWidth: 480,
            background: menuBg,
          }}
        >
          {composer.loading && (
            <div style={{ padding: 8, fontSize: 12, color: textSecondary }}>
              Searching…
            </div>
          )}
          {!composer.loading && composer.items.length === 0 && (
            <div style={{ padding: 8, fontSize: 12, color: textSecondary }}>
              No matches
            </div>
          )}
          {!composer.loading && (
            <div {...composer.getListboxProps()}>
              {composer.items.map((m, idx) => (
                <button
                  key={`${m.type}:${m.id}`}
                  type="button"
                  {...composer.getOptionProps(idx, m)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: idx === composer.highlightedIndex ? menuHoverBg : "transparent",
                    padding: "8px 10px",
                    cursor: "pointer",
                    color: textPrimary,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: textSecondary }}>@{m.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export type { MentionComposerDuplicatePolicy, MentionComposerValue, MentionSuggestion } from "./composerTypes"


