PYTHON ?= python3

.PHONY: install lint format test build py-install py-lint py-format py-test py-build demo-lint demo-build

# KISS: one Makefile for common commands across the repo.
# - Python package lives in packages/python/mentionkit
# - Demo lives in examples/demo

install:
	npm install
	cd packages/python/mentionkit && uv pip install -e ".[dev]"

lint: py-lint demo-lint

format: py-format

test: py-test demo-build

build: py-build demo-build

py-install:
	cd packages/python/mentionkit && uv pip install -e ".[dev]"

py-lint:
	cd packages/python/mentionkit && uv run ruff check src tests
	cd packages/python/mentionkit && uv run black --check src tests

py-format:
	cd packages/python/mentionkit && uv run ruff check --fix src tests
	cd packages/python/mentionkit && uv run black src tests

py-test:
	cd packages/python/mentionkit && uv run pytest -q

py-build:
	cd packages/python/mentionkit && uv run python -m build

demo-lint:
	npm -w examples/demo run lint

demo-build:
	npm -w examples/demo run build


