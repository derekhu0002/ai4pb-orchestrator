---
name: android-qa-debugging-loop
description: Android App 自动化测试、ADB 设备控制、Logcat 日志抓取与崩溃调试的完整操作手册。
---

# ANDROID QA DEBUGGING LOOP

Use this skill to execute automated Android tests, capture and analyze crash logs, and control device/emulator state — all via CLI without opening Android Studio.

## When to Activate

- Running QA verification on an Android module after implementation.
- Reproducing and debugging a crash or ANR reported against an Android target.
- Controlling device state (clearing data, force-stopping, launching activities) to set up or tear down test preconditions.
- Performing a quick stability check (Monkey Test) before merging.
- Extracting filtered Logcat output to attach to a gap report or issue.

---

## Phase 1: Environment Readiness

**Objective:** Confirm that the build toolchain and a target device are available before any test execution begins.

### 1.1 Verify ADB Connection

Run the following command **first**, before any other action in this skill:

```bash
adb devices -l
```

**Decision rules:**

| Output contains          | Action                                                                                                  |
|--------------------------|---------------------------------------------------------------------------------------------------------|
| At least one `device`    | Proceed to Phase 2.                                                                                     |
| `unauthorized`           | Report: "Device connected but ADB authorization pending. Approve the RSA key dialog on the device."     |
| Empty list / `offline`   | If the task requires **instrumented (UI) tests**, set task status to **Blocked** with reason: `No connected Android device or emulator found. Connect a device via USB or start an emulator before retrying.` If only **local unit tests** are needed, proceed to Phase 2, §2.1. |

### 1.2 Verify Gradle Wrapper

```bash
ls -la ./gradlew || dir gradlew
```

If `gradlew` is missing, report: "Gradle wrapper not found in project root. Run `gradle wrapper` or check the repository setup."

### 1.3 Verify SDK Environment Variable

```bash
echo $ANDROID_HOME        # macOS / Linux
echo %ANDROID_HOME%       # Windows CMD
$env:ANDROID_HOME         # PowerShell
```

If unset, warn: "`ANDROID_HOME` is not set. Gradle may fail to locate the SDK. Set it to the Android SDK root directory."

---

## Phase 2: Automated Testing Execution

### 2.1 Local Unit Tests (No Device Required)

These tests run on the host JVM. Use them for fast feedback on business logic.

**Run all debug unit tests:**

```bash
./gradlew testDebugUnitTest
```

**Run a single test class:**

```bash
./gradlew testDebugUnitTest --tests "com.example.myapp.MyClassTest"
```

**Run a single test method:**

```bash
./gradlew testDebugUnitTest --tests "com.example.myapp.MyClassTest.testSpecificMethod"
```

**Run with package filter:**

```bash
./gradlew testDebugUnitTest --tests "com.example.myapp.domain.*"
```

After execution, read the HTML report to determine pass/fail:

```bash
cat app/build/reports/tests/testDebugUnitTest/index.html | head -80
```

Or parse the XML results directly:

```bash
find app/build/test-results -name "*.xml" -exec grep -l 'failures="[^0]"' {} \;
```

**Decision rule:** If any test fails, capture the failure output and proceed to Phase 3 to collect additional context before reporting.

### 2.2 Instrumented Tests (Device Required)

These tests run on a connected device or emulator. They are mandatory for Espresso, UIAutomator, and Compose UI tests.

**Prerequisite:** Phase 1 must confirm at least one connected `device`. If not, this section is **Blocked**.

**Run all connected tests:**

```bash
./gradlew connectedAndroidTest
```

**Run a specific test class on device:**

```bash
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.myapp.ui.LoginScreenTest
```

**Run a specific test method on device:**

```bash
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.myapp.ui.LoginScreenTest#testLoginSuccess
```

After execution, read the connected test report:

```bash
cat app/build/reports/androidTests/connected/index.html | head -80
```

**Decision rule:** If any instrumented test fails, you MUST proceed to Phase 3 and capture Logcat output before reporting the failure.

### 2.3 Lint & Static Analysis (Optional Pre-check)

```bash
./gradlew lintDebug
```

Report location: `app/build/reports/lint-results-debug.html`

---

