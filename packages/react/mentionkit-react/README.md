# mentionkit-react

React helpers/components for **ID-backed `@mentions` (“pills”)**.

This package is designed so you can:

- Use a **drop-in vanilla UI** (`MentionComposer`)
- Or build a **fully custom UI** (your design system) using the headless hook (`useMentionComposer`)

## Install

```bash
npm install mentionkit-react
```

Peer dependency: `react >= 18`.

## Core idea (controlled value)

`MentionComposer` is a controlled component. You own the state:

```ts
export type MentionComposerValue = {
  text: string
  mentions: Array<{ type: string; id: string; label?: string }>
}
```

- `text`: prompt-safe plain text (never put IDs into prompts)
- `mentions`: structured `{type,id,label}` payload for backend resolution + validation

Suggestion items returned by your app:

```ts
export type MentionSuggestion = { type: string; id: string; label: string }
```

## 1) Vanilla usage (drop-in)

```tsx
import { useState } from "react"
import { MentionComposer, type MentionComposerValue, type MentionSuggestion } from "mentionkit-react"

const initial: MentionComposerValue = { text: "", mentions: [] }

export function MyComposer() {
  const [value, setValue] = useState<MentionComposerValue>(initial)

  const getSuggestions = async (query: string): Promise<MentionSuggestion[]> => {
    // Return [{ type, id, label }] from your API/search layer.
    return []
  }

  return (
    <MentionComposer
      value={value}
      onChange={setValue}
      placeholder="Try: @contact Dwight"
      getSuggestions={getSuggestions}
      // Optional: controls duplicate insertion at the UI layer:
      // duplicatePolicy="dedupeByTypeId"
    />
  )
}
```

### Duplicate insertion policy (frontend)

The spec allows duplicates (even identical `{type,id}` repeated). UI behavior is configurable:

- `duplicatePolicy="allow"` (default): allow duplicates
- `duplicatePolicy="dedupeByTypeId"`: ignore inserting an already-present `{type,id}`

Your backend/parser may also dedupe. In the Python package, `parse_mentions(..., dedupe=True)` is the current default.

## 2) Custom UI (headless hook)

If you want to keep your own look/feel, use the headless hook and render everything yourself (menu, pills, styles).

### Minimal custom renderer

```tsx
import type { MentionComposerValue, MentionSuggestion } from "mentionkit-react"
import { useMentionComposer } from "mentionkit-react"

export function CustomComposer(props: {
  value: MentionComposerValue
  onChange: (next: MentionComposerValue) => void
  getSuggestions: (query: string) => Promise<MentionSuggestion[]>
}) {
  const composer = useMentionComposer({
    value: props.value,
    onChange: props.onChange,
    getSuggestions: props.getSuggestions,
    // duplicatePolicy: "dedupeByTypeId",
  })

  return (
    <div ref={composer.rootRef}>
      {/* Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {props.value.mentions.map((m, idx) => (
          <button key={`${m.type}:${m.id}:${idx}`} type="button" onClick={() => composer.removeMentionAt(idx)}>
            @{m.type} {m.label ?? m.id} ×
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        ref={composer.textareaRef}
        value={props.value.text}
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

      {/* Menu */}
      {composer.open && (
        <div {...composer.getListboxProps()}>
          {composer.items.map((item, idx) => (
            <button key={`${item.type}:${item.id}`} type="button" {...composer.getOptionProps(idx, item)}>
              {item.label} <span style={{ opacity: 0.7 }}>@{item.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

### What the hook gives you

`useMentionComposer(...)` manages:

- `@` token detection and query extraction
- Debounced suggestion fetching (`getSuggestions(query)`)
- Menu open/close, click-outside, blur behavior
- Keyboard navigation (Esc/Up/Down/Enter)
- Highlighted suggestion state
- Helper props for baseline a11y (`getListboxProps`, `getOptionProps`)

## Notes / current constraints (v0.1)

- **Pills are tracked separately** from the textarea text. Inserting a mention adds an entry to `value.mentions` and inserts the label into `value.text`.
- Your app is responsible for **backend validation + tenant/account scoping** of `mentions`.
- **Never include IDs in prompts**. Use labels/types/counts only when summarizing mentions for an LLM.

Docs in the repo root:

- `SPEC.md` (wire contract + privacy boundary)
- `SECURITY.md` (threat model + implementation guidance)


