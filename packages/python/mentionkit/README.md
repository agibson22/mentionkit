## mentionkit (Python)

[![PyPI](https://img.shields.io/pypi/v/mentionkit)](https://pypi.org/project/mentionkit/)
[![Python](https://img.shields.io/pypi/pyversions/mentionkit)](https://pypi.org/project/mentionkit/)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](LICENSE)

Secure, ID-backed `@mentions` (“pills”) for LLM chat UIs.

Docs:
- `SPEC.md` (wire contract + privacy boundary): https://github.com/agibson22/mentionkit/blob/main/SPEC.md
- `SECURITY.md` (threat model + guidance): https://github.com/agibson22/mentionkit/blob/main/SECURITY.md

### Dev (lint/format/test)

```bash
cd /Users/ag/Sites/mentionkit/packages/python/mentionkit
python3 -m pip install -e ".[dev]"

# Format
black src tests

# Lint (and import sorting)
ruff check src tests

# Tests
pytest -q
```