## Phase 3: Logcat & Crash Analysis

> **CRITICAL INSTRUCTION:** Never run `adb logcat` without filters. Unfiltered logcat output is massive and will overflow your context window. Always use the filtered commands below.

### 3.1 Capture Fatal Crashes (AndroidRuntime)

This is the single most important command for crash debugging:

```bash
adb logcat -d -v time -s AndroidRuntime *:E | tail -50
```

**Explanation:**
- `-d` — dump current log buffer and exit (non-blocking).
- `-v time` — include timestamps for correlation.
- `-s AndroidRuntime` — show only the AndroidRuntime tag (fatal exceptions).
- `*:E` — also include any Error-level messages.
- `tail -50` — limit output to the most recent 50 lines to stay within context bounds.

### 3.2 Filter by Application Package

First, obtain the PID of the running application:

```bash
adb shell pidof <package_name>
```

Then capture logs scoped to that PID:

```bash
adb logcat -d --pid=<PID> *:W | tail -100
```

This shows Warning-level and above logs **only** from the target application, eliminating system noise.

If the app has already crashed and the PID is gone, fall back to tag-based filtering:

```bash
adb logcat -d -v time | grep -i "<package_name>" | tail -80
```

### 3.3 Time-bounded Log Capture

To capture logs only during a test run, clear the buffer before the test and dump after:

```bash
# Before test
adb logcat -c

# Run the test
./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.myapp.ui.MyTest

# After test — capture everything from the cleared buffer
adb logcat -d -v time *:W | tail -200
```

### 3.4 ANR Detection

```bash
adb logcat -d -v time -s ActivityManager:E | grep -i "ANR" | tail -20
```

Also check for ANR trace files on device:

```bash
adb shell ls /data/anr/
adb pull /data/anr/traces.txt ./traces_anr.txt
head -100 ./traces_anr.txt
```

### 3.5 Mandatory Crash Attachment Rule

**CONTRACT:** When any test in Phase 2 fails, you MUST:

1. Run the crash capture command from §3.1.
2. Run the package-filtered capture from §3.2 (if package name is known).
3. Include the captured output verbatim (trimmed to ≤50 lines) in the test failure report.
4. If the log contains a Java/Kotlin stack trace, extract the **root cause line** (the `Caused by:` closest to the bottom) and highlight it separately.

---

## Phase 4: App State & Device Control

Use these commands to set up preconditions, reproduce bugs, and reset state between test runs.

### 4.1 Clear Application Data (Full Reset)

```bash
adb shell pm clear <package_name>
```

This wipes all SharedPreferences, databases, caches, and login state. Use it to simulate a fresh install.

### 4.2 Launch a Specific Activity

```bash
adb shell am start -n <package_name>/<fully_qualified_activity>
```

Example:

```bash
adb shell am start -n com.example.myapp/.ui.MainActivity
```

To launch with an Intent extra:

```bash
adb shell am start -n com.example.myapp/.ui.DetailActivity --es "item_id" "42"
```

### 4.3 Force-Stop Application

```bash
adb shell am force-stop <package_name>
```

Use this to ensure no background processes interfere with the next test run.

### 4.4 Simulate Network Conditions

**Disable Wi-Fi (requires root or emulator):**

```bash
adb shell svc wifi disable
```

**Re-enable Wi-Fi:**

```bash
adb shell svc wifi enable
```

**Disable mobile data:**

```bash
adb shell svc data disable
```

**Simulate airplane mode (full offline):**

```bash
adb shell settings put global airplane_mode_on 1
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

**Restore from airplane mode:**

```bash
adb shell settings put global airplane_mode_on 0
adb shell am broadcast -a android.intent.action.AIRPLANE_MODE
```

> **NOTE:** After network manipulation, always restore the original state. Leaving a device offline will break subsequent connected tests.

### 4.5 Stress / Monkey Test

Use the Android Monkey to send pseudo-random UI events and detect easy-to-trigger crashes:

```bash
adb shell monkey -p <package_name> --throttle 150 -v 1000
```

**Parameters:**
- `-p <package_name>` — restrict events to the target app.
- `--throttle 150` — 150ms delay between events (prevents overwhelming the app).
- `-v 1000` — send 1000 events.

**Decision rule:** If Monkey reports a crash (`CRASH:` in output), immediately run Phase 3 crash capture and include the crash stack in the report.

For a longer soak test:

```bash
adb shell monkey -p <package_name> --throttle 200 --ignore-crashes --ignore-timeouts -v 5000 2>&1 | tail -50
```

### 4.6 Take a Screenshot (For Visual Evidence)

```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png ./screenshot_evidence.png
```

### 4.7 Install / Uninstall APK

```bash
# Install
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Uninstall
adb uninstall <package_name>
```

---

## Phase 5: Output Report Format

When `@QualityAssurance` completes an Android QA cycle, the report MUST conform to the following structure:

```
## Android QA Report

