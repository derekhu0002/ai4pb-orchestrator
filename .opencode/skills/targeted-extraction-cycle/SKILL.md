---
name: targeted-extraction-cycle
description: Performs deep AST-based scanning on a specific directory or file set to extract fine-grained ArchiMate elements and relationships into the Knowledge Graph.
---
# TARGETED EXTRACTION CYCLE

Use this skill to perform incremental, localized architecture recovery on an existing codebase.

## BEHAVIORAL RULES

1. **Step 1: Scope Validation**: 
   - Identify the specific target directories, files, or concepts the user wants to extract (e.g., "database models in `src/db/`", "external APIs in `src/routes/`").
   - If the scope is unclear, ask the user to clarify the target path before scanning.

2. **Step 2: Deep Targeted Scan**: 
   - You MUST use `run_reality_scanner` or `bash` (grep/find) scoped ONLY to the requested target paths. 
   - **DO NOT** use `scan_legacy_topology` as it is for global macro-scanning. You need fine-grained AST symbols (classes, interfaces, properties, methods) to extract concrete data structures and APIs.

3. **Step 3: Graph Context Resolution**:
   - Use `query_graph(mode="search", scope="architecture")` to locate the existing `ApplicationComponent` or `Node` that logically owns the target code. 
   - *Example*: If extracting billing database models, find the existing `ELM-COMP-BILLING` component. If no suitable parent component exists, explicitly create one first.

4. **Step 4: Granular ArchiMate Modeling**:
   - **Database Schemas / Entities**: Extract them using `update_graph_model(action="upsert_element", elementType="DataObject")`. Define their core fields in the `content` field.
   - **Public APIs / Routes**: Extract them using `update_graph_model(action="upsert_element", elementType="ApplicationInterface")`. Define the request/response payload in the `content` field.
   - **External/Infra Dependencies** (e.g., Redis, S3): Extract them using `update_graph_model(action="upsert_element", elementType="TechnologyService" or "Node")`.

5. **Step 5: Semantic Stitching (Anti-Island Rule)**:
   - Floating nodes are strictly prohibited. You MUST connect every newly extracted granular element to the parent `ApplicationComponent` found in Step 3.
   - For `DataObject`: The parent component MUST connect to it using an `Access` relationship (`update_graph_model(action="upsert_relationship", relationshipType="Access", sourceId="<Component>", targetId="<DataObject>")`).
   - For `ApplicationInterface`: The parent component MUST connect to it using a `Composition` or `Realization` relationship.
   - For `TechnologyService`: The parent component MUST connect to it using a `Serving` relationship (Technology serves Application).

6. **Step 6: Report Generation**:
   - Once extraction and stitching are complete, return a structured markdown summary to the user.
   - List the physical files scanned, the newly created ArchiMate Element IDs and Types, and the relationships created to bind them to the existing architecture.
   - Do NOT ask for business context review; structural extraction is treated as factual reality.