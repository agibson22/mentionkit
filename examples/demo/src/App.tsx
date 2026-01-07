import { useMemo, useState, useEffect } from "react"
import { MentionComposer, type MentionComposerValue, type MentionSuggestion } from "mentionkit-react"
import "./App.css"

function SunIcon() {
  return (
    <svg className="demoThemeIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm0-16V1m0 22v-1m10-10h1M1 12h1m17.07 7.07.7.7M4.93 4.93l.7.7m0 13.44-.7.7m14.14-14.14-.7.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="demoThemeIcon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function App() {
  const [value, setValue] = useState<MentionComposerValue>({ text: "", mentions: [] })
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme")
    if (saved === "dark" || saved === "light") return saved
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }

  const apiBaseUrl = import.meta.env.VITE_MENTIONKIT_API_BASE_URL as string | undefined
  const suggestionsMode = apiBaseUrl ? "api" : "mock"

  const getSuggestions = async (query: string): Promise<MentionSuggestion[]> => {
    const all: MentionSuggestion[] = [
      { type: "contact", id: "4c0a9e7a-2f40-4c64-9b7a-1f447f1b7ef8", label: "Dwight Schrute" },
      { type: "contact", id: "11111111-1111-4111-8111-111111111111", label: "Jim Halpert" },
      { type: "meeting", id: "22222222-2222-4222-8222-222222222222", label: "Conference Room All Hands" },
      { type: "assignment", id: "33333333-3333-4333-8333-333333333333", label: "Follow up with David" },
    ]

    if (apiBaseUrl) {
      try {
        const url = new URL("/suggest", apiBaseUrl)
        url.searchParams.set("q", query)
        const res = await fetch(url.toString(), { headers: { "X-Tenant-Id": "demo" } })
        if (!res.ok) throw new Error(`suggest failed: ${res.status}`)
        const items = (await res.json()) as MentionSuggestion[]
        return items.slice(0, 6)
      } catch (err) {
        // Fall back to mock suggestions so the demo stays usable even if the API is down/misconfigured.
        console.warn("mentionkit demo: falling back to mock suggestions; API error:", err)
      }
    }

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
    <div className="demoPage">
      <div className="demoHeader">
        <div className="demoHeaderSpacer" aria-hidden="true" />
        <h1 className="demoTitle">mentionkit demo</h1>
        <button
          type="button"
          className="demoThemeToggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
      <div className="demoSubtitle">
        Type <code>@</code> to see suggestions; use click or Enter to insert a pill.{" "}
        <span className="demoPillMode">Suggestions: {suggestionsMode}</span>
      </div>

      <div className="demoDemoCard">
        <div className="demoDemoGuide">
          <div className="demoGuideCard">
            <div className="demoGuideTitle">Try this</div>
            <ol className="demoGuideList">
              <li>
                Type <code>@</code>, select <strong>Dwight Schrute</strong>.
              </li>
              <li>
                Add another mention like <strong>Conference Room All Hands</strong>.
              </li>
              <li>Delete a pill and watch the payload update.</li>
            </ol>
          </div>
          <div className="demoGuideCard">
            <div className="demoGuideTitle">Notice</div>
            <ul className="demoGuideList">
              <li>The payload preview includes IDs for clarity; prompts should not.</li>
              <li>The backend uses mention IDs to resolve the exact entity (tenant/account scoped), even if names are ambiguous.</li>
            </ul>
          </div>
        </div>

        <div className="demoGrid">
          <div>
            <div className="demoSectionTitle">Composer</div>
            <div className="demoSectionCaption">Type <code>@</code> to insert a mention pill.</div>

            <MentionComposer
              value={value}
              onChange={setValue}
              placeholder="Try: @contact Dwight"
              getSuggestions={getSuggestions}
            />
          </div>

          <div className="demoPreview">
            <div className="demoSectionTitle">Payload preview</div>
            <div className="demoSectionCaption">
              Backend-only payload (IDs are shown here for clarity; don&apos;t put them in prompts).
            </div>
            <pre className="demoPre">{payloadPreview}</pre>
          </div>
        </div>
      </div>

      <div className="demoContext">
        <div className="demoContextCard">
          <div className="demoContextEyebrow">What you&apos;re looking at</div>
          <div className="demoContextTitle">
            A chat composer that produces <span className="demoContextEmphasis">two outputs</span>: (1) prompt-safe text and (2) a
            structured mentions payload for your backend.
          </div>
          <div className="demoContextGrid">
            <div className="demoContextItem">
              <div className="demoContextItemTitle">LLM-safe text</div>
              <div className="demoContextItemBody">
                Send only <code>content</code> to the LLM. It contains human-readable labels, never stable IDs.
              </div>
            </div>
            <div className="demoContextItem">
              <div className="demoContextItemTitle">Backend-only mentions</div>
              <div className="demoContextItemBody">
                Your app uses <code>page_context.mentions</code> to resolve entities deterministically (and validate tenant/account scope)
                before tool execution.
              </div>
            </div>
          </div>
        </div>

        <div className="demoFlowCard">
          <div className="demoFlowTitle">Data flow</div>
          <div className="demoFlowBody">
            <div className="demoFlowDiagram">
              <div className="demoFlowStep">
                <div className="demoFlowStepTitle">1) User mentions an entity</div>
                <div className="demoFlowStepBody">
                  The UI collects <code>content</code> (text) and <code>page_context.mentions</code> (IDs).
                </div>
              </div>

              <div className="demoFlowStep">
                <div className="demoFlowStepTitle">2) UI → Backend (request)</div>
                <pre className="demoFlowPre">{`{
  content: "Schedule Dwight",
  page_context: { mentions: [{ type, id, label }] }  // IDs live here
}`}</pre>
              </div>

              <div className="demoFlowStep">
                <div className="demoFlowStepTitle">3) Backend → LLM (prompt)</div>
                <div className="demoFlowStepBody">
                  Backend builds the prompt from <code>content</code> plus a safe mentions summary (labels/types/counts).{" "}
                  <strong>IDs are never included in the prompt.</strong>
                </div>
                <pre className="demoFlowPre demoFlowPreSafe">{`Prompt:
- content (text)
- Mentions: contact=[Dwight Schrute]   // labels only
- (no IDs)`}</pre>
              </div>

              <div className="demoFlowStep">
                <div className="demoFlowStepTitle">4) LLM tool calls ↔ Backend (orchestration)</div>
                <div className="demoFlowStepBody">
                  If the LLM requests a tool, the backend executes it by resolving the correct entity <strong>by ID</strong>{" "}
                  (tenant/account-scoped), then returns tool results to the LLM.
                </div>
                <pre className="demoFlowPre">{`LLM: call tool(...)
Backend: validate scope → resolve by ID → run tools/queries
Backend → LLM: tool result (no stable IDs in prompts/logs)`}</pre>
              </div>

              <div className="demoFlowStep">
                <div className="demoFlowStepTitle">5) Backend → UI (final answer)</div>
                <div className="demoFlowStepBody">Backend returns the final response to the UI.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Try/Notice live with the demo card above */}
      </div>
    </div>
  )
}

export default App