### Device Status
- Connected: {yes | no | blocked}
- Device: {device model from `adb devices -l`}
- API Level: {output of `adb shell getprop ro.build.version.sdk`}

### Test Execution Summary
| Test Suite             | Command                              | Result     | Duration |
|------------------------|--------------------------------------|------------|----------|
| Unit Tests (debug)     | `./gradlew testDebugUnitTest`        | PASS/FAIL  | Xs       |
| Instrumented Tests     | `./gradlew connectedAndroidTest`     | PASS/FAIL  | Xs       |
| Monkey Stress (1000)   | `adb shell monkey -p ... -v 1000`    | PASS/CRASH | Xs       |

### Architecture Coverage
- Tested Modules: {list of ArchitectureID values covered by the test run}
- Untested Modules: {list of ArchitectureID values NOT covered}

### Failures & Crash Logs
> Only present if any test failed.

**Test:** `com.example.myapp.ui.LoginScreenTest#testLoginSuccess`
**Root Cause:**
```
java.lang.NullPointerException: Attempt to invoke virtual method '...' on a null object reference
    at com.example.myapp.ui.LoginViewModel.login(LoginViewModel.kt:42)
```
**Filtered Logcat (last 30 lines):**
```
{output of adb logcat -d -v time -s AndroidRuntime *:E | tail -30}
```

### Recommended Actions
- {Concise next step, e.g., "Fix null check in LoginViewModel.login() at line 42."}
- {Or "Escalate to @Implementation with ArchitectureID: id-app-login-flow."}
```

### Report Delivery Rules

1. **All fields are mandatory.** If a section has no data (e.g., no failures), write "None" — do not omit the section.
2. **Crash logs must be included verbatim**, trimmed to ≤50 lines. Do not paraphrase stack traces.
3. **ArchitectureID references** must match identifiers from the Shared Knowledge Graph. Use `query_graph(mode="search", scope="architecture")` to resolve them if uncertain.
4. **Device info** must come from actual `adb` output, not from assumptions.

---

## Quick Reference: Command Cheat Sheet

| Purpose                        | Command                                                                 |
|--------------------------------|-------------------------------------------------------------------------|
| Check connected devices        | `adb devices -l`                                                        |
| Run unit tests                 | `./gradlew testDebugUnitTest`                                           |
| Run single test class          | `./gradlew testDebugUnitTest --tests "com.example.MyTest"`              |
| Run instrumented tests         | `./gradlew connectedAndroidTest`                                        |
| Capture fatal crashes          | `adb logcat -d -v time -s AndroidRuntime *:E \| tail -50`              |
| Filter logs by PID             | `adb logcat -d --pid=$(adb shell pidof <pkg>) *:W \| tail -100`        |
| Clear app data                 | `adb shell pm clear <package_name>`                                     |
| Launch activity                | `adb shell am start -n <pkg>/.MainActivity`                            |
| Force-stop app                 | `adb shell am force-stop <package_name>`                                |
| Monkey stress test             | `adb shell monkey -p <package_name> --throttle 150 -v 1000`            |
| Airplane mode ON               | `adb shell settings put global airplane_mode_on 1`                     |
| Airplane mode OFF              | `adb shell settings put global airplane_mode_on 0`                     |
| Screenshot                     | `adb shell screencap -p /sdcard/screenshot.png && adb pull /sdcard/screenshot.png .` |
| Check ANR traces               | `adb pull /data/anr/traces.txt ./traces_anr.txt`                       |
