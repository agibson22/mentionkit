# Changelog

All notable changes to this repository will be documented in this file.

This repo contains multiple packages:
- `mentionkit` (Python)
- `mentionkit-react` (React/TypeScript)

## Unreleased

- TBD

## v0.2.0

- **Python (`mentionkit`)**
  - Add `id_parser` to `parse_mentions(...)` to support non-UUID ID types while preserving the “IDs never in prompts” boundary.
  - Make mention IDs generic/hashable in types/results to support alternate identifier schemes.
  - Add tests for custom ID parsing + dedupe behavior.
  - Add Black + Ruff config and align versions with `agent-registry-router`.
  - Add pytest config (`pythonpath=["src"]`, `pytest-asyncio` loop scope default) to reduce setup and silence deprecation warnings.

- **React (`mentionkit-react`)**
  - Fix dark mode suggestion dropdown styling in `MentionComposer` by using theme tokens instead of hard-coded light-theme colors.

- **Demo (`examples/demo`)**
  - Overhaul demo page copy and layout (context blocks, payload caption, data-flow explanation).
  - Simplify demo by removing the shadcn renderer toggle and related demo-only component/styles.
  - Add optional full-stack mode: set `VITE_MENTIONKIT_API_BASE_URL` to fetch mention suggestions from a local demo API (falls back to mock suggestions if the API is unavailable).

- **Repo / CI**
  - Add GitHub Actions CI (uv-based) to run Python lint/format checks, tests, and package build.
  - Add repo `Makefile` with KISS targets for install/lint/format/test/build.
  - Add minimal badges (CI/license at root; PyPI/npm badges in package READMEs).
  - Add local backend demo API under `examples/api` (FastAPI) with `/suggest` + `/resolve` to demonstrate tenant-scoped deterministic resolution and prompt-safe summaries.
  - Add GitHub Pages workflow to deploy the frontend demo.

## v0.1.0

- Initial public extraction and dogfooding release.
- Python: parse/normalize/select mentions and produce prompt-safe summaries (no IDs).
- React: minimal `MentionComposer` + demo.


