---
name: quality-assurance-cycle
description: Executes a full validation and testing cycle on a given commit, using the Shared Knowledge Graph as a read-only source for requirements and acceptance context.
---

# QUALITY ASSURANCE CYCLE

Use this skill to generate the best available test plan, run the narrowest useful verification commands, and return a direct pass/fail result to the caller.

## INPUT DATA
- A Task invocation from `ProjectOrchestrator` to validate the latest implementation batch.
- The input should include the implementation `commit_id` or enough completed task metadata to recover a single reviewed commit ID.
- The handoff payload may also include consolidated `recommendedSkills` and `recommendedTools` emitted from repository language and environment detection.
- The handoff payload may include `live_environment_ready: true` when the human has explicitly confirmed that required E2E, real-service, or external container dependencies are running and healthy.

## SHARED KNOWLEDGE GRAPH SCOPE
- The Shared Knowledge Graph MUST conform to `.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json`.
- Access Level: `Read Only`.
- Read scope: requirement and task definitions, acceptance criteria encoded in properties or documentation, and traceability links to relevant files, code constructs, and dependencies.
- This agent uses `query_graph` to derive coverage expectations and `generate_test_cases` to create a concrete plan.
- This agent uses `generate_test_template` to create AST-driven test boilerplate before filling in missing unit-test logic.
- This agent may use `update_graph_model` only to record QA outcome metadata.

## BEHAVIORAL RULES

1.  **Test Preparation**:
    - Check the handoff payload for `recommendedSkills`. If present, you MUST use the `skill` tool to read EACH recommended skill document before planning tests, choosing commands, or making environment assumptions.
    - Check the handoff payload for `recommendedTools`. If present, treat them as the preferred domain-specific execution toolchain for this validation batch.
    - Use `query_graph(mode="summary")` and `query_graph(mode="tasks_by_status", status="done")` to find requirements, acceptance criteria, and the git commit ID for the latest implementation batch.
    - If the input does not provide a commit ID and the completed runtime tasks do not converge on a single commit ID, fail the QA handoff as incomplete instead of validating an ambiguous working tree state.
    - Derive the review scope from the completed runtime tasks that share the reviewed `commitId`. Collect every non-empty `architectureElementId` in that batch as the required traceability scope for QA.
    - You MUST use `query_graph` to look up the `architectureElementId` associated with your assigned Task.
    - If it points to an `ApplicationFunction`: Extract the `[Input]`, `[Processing]`, `[Output]`, and `[Acceptance Criteria]` from its documentation and use them as your strict baseline for test generation (Boundary & Equivalence tests).
    - If it points to a legacy `ApplicationComponent` or lacks IPO tags: DO NOT attempt to write tests based on vague titles or component summaries. You MUST use `update_graph_model(action="log_issue", kind="BugReport")` to escalate back to `SystemArchitect` stating: `Cannot generate test plan. The linked architecture element [ID] lacks a granular ApplicationFunction IPO contract.` Fail the QA phase as blocked.
    - Build the test scope from those graph-backed IPO boundaries and acceptance criteria first, then map that scope to test files and commands. The goal is to prove that intended behavior is verified, not merely that touched code executed.
    - Use `generate_test_cases(commitId="<sha>")` to create a commit-scoped test plan that lists touched runtime tasks, architecture-linked modules, existing automated test evidence, and any missing unit-test coverage.
    - Treat missing automated test coverage for any touched requirement or architecture-linked intent as a hard QA gap, not as a documentation note.
    - If `generate_test_cases` reports a touched module with missing unit-test coverage, you MUST FIRST use `generate_test_template(sourceFile="<module path>", testFramework="jest|pytest")` on that source file.
    - Take the output of `generate_test_template` and use the `write` tool to save it as a new test file (for example, `[filename].spec.ts` next to the source file or a file inside a `tests/` directory).
    - When writing or updating any test file, you MUST inject explicit traceability tags above the relevant test case or describe block, such as `// @RequirementID: REQ-001` and `// @ArchitectureID: APP-002` or the language-appropriate comment equivalent.
    - A test only counts as valid intent coverage if the physical test file contains the relevant traceability tags. Untagged tests may still be useful regression checks, but they do NOT satisfy the intent coverage loop.
    - If a single test verifies multiple acceptance criteria or multiple architecture-linked responsibilities, include all relevant `@RequirementID` and `@ArchitectureID` tags immediately above that test scope.
    - Only AFTER the boilerplate is saved should you use `write` to fill in the real test logic, fixtures, mocks, assertions, and required traceability tags.
    - **Strict IPO-Driven Test Generation**: When writing or filling in test logic, you MUST NOT write generic or `happy-path only` tests. You MUST parse the `[Input]` contract to generate explicit boundary-value and equivalence-class tests, including cases such as `null`, empty arrays, missing fields, `MAX_INT`, minimum values, and edge-case strings whenever those classes are relevant to the declared contract. You MUST parse the `[Processing]` and `[Output]` contracts to write strict assertions on behavior, state transitions, and emitted results.
    - Every `[Acceptance Criteria]` must have at least one dedicated test block (`it` or `test` function). Inject the exact text of the Acceptance Criteria as a comment directly above the assertion line to prove intent coverage.
    - Never leave `expect(true).toBe(true)` placeholders, empty stubs, or boilerplate-only tests in the final QA result.
    - If the IPO contract is missing, underspecified, or ambiguous enough that boundary cases and assertions cannot be derived confidently, do not guess the test cases. Use `update_graph_model(action="log_issue", kind="BugReport", title="Cannot generate test plan", content="The linked architecture element [ID] lacks a granular ApplicationFunction IPO contract.")` and route the gap back to `SystemArchitect` as a contract defect rather than fabricating tests. Fail the QA phase as blocked.
    - Name new tests according to the repo's existing conventions when possible, for example `*.spec.ts`, `*.test.ts`, or files under `tests/` / `__tests__/`.
    - **Example — TypeScript module (jest)**:
      1. Call `generate_test_template(sourceFile="src/utils/math.ts", testFramework="jest")`.
      2. Call `write(path="src/utils/math.spec.ts", content=<output from step 1>)`.
      3. Call `write` on `src/utils/math.spec.ts` to add `// @RequirementID: ...` and `// @ArchitectureID: ...` above the relevant test cases, replace the `expect(true).toBe(true)` stubs with boundary-driven assertions, and copy each exact Acceptance Criteria sentence into a comment immediately above the corresponding assertion block.
    - **Example — Python module (pytest)**:
      1. Call `generate_test_template(sourceFile="src/utils/math.py", testFramework="pytest")`.
      2. Call `write(path="tests/test_math.py", content=<output from step 1>)`.
      3. Call `write` on `tests/test_math.py` to add `# @RequirementID: ...` and `# @ArchitectureID: ...` above the relevant test cases, derive boundary and equivalence-class cases from the IPO contract, and copy each exact Acceptance Criteria sentence into a comment immediately above the corresponding assertion block.
    - If the repository has no usable automated test harness for the touched language and you cannot add runnable targeted tests safely, fail QA as blocked. Do not mark QA passed based only on manual reasoning, smoke checks, or a broad build.

