# Changelog

## 0.0.7

### Improvements
- Enhanced audit prompt (`reverse-engineer-WHOLE.md`) with strict browser-location requirements for all view-level recommendations
- Added browser_path field specification to VIEW actions (ADD, MODIFY, SPLIT, MERGE) to improve traceability
- Comprehensive architecture audit infrastructure with 5-part report structure (traceability, business gaps, README sync, strategy compliance, KG reorganization)

### Fixes
- Improved prompt consistency across all copilot orchestration artifacts
- Enhanced README documentation for clarity on command matrix and artifact paths

---

## 0.0.6

### Features
- Guided workflow orchestration with 5-step automation (refresh → precheck → iterate → align → wrap-up)
- Architecture context validation and refresh commands
- Webview-based workflow status board in sidebar
- Configuration management via .aicodingconfig for browserPath and maintenance modes

### Improvements
- Extended prompt artifacts for task-support and weekly reporting scenarios
- Enhanced EA extraction pipeline integration with project_auto_gen scripts

---

## 0.0.5

### Features
- Release VSIX toolchain with automated version bumping and marketplace README swap
- Post-tools utilities for JSON comparison and PDF merging
- Release info metadata generation for every build

### Improvements
- Streamlined release workflow via PowerShell script automation

---

## 0.0.4

### Features
- Extended command palette with initialize, refresh, iteration, alignment, wrap-up, and next-action commands
- Activity bar integration with custom AI4PB icon
- Webview provider for workflow visualization

### Improvements
- Enhanced extension activation events for startup initialization
- Improved configuration handling for guided workflow modes

---

## 0.0.3

### Features
- JSON extraction pipeline from EA models via JScript automation
- Support for ArchiMate 3.1 model schema parsing
- Element and relationship inventory extraction

### Improvements
- Better error handling in architecture context loading
- Enhanced schema validation for KG JSON format

---

## 0.0.2

### Features
- Initial prompt artifact library (initial-prompt.md, wrap-up-prompt.md, reverse-engineer-WHOLE.md)
- Task-list and task-support prompt templates
- Weekly report prompt for progress summarization

### Improvements
- Documentation structure for prompt governance
- Script templates for EA automation

---

## 0.0.1

- Initial MVP scaffold
- Added orchestration commands for refresh, iteration start, alignment, wrap-up, and next action
- Basic webview and sidebar integration
