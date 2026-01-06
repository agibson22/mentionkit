export type MentionPayload = {
  type: string
  id: string
  label?: string
}

export type PageContext = {
  mentions?: MentionPayload[]
  // Other keys are app-defined.
  [key: string]: unknown
}


