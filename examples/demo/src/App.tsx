import { useMemo, useState } from "react"
import { MentionComposer, type MentionComposerValue, type MentionSuggestion } from "mentionkit-react"
import "./App.css"

function App() {
  const [value, setValue] = useState<MentionComposerValue>({ text: "", mentions: [] })

  const getSuggestions = async (query: string): Promise<MentionSuggestion[]> => {
    // Tiny mocked data set for v0.1 demo.
    const all: MentionSuggestion[] = [
      { type: "contact", id: "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8", label: "Dwight Schrute" },
      { type: "contact", id: "11111111-1111-4111-8111-111111111111", label: "Jim Halpert" },
      { type: "meeting", id: "22222222-2222-4222-8222-222222222222", label: "Conference Room All Hands" },
      { type: "assignment", id: "33333333-3333-4333-8333-333333333333", label: "Follow up with David" },
    ]
    const q = query.trim().toLowerCase()
    if (!q) return all.slice(0, 6)
    return all.filter((x) => `${x.type} ${x.label}`.toLowerCase().includes(q)).slice(0, 6)
  }

  const payloadPreview = useMemo(() => {
    return JSON.stringify(
      {
        content: value.text,
        page_context: { mentions: value.mentions },
      },
      null,
      2
    )
  }, [value])

  return (
    <div style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>mentionkit demo</h1>
      <div style={{ opacity: 0.8, marginBottom: 16 }}>
        Type <code>@</code> to see suggestions, click to insert a pill.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Composer</div>
          <MentionComposer
            value={value}
            onChange={setValue}
            placeholder="Try: @contact Dwight"
            getSuggestions={getSuggestions}
          />
        </div>

        <div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Payload preview</div>
          <pre
            style={{
              padding: 12,
              borderRadius: 8,
              border: "1px solid rgba(0,0,0,0.2)",
              background: "rgba(0,0,0,0.03)",
              overflow: "auto",
              maxHeight: 360,
            }}
          >
            {payloadPreview}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App
