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

export type MentionComposerDuplicatePolicy = "allow" | "dedupeByTypeId"


