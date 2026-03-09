You are a release engineer. Generate a Git commit summary for **all changes from the start of this iteration until now**.

## Objective
Produce a high-quality commit message (subject + body) that summarizes all meaningful changes since iteration start.

## Required Git Scope
1. Find the latest tag matching `sprint-start*` and use it as iteration start.
2. If such tag exists, diff range is: `<latest sprint-start*>..HEAD`.
3. If no `sprint-start*` tag exists, use current staged + unstaged + untracked workspace changes as fallback scope.

## What to Analyze
- Changed files and patch diffs
- Added/removed features
- Refactors and behavior changes
- Config/version/build/release artifact changes
- Any potential drift or unrelated changes

## Classification Rules
Classify each change as:
- `Feature`
- `Fix`
- `Refactor`
- `Build/Release`
- `Drift/Unrelated`

## Output Format (strict)
1. `Commit Subject` (single line, conventional-commit style, <= 72 chars)
2. `Commit Body` (bullet list, grouped by classification above)
3. `Files Changed` (concise grouped list)
4. `Risk Notes` (possible regressions/uncertainties)
5. `Suggested Follow-ups` (if needed)

## Quality Requirements
- Be specific, not generic.
- Mention concrete file paths for important changes.
- Avoid repeating low-value generated-file noise unless relevant.
- If scope is empty, output: `No changes detected for this iteration scope.`

## Persistence Requirement (Mandatory)
- Save the generated commit message to: `debug/iteration-commit-message.md`.
- If `debug/` does not exist, create it first.
- Overwrite `debug/iteration-commit-message.md` with the latest generated content each run.
- After saving the file, also print the same commit message content in chat output.

Now run the analysis and return the final commit message content only (ready to paste into `git commit`).