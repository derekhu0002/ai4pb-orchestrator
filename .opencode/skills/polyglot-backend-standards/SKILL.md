---
name: polyglot-backend-standards
description: Backend coding standards and implementation guidance for Python, Java, Go, and C# projects.
---

# Polyglot Backend Standards

Use this skill when working in backend codebases where the dominant implementation language is Python, Java, Go, or C#.

## When To Use

- Implementing or refactoring backend services outside the TS/JS stack
- Reviewing code structure, naming, and error handling in Python, Java, Go, or C#
- Choosing language-appropriate conventions for service, domain, and API layers
- Validating whether new code fits the surrounding backend style

## Shared Principles

- Prefer explicit, readable code over compact cleverness.
- Keep side effects near boundaries and business rules in testable units.
- Validate external inputs early and convert them into typed domain shapes.
- Keep transport concerns separate from domain and persistence concerns.
- Use structured errors and actionable log messages.
- Avoid hidden global state and implicit ambient coupling.

## Python

- Prefer small modules with explicit imports and typed public APIs.
- Use dataclasses, pydantic models, or explicit typed objects for boundary payloads.
- Keep I/O at the edge; pure business logic should not depend on framework globals.
- Use context managers for resources and keep async boundaries explicit.

## Java

- Prefer clear package boundaries and constructor injection over static service lookup.
- Keep domain objects separate from controller, persistence, and DTO concerns.
- Use checked or runtime exceptions intentionally; do not swallow root causes.
- Favor immutable value objects where possible.

## Go

- Keep packages small and cohesive; name by responsibility, not by generic layers alone.
- Return errors explicitly and wrap them with context near boundaries.
- Accept interfaces where behavior is needed; return concrete types when practical.
- Keep HTTP handlers thin and move business logic into services or domain packages.

## C#

- Prefer explicit dependency injection and avoid service locator patterns.
- Keep controllers/endpoints thin; move orchestration and business rules into services.
- Use records and immutable models where they clarify intent.
- Handle async flows consistently and avoid blocking on async tasks.

## Review Checklist

- Is the code following the dominant language idiom rather than a copied pattern from another language?
- Are validation, domain logic, and infrastructure responsibilities separated clearly?
- Are errors surfaced with enough context for operators and maintainers?
- Does the naming reflect domain intent instead of generic technical labels?
- Are tests and verification steps aligned with the actual language toolchain?