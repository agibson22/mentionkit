import type { MentionComposerValue, MentionSuggestion } from "mentionkit-react"
import { useMentionComposer } from "mentionkit-react"

export type ShadcnStyledComposerProps = {
  value: MentionComposerValue
  onChange: (next: MentionComposerValue) => void
  placeholder?: string
  getSuggestions: (query: string) => Promise<MentionSuggestion[]>
}

export function ShadcnStyledComposer(props: ShadcnStyledComposerProps) {
  const { value, onChange, placeholder, getSuggestions } = props

  const composer = useMentionComposer({
    value,
    onChange,
    getSuggestions,
  })


  return (
    <div ref={composer.rootRef} className="mkCard">
      {value.mentions.length > 0 && (
        <div className="mkPills">
          {value.mentions.map((m, idx) => {
            const label = m.label || m.id
            return (
              <span
                // eslint-disable-next-line react/no-array-index-key
                key={`${m.type}:${m.id}:${idx}`}
                className="mkPill"
              >
                <span className="mkPillType">@{m.type}</span>
                <span className="mkPillLabel">{label}</span>
                <button
                  type="button"
                  className="mkPillX"
                  onClick={() => composer.removeMentionAt(idx)}
                  aria-label={`Remove mention ${label}`}
                  title="Remove mention"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            )
          })}
        </div>
      )}

      <textarea
        ref={composer.textareaRef}
        className="mkTextarea"
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
        <div className="mkMenu">
          {composer.loading && <div className="mkMenuMeta">Searching…</div>}
          {!composer.loading && composer.items.length === 0 && <div className="mkMenuMeta">No matches</div>}
          {!composer.loading && composer.items.length > 0 && (
            <div {...composer.getListboxProps()}>
              {composer.items.map((m, idx) => (
                <button
                  key={`${m.type}:${m.id}`}
                  type="button"
                  {...composer.getOptionProps(idx, m)}
                  className={idx === composer.highlightedIndex ? "mkMenuItem mkMenuItemActive" : "mkMenuItem"}
                >
                  <div className="mkMenuItemLabel">{m.label}</div>
                  <div className="mkMenuItemType">@{m.type}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}


