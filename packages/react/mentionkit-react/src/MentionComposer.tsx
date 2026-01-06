import type { MentionPayload } from "./types"

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

/**
 * Minimal v0.1 scaffold.
 *
 * This currently behaves like a plain textarea; upcoming steps will add:
 * - `@` detection
 * - pill rendering
 * - suggestion UI + insertion
 */
export function MentionComposer(props: MentionComposerProps) {
  const { value, onChange, placeholder } = props

  return (
    <textarea
      value={value.text}
      placeholder={placeholder}
      onChange={(e) => onChange({ ...value, text: e.target.value })}
    />
  )
}


