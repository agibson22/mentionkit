## mentionkit demo

This is a tiny Vite app that exercises `mentionkit-react`.

### What this demo is showing (why you should care)
LLM chat UIs need a clean UX for selecting real entities (contacts, meetings, etc) without leaking stable identifiers (UUID/ULID/etc) into prompts or prompt logs.

This demo shows a composer that produces **two outputs**:

- **Prompt-safe text** (`content`): what you send to an LLM (labels/types only; never IDs)
- **Backend-only payload** (`page_context.mentions`): what your backend uses to resolve entities deterministically and validate tenant/account scope before tool execution

### What to try
- Type `@`, select **Dwight Schrute**
- Add another mention like **Conference Room All Hands**
- Delete a pill and watch the payload preview update

### What to notice
- The payload preview includes IDs **for clarity**; your prompts should not.
- The backend uses mention IDs to resolve the exact entity (tenant/account scoped), even if names are ambiguous.

### Run locally

From the repo root:

```bash
cd /Users/ag/Sites/mentionkit
npm install
```

Then start the dev server:

```bash
cd examples/demo
npm run dev
```

### Full-stack mode (optional)

By default this demo uses a tiny mocked suggestions list (so it can be deployed as a static site, e.g. GitHub Pages).

If you want “soup to nuts” locally, run the demo API and point the Vite demo at it:

1) Start the backend demo API (FastAPI):

- See `examples/api/README.md` or run:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e packages/python/mentionkit
pip install -r examples/api/requirements.txt
python examples/api/app.py
```

2) Start the Vite demo in API mode:

```bash
cd examples/demo
VITE_MENTIONKIT_API_BASE_URL=http://127.0.0.1:8000 npm run dev
```

In the UI, you’ll see “Suggestions: api” when it’s using the backend (and “mock” otherwise).

---

## React + TypeScript + Vite (template notes)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
