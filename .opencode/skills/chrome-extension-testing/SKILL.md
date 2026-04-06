---
name: chrome-extension-testing
description: Execution rules for Chrome extension implementation and QA work inside the OpenCode runtime.
---

# CHROME EXTENSION TESTING

Use this skill whenever the handoff payload or `run_reality_scanner` recommends `chrome-extension-testing`.

## CORE RULES
- Do not assume a plain Node process provides browser extension APIs. Chrome extension code that touches `chrome.*` must run in a controlled sandbox with a mocked global object.
- Before running any Chrome-extension-specific test or verification script, you MUST use `run_chrome_sandbox` instead of a generic `bash` command such as `node some-test.js`.
- Treat `run_chrome_sandbox` as the default execution path for background scripts, service workers, messaging helpers, storage adapters, and other modules that depend on `chrome.*`.
- If a tested module needs more API surface than the default sandbox provides, extend the mock inside the test script in a narrow, explicit way rather than bypassing the sandbox.

## MOCKING GUIDANCE
- Expect `globalThis.chrome` to be present when the sandbox starts.
- Use the mocked namespaces for deterministic tests: `chrome.runtime`, `chrome.storage.local`, `chrome.storage.sync`, `chrome.tabs`, `chrome.scripting`, `chrome.alarms`, and `chrome.action`.
- Prefer assertions against observable behavior such as stored values, sent messages, created tabs, or function outputs. Do not rely on a real browser process.
- If the production code branches on environment variables, use the sandbox-provided values `AI4PB_TEST_ENV=chrome-extension` and `AI4PB_CHROME_SANDBOX=1`.

## EXECUTION CONTRACT
- `run_chrome_sandbox` accepts `testScriptFile` and launches the script in Node with the Chrome mock preloaded.
- Test scripts should be Node-executable files and should fail by setting a non-zero exit code or throwing an error.
- Keep sandbox test scripts narrow and deterministic so QA can connect failures back to a specific runtime task or touched module.