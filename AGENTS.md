# AGENTS.md

## Purpose

- This repository contains a VS Code extension (`src/extension.ts`) plus an embedded OpenCode plugin/package in `.opencode/`.
- Use this file as the operating guide for coding agents working in this repo.
- Prefer minimal, targeted edits; this repo has a large monolithic extension file and mirrored prompt assets.

## Rule Sources Checked

- No `.cursor/rules/` directory was found.
- No `.cursorrules` file was found.
- No `.github/copilot-instructions.md` file was found.
- No separate Cursor/Copilot ruleset exists here; agent guidance instead lives in `.opencode/instructions/INSTRUCTIONS.md` and `skills/*/SKILL.md`.

## Repository Map

- `src/extension.ts`: main VS Code extension host logic.
- `media/workflowView.js`: webview runtime used by the extension UI.
- `out/`: compiled JS output from TypeScript; treat as generated.
- `skills/`: source prompt/skill content; `.github/skills/` and `.opencode/skills/` are bundled mirrors.
- `.opencode/`: separate TypeScript package for OpenCode plugins/tools.
- `script/EA-jsscript/`: Enterprise Architect helper scripts.
- `design/`, `implementation/`, `TEMP/`, `debug/`: workflow artifacts, reports, and generated project content.

## Environment Notes

- Root package is a VS Code extension targeting VS Code `^1.95.0`.
- Root TypeScript config is strict and compiles `src/` to `out/`.
- `.opencode/` is a separate Node/TypeScript package using `module: NodeNext` and `verbatimModuleSyntax`.
- `.aicodingconfig` is ignored by Git; treat it as local environment/config state.

## Install And Build Commands

### Root extension

- Install deps: `npm install`
- Compile once: `npm run compile`
- Watch compile: `npm run watch`
- Type-check without emitting: `npx tsc --noEmit`
- Build VSIX with patch bump: `npm run release:vsix`
- Build VSIX with minor bump: `npm run release:vsix:minor`
- Build VSIX with major bump: `npm run release:vsix:major`
- Build VSIX without version bump: `npm run release:vsix:nobump`

### `.opencode` package

- Install deps: `npm install` (run inside `.opencode/`)
- Build package: `npm run build`
- Clean build output: `npm run clean`
- Pre-publish hook: `npm run prepublishOnly`

## Lint / Format Commands

- No dedicated root lint script exists.
- No ESLint/Biome config was found at repo root.
- Default JS/TS formatting guidance comes from `.opencode/instructions/INSTRUCTIONS.md` and ECC hooks.
- Format a file manually: `npx prettier --write <file>`
- Recommended targeted format examples:
- `npx prettier --write src/extension.ts`
- `npx prettier --write media/workflowView.js`
- `npx prettier --write .opencode/tools/run-tests.ts`
- After TS edits, run `npx tsc --noEmit` even if you also run `npm run compile`.

## Test Commands

- There is currently no automated test script in the root `package.json`.
- There is also no test script in `.opencode/package.json`.
- There are no repo-local Jest/Vitest/Playwright config files in active use here.
- For this codebase, "test" usually means type-check + compile + focused manual validation.

### Single-test guidance

- A true single-test command is not currently available because no test runner is configured.
- If you add a test framework later, expose a `test` script and document the exact single-test form here.
- Note: `.opencode/tools/run-tests.ts` expects Jest/Vitest single-test runs to look like:
- `npm run test -- --testPathPattern <pattern>`
- That is helper logic for future/test-enabled repos, not a working command in this repo today.

## Recommended Verification Workflow

- For root extension changes: `npx tsc --noEmit && npm run compile`
- For `.opencode` changes: run `npm run build` inside `.opencode/`
- For formatting-sensitive JS/TS changes: run `npx prettier --write <edited-files>`
- For user-facing extension changes, also validate manually in VS Code Extension Host if possible.
- Do not hand-edit `out/extension.js`; rebuild it from `src/extension.ts`.

## Code Style: Global Rules