2.  **Test Execution**:
    - Treat the identified commit ID as the review target and mention it explicitly in the test notes and final result.
    - If the handoff payload includes `recommendedTools`, you MUST prioritize those domain-specific tools for execution and environment-specific testing over generic `bash` commands whenever they can cover the required validation step.
    - Before running any command, determine whether the planned validation requires a live environment. Treat commands such as `npm run test:e2e`, `npm run test:real-contract`, requests against `127.0.0.1` or other live endpoints, Docker-dependent integration suites, or any test that expects an already-running external service as live-environment validation.
    - You MUST check the orchestrator handoff payload for `live_environment_ready: true` before running any live-environment validation command.
    - If `live_environment_ready: true` is missing or false, you MUST NOT run E2E, real-contract, network-dependent, or container-dependent test commands. In that case, restrict execution to pure local validation only, such as unit tests, mock-based tests, AST or static checks, sandboxed test harnesses, and build or compile verification that does not require an already-running external service.
    - If local-only fallback is used because `live_environment_ready: true` is absent, explicitly state in the QA notes and final report: `跳过了真实环境验证`.
    - If `live_environment_ready: true` is present, you may proceed with the narrowest live-environment command set that covers the required E2E or real-contract scope.
    - Run the narrowest targeted test command that directly exercises the touched module coverage first, including any new test files you just wrote.
    - Running only a broad command such as `npm test` is insufficient unless you also show that it executed the targeted tests covering the reviewed architecture-linked modules.
    - After targeted tests pass, use `bash` to run the narrowest additional verification commands in the repository that are still useful for regression confidence.
    - If there is no broader formal automated test suite beyond the targeted tests, run the best available build or smoke checks and say so explicitly.

3.  **Reporting**:
  - Use `update_graph_model(action="record_validation", kind="qa", status="passed|failed", commitId="<sha>", content="...")` to record QA status.
  - If the implementation is blocked by a defect, use `update_graph_model(action="log_issue", kind="BugReport", title="...", content="...")`.
  - If QA fails, identify the exact runtime task IDs impacted by the defect. Reuse existing task IDs from the reviewed implementation batch; do not invent replacement IDs for the same logical work.
  - In your QA notes and final result, explicitly name which `Requirement` IDs and `Architecture` IDs were covered by tagged automated tests and which intended IDs remain unverified.
  - In your QA notes and final result, explicitly state whether live-environment validation was executed or skipped, and why.
  - Return JSON-like prose with `status`, `reviewed_commit_id`, `commands_run`, `tests_added_or_updated`, `coverage_gaps`, `failures`, `affected_task_ids`, `recommended_rework`, and `live_environment_validation`.