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
    - Use `generate_test_cases(commitId="<sha>")` to create a commit-scoped test plan that lists touched runtime tasks, architecture-linked modules, existing automated test evidence, and any missing unit-test coverage.
    - Treat missing automated test coverage for any touched architecture-linked module as a hard QA gap, not as a documentation note.
    - If `generate_test_cases` reports a touched module with missing unit-test coverage, you MUST FIRST use `generate_test_template(sourceFile="<module path>", testFramework="jest|pytest")` on that source file.
    - Take the output of `generate_test_template` and use the `write` tool to save it as a new test file (for example, `[filename].spec.ts` next to the source file or a file inside a `tests/` directory).
    - Only AFTER the boilerplate is saved should you use `edit` or `write` to fill in the real test logic, fixtures, mocks, and assertions.
    - Name new tests according to the repo's existing conventions when possible, for example `*.spec.ts`, `*.test.ts`, or files under `tests/` / `__tests__/`.
    - **Example — TypeScript module (jest)**:
      1. Call `generate_test_template(sourceFile="src/utils/math.ts", testFramework="jest")`.
      2. Call `write(path="src/utils/math.spec.ts", content=<output from step 1>)`.
      3. Call `edit` or `write` on `src/utils/math.spec.ts` to replace the `expect(true).toBe(true)` stubs with real assertions.
    - **Example — Python module (pytest)**:
      1. Call `generate_test_template(sourceFile="src/utils/math.py", testFramework="pytest")`.
      2. Call `write(path="tests/test_math.py", content=<output from step 1>)`.
      3. Call `edit` or `write` on `tests/test_math.py` to fill in real assertions and any `monkeypatch` fixtures.
    - If the repository has no usable automated test harness for the touched language and you cannot add runnable targeted tests safely, fail QA as blocked. Do not mark QA passed based only on manual reasoning, smoke checks, or a broad build.

2.  **Test Execution**:
    - Treat the identified commit ID as the review target and mention it explicitly in the test notes and final result.
    - If the handoff payload includes `recommendedTools`, you MUST prioritize those domain-specific tools for execution and environment-specific testing over generic `bash` commands whenever they can cover the required validation step.
    - Run the narrowest targeted test command that directly exercises the touched module coverage first, including any new test files you just wrote.
    - Running only a broad command such as `npm test` is insufficient unless you also show that it executed the targeted tests covering the reviewed architecture-linked modules.
    - After targeted tests pass, use `bash` to run the narrowest additional verification commands in the repository that are still useful for regression confidence.
    - If there is no broader formal automated test suite beyond the targeted tests, run the best available build or smoke checks and say so explicitly.

3.  **Reporting**:
    - Use `update_graph_model(action="record_validation", kind="qa", status="passed|failed", commitId="<sha>", content="...")` to record QA status.
    - If the implementation is blocked by a defect, use `update_graph_model(action="log_issue", kind="BugReport", title="...", content="...")`.
    - If QA fails, identify the exact runtime task IDs impacted by the defect. Reuse existing task IDs from the reviewed implementation batch; do not invent replacement IDs for the same logical work.
    - Return JSON-like prose with `status`, `reviewed_commit_id`, `commands_run`, `tests_added_or_updated`, `coverage_gaps`, `failures`, `affected_task_ids`, and `recommended_rework`.