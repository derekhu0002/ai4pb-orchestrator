---
name: argo-extract
description: Run targeted architecture recovery to extract specific legacy modules, database schemas, or APIs into the ARGO Knowledge Graph without affecting the global baseline.
agent: IncrementalReverseEngineer
---

# Targeted Extraction Trigger

The user has requested to perform a deep, incremental reverse engineering on a specific part of the existing codebase.

You MUST execute the `targeted-extraction-cycle` skill immediately. Do not attempt to guess global business context or rewrite L1/L2 strategy layers. Your sole purpose is to scan the requested local paths, extract fine-grained ArchiMate nodes (e.g., DataObject, ApplicationInterface), and stitch them into the existing ApplicationComponents.