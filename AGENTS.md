# AGENTS.md

Repository guide for coding agents working in `ai4pb-orchestrator`.

## 1. Project Snapshot

- This repo is a VS Code extension written primarily in TypeScript.
- Entry point: `src/extension.ts`.
- Build output is generated into `out/`.
- There is also a small Python AST scanner in `src/ast/py/scan_python_reality.py`.
- The extension orchestrates AI4PB workflow prompts, architecture exports, audits, and iteration artifacts.

## 2. Source Of Truth

- Treat `src/` as the editable implementation source.
- Treat `out/` as generated output from TypeScript compilation.
- Do not hand-edit `out/*.js` unless the user explicitly asks for generated artifacts.
- Keep architecture/workflow prompt assets aligned with `skills/`, `.github/skills/`, `.opencode/skills/`, and `.agents/skills/`.

## 3. Rules Files Scan Result

- No `.cursorrules` file was found.
- No `.cursor/rules/` directory was found.
- No `.github/copilot-instructions.md` file was found.
- Because those rule files are absent, use repository conventions from source, README docs, and bundled AI4PB skill files.

## 4. Primary Commands

Run commands from the repository root.

### Setup

- Install dependencies: `npm install`

### Build

- Compile TypeScript: `npm run compile`
- Watch mode: `npm run watch`
- Type-check without emitting JS: `npx tsc --noEmit`

### Packaging

- Build VSIX without version bump: `npm run release:vsix:nobump`
- Build VSIX with patch bump: `npm run release:vsix`
- Build VSIX with minor bump: `npm run release:vsix:minor`
- Build VSIX with major bump: `npm run release:vsix:major`

### Lint / Static Verification

- There is no ESLint, Biome, Prettier, or Ruff config in this repo.
- Use `npx tsc --noEmit` as the main static verification command.
- Use `npm run compile` to confirm the extension still builds end-to-end.

### Tests

- There is no formal automated test suite configured in `package.json`.
- No Jest, Vitest, Mocha, or pytest config was found.
- `npm test` is not defined.

### Single-Test Guidance

- There is currently no single-test command because no automated test runner is configured.
- If asked to run a single test, state that no test harness exists yet and use the narrowest available verification instead:
  - `npx tsc --noEmit`
  - `npm run compile`
  - targeted manual smoke testing in the VS Code Extension Host

### Manual Runtime Verification

- Preferred manual check: run the `Run AI4PB Extension` launch configuration in `.vscode/launch.json`.
- That launch config uses `npm: compile` as a prelaunch build step.
- After launching, verify key commands appear and the AI4PB sidebar/webview loads.

## 5. Files And Areas You Will Touch Most

- `src/extension.ts`: extension activation, commands, webview logic, workflow routing.
- `src/architectureRealityService.ts`: architecture vs implementation reconciliation.
- `src/ast/ts/scanTypeScriptReality.ts`: TypeScript reality scanning with `ts-morph`.
- `src/ast/py/scan_python_reality.py`: Python scanner for repository reality data.
- `skills/*/SKILL.md`: prompt templates used by workflow commands.

## 6. Output Boundary Rules

- Business/project deliverables belong under `implementation/`.
- Process/debug artifacts belong under `TEMP/`, `debug/`, or `design/temp/`.
- Architecture source data lives under `design/`.
- Keep generated reports and temporary outputs out of `src/`.

## 7. TypeScript Style

- Use 2-space indentation.
- Use semicolons.
- Use single quotes for strings unless the file already requires otherwise.
- Prefer explicit types for exported functions, important helpers, and structured objects.
- Keep `strict` TypeScript compatibility; `tsconfig.json` has `"strict": true`.
- Prefer `type` aliases for unions and configuration shapes; this repo uses them heavily.
- Preserve `commonjs` module style and ES2021 target assumptions.

## 8. Import Conventions

- Group imports with Node/VS Code dependencies first, then local modules.
- For Node built-ins and `vscode`, prefer namespace imports when consistent with existing code:
  - `import * as fs from 'fs';`
  - `import * as path from 'path';`
  - `import * as vscode from 'vscode';`