- Preserve the style already used in the file you touch; this repo is intentionally mixed-style across subpackages.
- Keep changes narrow; avoid drive-by formatting changes.
- Use TypeScript types explicitly; both TS configs are strict.
- Prefer `const`, early returns, and small helpers over mutable state or deep nesting.
- Avoid adding dependencies unless clearly necessary.
- Avoid hardcoded secrets, tokens, passwords, or machine-specific paths.

## Code Style: Imports

- Keep imports at the top of the file.
- In `src/extension.ts`, use single quotes, keep semicolons, and follow existing import patterns such as `import * as vscode from 'vscode';`.
- In `src/extension.ts`, prefer named imports only where the surrounding code already does so, such as `import { randomBytes } from 'crypto';`.
- In `.opencode/*.ts`, use double quotes, omit semicolons, and keep ESM-style imports consistent with NodeNext output.

## Code Style: Formatting

- Root extension code uses 2-space indentation plus semicolons.
- `.opencode` code uses 2-space indentation, no semicolons, and double quotes.
- Keep object literals and union types vertically readable when they span multiple properties.
- Do not reflow large inline HTML/CSS/JS blocks in `src/extension.ts` unless the task requires it.
- Prefer ASCII unless the file already contains intentional non-ASCII content.
- Chinese UI strings already exist in the extension; preserve and extend them consistently when relevant.

## Code Style: Types And Naming

- Use `PascalCase` for types, classes, and interfaces; use `camelCase` for variables, functions, parameters, and helpers.
- Use `UPPER_SNAKE_CASE` only for true constants if that file already follows it.
- Root extension commonly uses `type` aliases for unions and config shapes; match that pattern.
- Keep string literal unions narrow and explicit.
- Avoid `any`; prefer `unknown` plus narrowing.
- When parsing external input, normalize and validate before use.

## Code Style: Error Handling

- Wrap command handlers and integration boundaries in `try/catch`.
- Convert unknown errors with `error instanceof Error ? error.message : String(error)`.
- Show concise user-facing messages through VS Code UI APIs when in extension code.
- Log technical detail to the output channel when useful; do not expose stack traces to end users unnecessarily.
- Prefer actionable error text that includes the failing subsystem or command.
- Preserve existing warning/error UX patterns such as `showWarningMessage` and `showErrorMessage`.

## Code Style: Async And Process Execution

- Use `async`/`await` instead of raw promise chains for new code.
- Keep timeout handling explicit around CLI/server integrations.
- Surface stdout/stderr in failure paths only as needed for debugging.
- Normalize cross-platform path/command handling carefully; this repo supports Windows + WSL scenarios.
- When touching OpenCode execution code, preserve both `cli` and `server` transport behavior.

## VS Code Extension Conventions

- Register commands in `activate()` and dispose through `context.subscriptions`.
- Keep webview state synchronization behavior intact when editing workflow UI logic.
- Preserve CSP-safe patterns in generated HTML.
- Use `vscode.Uri`, `workspaceState`, and `show*Message` APIs consistently with surrounding code.
- Keep command IDs under the existing `ai4pb.*` namespace.
- Preserve `@ArchitectureID` comments; they appear to be design-traceability markers.

## `.opencode` Package Conventions

- Tools are defined with `export default tool({ ... })`.
- Tool args should be declared via `tool.schema` and described clearly.
- Existing tools usually return JSON strings rather than raw objects; preserve that contract.
- Keep helper functions pure and local when possible, avoid CommonJS patterns, and respect NodeNext import paths such as `./plugins/index.js`.

## Files To Treat As Generated Or Mirrored

- `out/extension.js` and `out/extension.js.map` are generated; `.github/skills/*` and `.opencode/skills/*` mirror `skills/*`.
- If you change a source skill, update mirrored copies only if the task explicitly requires bundled sync.
- Avoid editing generated artifacts as the primary source of truth.

## Practical Agent Advice

- Start by identifying whether the task belongs to the root extension, the webview runtime, or `.opencode/`.
- Match the local style of the file you edit instead of imposing one repo-wide style, and run the narrowest useful verification command afterward.
- If a task mentions tests, note clearly that this repo currently lacks a configured automated test suite.
- If you add a new command, script, formatter, linter, or test runner, update this file so later agents inherit the new workflow.
