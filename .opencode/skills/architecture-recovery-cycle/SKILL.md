---
name: architecture-recovery-cycle
description: Scans a brownfield repository, extracts physical module boundaries, and recovers them into ArchiMate ApplicationComponents and an architecture-mapping file.
---
# ARCHITECTURE RECOVERY CYCLE

Use this skill to initialize or recover the architecture baseline for a legacy (brownfield) codebase.

## BEHAVIORAL RULES
1. **Scan the Reality**: You MUST first call `scan_legacy_topology()` (with no arguments) to retrieve the macro-level physical domains of the repository.
2. **Establish Baseline**: Call `update_graph_model(action="ensure_architecture_baseline", content="Recovered brownfield baseline.")` to guarantee the core ArchiMate layers exist in the Shared Knowledge Graph.
3. **Recover Components (Active Structure)**: For each significant physical module returned by the scanner, use `update_graph_model(action="upsert_element", elementType="ApplicationComponent")` to create the module shell. Generate a deterministic ArchiMate ID (e.g., `ELM-COMP-AUTH`).

4. **Recover Functions & IPO Contracts (Behavior)**: This is CRITICAL. A component is just a shell. You MUST reverse-engineer its behavior:
   - Look at the `topSymbols` (signatures and names) returned for that module.
   - Abstract the most important 2-3 logical behaviors into `ApplicationFunction` elements. (e.g., if you see `login(user, pass)` and `validateToken()`, create an `ELM-FUNC-AUTHENTICATE` function).
   - Use `update_graph_model(action="upsert_element", elementType="ApplicationFunction")`.
   - In the `content` field of EVERY `ApplicationFunction`, you MUST reverse-engineer and write a strict IPO contract using exactly this Markdown shape:
     - **[Input]**: (Deduce from the symbol signatures, e.g., args/payloads)
     - **[Processing]**: (Deduce the core business logic or state what the legacy code currently does)
     - **[Output]**: (Deduce from the return types or side effects)
     - **[Acceptance Criteria]**: (Write baseline regression criteria to protect this legacy function)

5. **Bind Functions to Components**: You MUST connect each `ApplicationFunction` to its parent `ApplicationComponent` using an `Assignment` relationship via `update_graph_model(action="upsert_relationship", type="Assignment")`.

6. **Bind Reality to Intent (Architecture Mapping)**: You MUST use the `write` tool to create or overwrite `.opencode/architecture-mapping.yaml`. Map ONLY the `ApplicationComponent` IDs to their physical directory globs (e.g., `paths: ["src/auth/**"]`). Do not map individual functions in the YAML.

7. **Report**: Return a structured summary detailing the recovered modules, their assigned ArchiMate IDs, the inferred responsibilities, the recovered `ApplicationFunction` elements and IPO contracts, the created Assignment relationships, and confirmation that the mapping file was written successfully. Do NOT generate implementation tasks.