- Use named imports for local symbols when only a few are needed.
- Avoid unused imports; keep imports minimal and stable.
- Do not introduce default exports; none were found in the TypeScript source.

## 9. Naming Conventions

- `PascalCase` for classes and exported type aliases.
- `camelCase` for functions, methods, variables, and non-constant helpers.
- `UPPER_SNAKE_CASE` for top-level constant maps and configuration tables when they are effectively static registries.
- Use descriptive string-literal union types for finite modes and routing keys.
- Keep command IDs in the existing dotted format, e.g. `ai4pb.startIterationFromModel`.

## 10. Error Handling

- Throw `new Error(...)` for internal invariants or unrecoverable failures.
- Include actionable context in error messages.
- Catch errors at command/workflow boundaries and surface them through `vscode.window.showErrorMessage(...)` or `showWarningMessage(...)`.
- Prefer user-facing messages for recoverable workflow problems and thrown errors for programmer/configuration faults.
- Do not silently swallow errors.

## 11. File System And Path Handling

- Use `fs` synchronous APIs when matching the existing extension codepath style.
- Create directories with `fs.mkdirSync(..., { recursive: true })` before writing files.
- Read and write text with explicit UTF-8 encoding.
- Normalize repo-stored paths to forward slashes when serializing or comparing paths.
- Use `path.join(...)` and `path.relative(...)` instead of manual separator concatenation.

## 12. Architecture Traceability

- This repo expects architecture traceability comments in implementation code.
- When adding or materially changing classes/functions tied to architecture work, include `// @ArchitectureID: <id>`.
- Follow the nearest existing pattern in the touched file.
- Do not invent an architecture ID if none is available; ask only when the task truly depends on it.

## 13. Workflow-Specific Guardrails

- Many repo skills require reading `design/KG/SystemArchitecture.json` before making architecture claims.
- When a workflow references a `view`, resolve IDs through top-level `elements`, `relationships`, and `views` together.
- Do not claim a view lacks semantics just because `included_elements` or `included_relationships` contain only IDs.
- If you only have partial architecture JSON, say the conclusion is partial.

## 14. Editing Guidance

- Prefer small, surgical edits over broad rewrites.
- Preserve existing bilingual content when editing docs or prompts.
- Keep Markdown outputs concise and structured; many repo artifacts are intended for downstream LLM consumption.
- Avoid introducing new dependencies unless clearly necessary.
- If you add a dependency, update `package.json` and ensure `npm run compile` still succeeds.

## 15. Validation Expectations After Changes

- Minimum validation for TypeScript changes:
  - `npx tsc --noEmit`
  - `npm run compile`
- For packaging/release script changes, also consider:
  - `npm run release:vsix:nobump`
- For workflow/UI changes, run the Extension Host manually if feasible.
- If you cannot run a validation step, say so explicitly and explain why.

## 16. Python Scanner Notes

- The Python scanner is stdlib-based; do not add third-party Python packages casually.
- Keep Python changes simple, portable, and compatible with AST-based scanning behavior.
- Preserve JSON output schema compatibility with TypeScript consumers.

## 17. Documentation Priorities

- Update `README.md` when changing setup, workflow buttons, generated artifacts, or release steps.
- Update skill docs when behavior or output contracts change.
- Keep docs aligned with actual command names from `package.json` and actual output paths.

## 18. Practical Agent Defaults

- Start by inspecting `package.json`, `tsconfig.json`, `README.md`, and the directly affected source file.
- Prefer repository conventions over generic framework advice.
- If a requested test command does not exist, say so plainly and use compile/type-check/manual smoke verification instead.
- Never treat `out/` as the authoritative source when `src/` exists.

## 19. Quick Checklist For Agents

- Read the relevant source file before editing.
- Edit `src/`, not `out/`.
- Preserve `@ArchitectureID` comments where applicable.
- Run `npx tsc --noEmit` after code changes.
- Run `npm run compile` before finishing.
- Mention that no automated single-test command exists unless one is added later.
