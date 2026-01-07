import { useMemo, useState, useEffect } from "react"
import { MentionComposer, type MentionComposerValue, type MentionSuggestion } from "mentionkit-react"
import { ShadcnStyledComposer } from "./ShadcnStyledComposer"
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
  const [renderer, setRenderer] = useState<"vanilla" | "shadcn">("vanilla")
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
      <div className="demoSubtitle">Type <code>@</code> to see suggestions; use click or Enter to insert a pill.</div>

      <div className="demoTabsOuter">
        <div className="demoTabs" role="tablist" aria-label="Renderer">
          <button
            type="button"
            className={renderer === "vanilla" ? "demoTab demoTabActive" : "demoTab"}
            role="tab"
            aria-selected={renderer === "vanilla"}
            onClick={() => setRenderer("vanilla")}
          >
            Vanilla
          </button>
          <button
            type="button"
            className={renderer === "shadcn" ? "demoTab demoTabActive" : "demoTab"}
            role="tab"
            aria-selected={renderer === "shadcn"}
            onClick={() => setRenderer("shadcn")}
          >
            Shadcn-styled
          </button>
        </div>
      </div>

      <div className="demoGrid">
        <div>
          <div className="demoSectionTitle">Composer</div>

          {renderer === "vanilla" ? (
            <MentionComposer
              value={value}
              onChange={setValue}
              placeholder="Try: @contact Dwight"
              getSuggestions={getSuggestions}
            />
          ) : (
            <ShadcnStyledComposer
              value={value}
              onChange={setValue}
              placeholder="Try: @contact Dwight"
              getSuggestions={getSuggestions}
            />
          )}
        </div>

        <div className="demoPreview">
          <div className="demoSectionTitle">Payload preview</div>
          <pre className="demoPre">{payloadPreview}</pre>
        </div>
      </div>
    </div>
  )
}

export default App
