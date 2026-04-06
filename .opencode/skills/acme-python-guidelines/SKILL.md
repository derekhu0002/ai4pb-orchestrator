---
name: acme-python-guidelines
description: Acme Corp Python coding standards with strict documentation, typing, and state-management rules.
---

# Acme Corp Python Guidelines

Apply this skill when the repository or task includes Python implementation governed by Acme Corp standards.

## Required Rules

- Every Python function and method must include a Google-style docstring.
- Public functions, methods, and module-level constants must have explicit type hints.
- Global mutable state is forbidden; use dependency injection or explicit objects instead.
- Exceptions must include actionable context and may not be swallowed silently.
- File I/O, network access, and subprocess execution must stay at clear boundary layers.

## Review Checklist

- Does each function include a Google-style docstring with intent, args, and returns where applicable?
- Are public APIs fully type-annotated and consistent with the surrounding module?
- Has global mutable state been avoided entirely?
- Are boundary side effects isolated from core business logic?
- Do raised errors preserve the original failure context?