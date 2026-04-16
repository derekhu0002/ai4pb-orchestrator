!INC Local Scripts.EAConstants-JScript
!INC JSON-Parser

/*
 * Script Name: Export ArchiMate 3.1 Knowledge Graph
 * Purpose: Export an EA package back into the strict ArchiMate 3.1 Exchange Model JSON format
 *          used by the ai4pb Shared Knowledge Graph.
 * Strategy: MERGE-BASED round-trip.
 *   1. Read the existing JSON file as a baseline (if it exists).
 *   2. Build lookup maps of what is currently in EA.
 *   3. Patch only the fields that changed; preserve everything else byte-for-byte.
 *   4. New EA elements/relationships are appended; deleted ones are removed.
 * This minimises diff noise so that only real human edits are visible.
 *
 * Usage:
 *   1. Select the target ArchiMate import package in EA Project Browser.
 *   2. Adjust KG_JSON_RELATIVE_PATH if needed.
 *   3. Run the script.
 */

var KG_JSON_RELATIVE_PATH = '.opencode\\temp\\SharedKnowledgeGraph.archimate3.1.json';
var KG_JSON_PATH = '';

function main() {
  Repository.EnsureOutputVisible('Script');

  try {
    Session.Output('Starting ArchiMate 3.1 knowledge graph export (merge mode)...');

    var pkg = Repository.GetTreeSelectedPackage();
    if (pkg == null) {
      fail('Please select a Package in the Project Browser before running this script.');
      return;
    }

    KG_JSON_PATH = resolveKnowledgeGraphPathFromCurrentModel();
    if (KG_JSON_PATH == '') {
      fail('Could not resolve the knowledge graph path from the current EA model location.');
      return;
    }

    Session.Output('Target output path: ' + KG_JSON_PATH);

    // --- Step 1: load existing baseline (may be absent on first export) ---
    var baseline = loadBaseline(KG_JSON_PATH);

    // --- Step 2: collect current EA state ---
    var elementGuidMap = {};
    var eaElements = collectElements(pkg, elementGuidMap);
    var eaRelationships = collectRelationships(pkg, elementGuidMap);

    // --- Step 3: merge ---
    var graph = mergeGraph(baseline, pkg, eaElements, eaRelationships);

    // --- Step 4: write ---
    var jsonString = JSON.stringify(graph, null, 2);
    writeUtf8File(KG_JSON_PATH, jsonString);

    Session.Output('Export complete.');
    Session.Output('Elements exported: ' + graph.elements.element.length);
    Session.Output('Relationships exported: ' + graph.relationships.relationship.length);
    Session.Output('Written to: ' + KG_JSON_PATH);
  } catch (e) {
    fail('Export failed: ' + errorMessage(e));
  }
}

// ===========================================================================
// Baseline loading
// ===========================================================================

function loadBaseline(filePath) {
  var jsonString = readUtf8File(filePath);
  if (jsonString === '') {
    return null;
  }
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    Session.Output('WARNING: Could not parse baseline JSON; starting from scratch. ' + errorMessage(e));
    return null;
  }
}

// ===========================================================================
// EA state collection (no JSON assembly yet, just raw data maps)
// ===========================================================================

function collectElements(pkg, elementGuidMap) {
  var result = [];
  var elements = pkg.Elements;
  for (var i = 0; i < elements.Count; i++) {
    var el = elements.GetAt(i);
    if (el == null) { continue; }

    var identifier = getTagValue(el, 'kg_identifier') || el.ElementGUID;
    elementGuidMap[el.ElementGUID] = identifier;
    elementGuidMap[el.ElementID] = identifier;

    var doc = getTagValue(el, 'kg_documentation') || extractDocFromNotes(el.Notes);
    result.push({
      identifier: identifier,
      eaElement: el,
      type: resolveArchimateElementType(el),
      name: safeString(el.Name),
      documentation: doc !== '' ? doc : '(no documentation)',
      extensions: resolveExtensions(el),
      properties: extractProperties(el)
    });
  }
  return result;
}

function collectRelationships(pkg, elementGuidMap) {
  var result = [];
  var elements = pkg.Elements;
  var processedConnectors = {};

  for (var i = 0; i < elements.Count; i++) {
    var el = elements.GetAt(i);
    if (el == null) { continue; }

    var connectors = el.Connectors;
    for (var j = 0; j < connectors.Count; j++) {
      var conn = connectors.GetAt(j);
      if (conn == null) { continue; }
      if (processedConnectors[conn.ConnectorID]) { continue; }
      processedConnectors[conn.ConnectorID] = true;

      var sourceId = elementGuidMap[conn.ClientID];
      var targetId = elementGuidMap[conn.SupplierID];
      if (!sourceId || !targetId) { continue; }

      // Reload connector from Repository to ensure TaggedValues and StereotypeEx
      // are fully populated. Connectors obtained via Element.Connectors may have
      // incomplete property collections in some EA versions.
      var fullConn = Repository.GetConnectorByID(conn.ConnectorID);

      var identifier = getTagValue(fullConn, 'kg_identifier') || safeString(fullConn.Alias) || fullConn.ConnectorGUID;
      var connDoc = getTagValue(fullConn, 'kg_documentation') || extractDocFromNotes(fullConn.Notes);
      var data = {
        identifier: identifier,
        type: resolveArchimateRelationshipType(fullConn),
        source: sourceId,
        target: targetId,
        name: safeString(fullConn.Name),
        documentation: connDoc !== '' ? connDoc : '(no documentation)',
        extensions: resolveConnectorExtensions(fullConn),
        properties: extractConnectorProperties(fullConn)
      };

      var accessType = getTagValue(fullConn, 'accessType');
      if (accessType != '') { data.accessType = accessType; }
      var modifier = getTagValue(fullConn, 'modifier');
      if (modifier != '') { data.modifier = modifier; }
      var isDirected = getTagValue(fullConn, 'isDirected');
      if (isDirected != '') { data.isDirected = (isDirected === 'true'); }

      result.push(data);
    }
  }
  return result;
}

// ===========================================================================
// Merge logic
// ===========================================================================

function mergeGraph(baseline, pkg, eaElements, eaRelationships) {
  // If no baseline, build from scratch
  if (baseline == null) {
    return buildFreshGraph(pkg, eaElements, eaRelationships);
  }

  // Preserve every root-level field from the baseline
  var graph = shallowCopy(baseline);

  // Ensure graph-level documentation is never empty
  if (!graph.documentation || graph.documentation.length === 0) {
    graph.documentation = [{ 'value': '(no documentation)', 'lang': 'en' }];
  }

  // --- Merge elements ---
  // Walk BASELINE order first to preserve the original sequence in JSON output.
  // Then append any new EA elements that don't exist in the baseline.
  var baseElementMap = buildBaselineElementMap(baseline);
  var eaElementMap = {};
  for (var i = 0; i < eaElements.length; i++) {
    eaElementMap[eaElements[i].identifier] = eaElements[i];
  }

  var mergedElements = [];
  var mergedElementIds = {};

  // 1) Walk baseline order – patch or keep each existing entry
  var baseElems = (baseline.elements && baseline.elements.element) || [];
  for (var bi = 0; bi < baseElems.length; bi++) {
    var baseEl = baseElems[bi];
    if (!baseEl || !baseEl.identifier) { continue; }
    var eaMatch = eaElementMap[baseEl.identifier];
    if (eaMatch) {
      mergedElements.push(patchElement(baseEl, eaMatch));
      mergedElementIds[baseEl.identifier] = true;
    }
    // Element removed in EA – omit from output
  }

  // 2) Append new EA elements (not in baseline) at the end
  for (var ni = 0; ni < eaElements.length; ni++) {
    var newEa = eaElements[ni];
    if (!mergedElementIds[newEa.identifier]) {
      mergedElements.push(buildNewElement(newEa));
      mergedElementIds[newEa.identifier] = true;
      Session.Output('NEW element from EA: ' + newEa.name + ' (' + newEa.identifier + ')');
    }
  }

  graph.elements = { element: mergedElements };

  // --- Merge relationships ---
  // Same strategy: baseline order first, then new EA relationships appended.
  var baseRelMap = buildBaselineRelationshipMap(baseline);
  var eaRelMap = {};
  for (var ri = 0; ri < eaRelationships.length; ri++) {
    eaRelMap[eaRelationships[ri].identifier] = eaRelationships[ri];
  }

  var mergedRels = [];
  var mergedRelIds = {};

  // 1) Walk baseline relationship order
  var baseRels = (baseline.relationships && baseline.relationships.relationship) || [];
  for (var bri = 0; bri < baseRels.length; bri++) {
    var baseRel = baseRels[bri];
    if (!baseRel || !baseRel.identifier) { continue; }
    var eaRelMatch = eaRelMap[baseRel.identifier];
    if (eaRelMatch) {
      mergedRels.push(patchRelationship(baseRel, eaRelMatch));
      mergedRelIds[baseRel.identifier] = true;
    }
    // Relationship removed in EA – omit from output
  }

  // 2) Append new EA relationships at the end
  for (var nri = 0; nri < eaRelationships.length; nri++) {
    var newEaR = eaRelationships[nri];
    if (!mergedRelIds[newEaR.identifier]) {
      mergedRels.push(buildNewRelationship(newEaR));
      mergedRelIds[newEaR.identifier] = true;
      Session.Output('NEW relationship from EA: ' + newEaR.identifier);
    }
  }

  graph.relationships = { relationship: mergedRels };

  return graph;
}

function buildBaselineElementMap(baseline) {
  var map = {};
  if (baseline && baseline.elements && baseline.elements.element) {
    for (var i = 0; i < baseline.elements.element.length; i++) {
      var el = baseline.elements.element[i];
      if (el && el.identifier) {
        map[el.identifier] = el;
      }
    }
  }
  return map;
}

function buildBaselineRelationshipMap(baseline) {
  var map = {};
  if (baseline && baseline.relationships && baseline.relationships.relationship) {
    for (var i = 0; i < baseline.relationships.relationship.length; i++) {
      var rel = baseline.relationships.relationship[i];
      if (rel && rel.identifier) {
        map[rel.identifier] = rel;
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Patch helpers – only overwrite fields that actually differ
// ---------------------------------------------------------------------------

function patchElement(base, ea) {
  // Start with a shallow copy of the baseline to keep field order and extra keys
  var out = shallowCopy(base);

  // identifier and type – keep baseline unless EA changed
  out.type = ea.type;

  // name – only patch if EA changed
  if (firstLangValue(base.name, '') !== ea.name) {
    out.name = makeLangArray(ea.name !== '' ? ea.name : '(unnamed)', base.name);
  }

  // documentation – only patch if EA changed (ignore truncation artifacts)
  var basDoc = firstLangValue(base.documentation, '');
  if (!isDocTruncationMatch(ea.documentation, basDoc)) {
    if (ea.documentation !== basDoc) {
      out.documentation = ea.documentation !== '' ? makeLangArray(ea.documentation, base.documentation) : [{ 'value': '(no documentation)', 'lang': 'en' }];
    }
  }

  // Ensure documentation and name are never empty
  if (!out.documentation || out.documentation.length === 0) {
    out.documentation = [{ 'value': '(no documentation)', 'lang': 'en' }];
  }
  if (!out.name || out.name.length === 0 || !out.name[0] || out.name[0].value === '') {
    out.name = [{ 'value': '(unnamed)', 'lang': 'en' }];
  }

  // extensions – only patch if EA explicitly provided a value (non-null)
  if (ea.extensions !== null) {
    if (JSON.stringify(ea.extensions) !== JSON.stringify(base.extensions || {})) {
      out.extensions = ea.extensions;
    }
  }
  // else: keep baseline extensions untouched

  // properties – only patch if EA has content; never inject empty properties
  if (ea.properties !== null) {
    if (propertiesChanged(base.properties, ea.properties)) {
      out.properties = ea.properties;
    }
  } else if (!base.properties) {
    // Neither baseline nor EA has properties – ensure we don't carry over undefined
    delete out.properties;
  }

  return out;
}

function patchRelationship(base, ea) {
  var out = shallowCopy(base);

  // Type – preserve baseline when EA type is just a lossy reverse-mapping.
  // Multiple ArchiMate types map to the same EA connector type (e.g.
  // Serving/Assignment/Aggregation → Association). The export's fallback
  // picks only one generic type, losing specificity.
  if (!isLossyTypeFallback(base.type, ea.type)) {
    out.type = ea.type;
  }
  out.source = ea.source;
  out.target = ea.target;

  if (firstLangValue(base.name, '') !== ea.name) {
    out.name = makeLangArray(ea.name !== '' ? ea.name : '(unnamed)', base.name);
  }

  var basDoc = firstLangValue(base.documentation, '');
  if (!isDocTruncationMatch(ea.documentation, basDoc)) {
    if (ea.documentation !== basDoc) {
      out.documentation = ea.documentation !== '' ? makeLangArray(ea.documentation, base.documentation) : [{ 'value': '(no documentation)', 'lang': 'en' }];
    }
  }

  // Ensure documentation and name are never empty
  if (!out.documentation || out.documentation.length === 0) {
    out.documentation = [{ 'value': '(no documentation)', 'lang': 'en' }];
  }
  if (!out.name || out.name.length === 0 || !out.name[0] || out.name[0].value === '') {
    out.name = [{ 'value': '(unnamed)', 'lang': 'en' }];
  }

  if (ea.extensions !== null) {
    if (JSON.stringify(ea.extensions) !== JSON.stringify(base.extensions || {})) {
      out.extensions = ea.extensions;
    }
  }

  if (ea.properties !== null) {
    if (propertiesChanged(base.properties, ea.properties)) {
      out.properties = ea.properties;
    }
  } else if (!base.properties) {
    delete out.properties;
  }

  // Optional metadata
  if (ea.accessType) { out.accessType = ea.accessType; }
  if (ea.modifier) { out.modifier = ea.modifier; }
  if (typeof ea.isDirected !== 'undefined') { out.isDirected = ea.isDirected; }

  return out;
}

function propertiesChanged(baseProp, eaProp) {
  var baseJson = isEmptyProperties(baseProp) ? '' : JSON.stringify(baseProp);
  var eaJson = isEmptyProperties(eaProp) ? '' : JSON.stringify(eaProp);
  return baseJson !== eaJson;
}

function isEmptyProperties(prop) {
  if (!prop) { return true; }
  if (!prop.property) { return true; }
  if (prop.property.length === 0) { return true; }
  return false;
}

// Detect when EA's kg_documentation tag was truncated and still matches the baseline.
// The import truncates at 252 chars + '...' (255 total). If eaDoc ends with '...'
// and the baseline starts with the same prefix, the difference is truncation only.
function isDocTruncationMatch(eaDoc, baselineDoc) {
  if (eaDoc === '' || baselineDoc === '') { return false; }
  if (eaDoc === baselineDoc) { return true; }
  if (eaDoc.length >= 255 && eaDoc.substring(eaDoc.length - 3) === '...') {
    var prefix = eaDoc.substring(0, eaDoc.length - 3);
    if (baselineDoc.substring(0, prefix.length) === prefix) {
      return true;
    }
  }
  return false;
}

// Build a lang-string array, preserving the lang tag from baseline if available
function makeLangArray(value, baselineLangArray) {
  var lang = 'en';
  if (baselineLangArray && baselineLangArray.length && baselineLangArray[0] && baselineLangArray[0].lang) {
    lang = baselineLangArray[0].lang;
  }
  return [{ 'value': value, 'lang': lang }];
}

// ---------------------------------------------------------------------------
// Brand-new element / relationship builders (for items created in EA)
// ---------------------------------------------------------------------------

function buildNewElement(ea) {
  var el = {
    identifier: ea.identifier,
    type: ea.type,
    name: [{ 'value': ea.name !== '' ? ea.name : '(unnamed)', 'lang': 'en' }],
    documentation: ea.documentation !== '' ? [{ 'value': ea.documentation, 'lang': 'en' }] : [{ 'value': '(no documentation)', 'lang': 'en' }],
    extensions: ea.extensions || { ai4pb: { managedBy: 'human-architect' } }
  };
  if (ea.properties !== null) { el.properties = ea.properties; }
  return el;
}

function buildNewRelationship(ea) {
  var rel = {
    identifier: ea.identifier,
    type: ea.type,
    source: ea.source,
    target: ea.target,
    name: [{ 'value': ea.name !== '' ? ea.name : '(unnamed)', 'lang': 'en' }],
    documentation: ea.documentation !== '' ? [{ 'value': ea.documentation, 'lang': 'en' }] : [{ 'value': '(no documentation)', 'lang': 'en' }],
    extensions: ea.extensions || { ai4pb: { managedBy: 'human-architect' } }
  };
  if (ea.properties !== null) { rel.properties = ea.properties; }
  if (ea.accessType) { rel.accessType = ea.accessType; }
  if (ea.modifier) { rel.modifier = ea.modifier; }
  if (typeof ea.isDirected !== 'undefined') { rel.isDirected = ea.isDirected; }
  return rel;
}

// Fallback: no baseline available at all
function buildFreshGraph(pkg, eaElements, eaRelationships) {
  var pkgName = safeString(pkg.Name).replace(/ Import.*$/, '');
  var graph = {
    identifier: getTagValue(pkg.Element, 'kg_identifier') || ('pkg-' + pkg.PackageGUID),
    name: [{ 'value': pkgName !== '' ? pkgName : '(unnamed)', 'lang': 'en' }],
    documentation: [{ 'value': '(no documentation)', 'lang': 'en' }],
    metadata: {
      schema: 'https://www.opengroup.org/xsd/archimate/3.1/',
      schemaversion: '3.1'
    },
    elements: { element: [] },
    relationships: { relationship: [] },
    propertyDefinitions: { propertyDefinition: [] },
    version: ''
  };

  for (var i = 0; i < eaElements.length; i++) {
    graph.elements.element.push(buildNewElement(eaElements[i]));
  }
  for (var j = 0; j < eaRelationships.length; j++) {
    graph.relationships.relationship.push(buildNewRelationship(eaRelationships[j]));
  }
  return graph;
}

// ===========================================================================
// Type resolution helpers
// ===========================================================================

function resolveArchimateElementType(element) {
  var tagType = getTagValue(element, 'kg_type');
  if (tagType != '') { return tagType; }
  var stereotype = safeString(element.StereotypeEx);
  var mapped = mapEaStereotypeToArchimateType(stereotype);
  if (mapped != '') { return mapped; }
  return safeString(element.Type);
}

function resolveArchimateRelationshipType(connector) {
  var tagType = getTagValue(connector, 'kg_type');
  if (tagType != '') { return tagType; }
  var stereotype = safeString(connector.StereotypeEx);
  var mapped = mapEaStereotypeToArchimateType(stereotype);
  if (mapped != '') { return mapped; }
  return mapEaConnectorTypeToArchimate(safeString(connector.Type));
}

function mapEaStereotypeToArchimateType(stereotype) {
  var prefix = 'ArchiMate_';
  if (stereotype.length > prefix.length && stereotype.substring(0, prefix.length) === prefix) {
    return stereotype.substring(prefix.length);
  }
  return '';
}

function mapEaConnectorTypeToArchimate(connectorType) {
  switch (connectorType) {
    case 'ControlFlow': return 'Flow';
    case 'Dependency':  return 'Realization';
    case 'Generalization': return 'Specialization';
    case 'Association': return 'Association';
    default: return connectorType;
  }
}

// Check whether eaType is a lossy fallback for baselineType.
// Returns true when both ArchiMate types map to the same EA connector type
// but the names differ (i.e. the export just picked the wrong one).
function isLossyTypeFallback(baselineType, eaType) {
  if (baselineType === eaType) { return false; }
  return archimateTypeToEaConnectorType(baselineType) === archimateTypeToEaConnectorType(eaType);
}

// Mirror of import's mapRelationshipTypeToEa – maps ArchiMate relationship
// type to the EA connector type that the import script creates.
function archimateTypeToEaConnectorType(archimateType) {
  switch (archimateType) {
    case 'Flow':
    case 'Triggering':
    case 'Influence':
      return 'ControlFlow';
    case 'Realization':
    case 'Access':
      return 'Dependency';
    case 'Aggregation':
    case 'Composition':
    case 'Assignment':
    case 'Serving':
    case 'Association':
      return 'Association';
    case 'Specialization':
      return 'Generalization';
    default:
      return archimateType;
  }
}

// ===========================================================================
// Extensions handling
// ===========================================================================

function resolveExtensions(element) {
  var extensionsJson = getTagValue(element, 'extensions_json');
  if (extensionsJson != '') {
    try { return JSON.parse(extensionsJson); } catch (e) {
      Session.Output('WARNING: Could not parse extensions_json for ' + element.Name + ': ' + errorMessage(e));
    }
  }
  // Return null so the merge phase can preserve the baseline value.
  // Only brand-new elements (no baseline) get the default in buildNewElement().
  return null;
}

function resolveConnectorExtensions(connector) {
  var extensionsJson = getTagValue(connector, 'extensions_json');
  if (extensionsJson != '') {
    try { return JSON.parse(extensionsJson); } catch (e) {
      Session.Output('WARNING: Could not parse extensions_json for connector ' + connector.ConnectorGUID + ': ' + errorMessage(e));
    }
  }
  return null;
}

// ===========================================================================
// Property extraction
// ===========================================================================

function extractProperties(element) {
  var props = [];
  var tags = element.TaggedValues;
  for (var i = 0; i < tags.Count; i++) {
    var tag = tags.GetAt(i);
    if (tag == null) { continue; }
    var name = safeString(tag.Name);
    if (name === 'kg_identifier' || name === 'kg_type' || name === 'kg_documentation' || name === 'extensions_json') { continue; }
    if (name.substring(0, 5) !== 'prop_') { continue; }
    props.push({
      propertyDefinitionRef: name.substring(5),
      value: [{ 'value': safeString(tag.Value), 'lang': 'en' }]
    });
  }
  return props.length > 0 ? { property: props } : null;
}

function extractConnectorProperties(connector) {
  var props = [];
  var tags = connector.TaggedValues;
  for (var i = 0; i < tags.Count; i++) {
    var tag = tags.GetAt(i);
    if (tag == null) { continue; }
    var name = safeString(tag.Name);
    if (name === 'kg_identifier' || name === 'kg_type' || name === 'kg_source' ||
        name === 'kg_target' || name === 'kg_documentation' || name === 'extensions_json' ||
        name === 'accessType' || name === 'modifier' || name === 'isDirected') { continue; }
    if (name.substring(0, 5) !== 'prop_') { continue; }
    props.push({
      propertyDefinitionRef: name.substring(5),
      value: [{ 'value': safeString(tag.Value), 'lang': 'en' }]
    });
  }
  return props.length > 0 ? { property: props } : null;
}

// ===========================================================================
// Documentation extraction from Notes (fallback when kg_documentation tag absent)
// ===========================================================================

function extractDocFromNotes(notes) {
  var text = safeString(notes);
  if (text === '') { return ''; }

  var lines = text.split(/\r?\n/);
  var docLines = [];
  var inDoc = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    if (/^Documentation:$/i.test(line)) { inDoc = true; continue; }
    if (inDoc) {
      if (/^(Identifier|Type|Properties|Extensions JSON):$/i.test(line)) { break; }
      docLines.push(line);
    }
  }

  if (!inDoc) {
    return trimString(text);
  }

  return trimString(docLines.join('\n'));
}

// ===========================================================================
// Tagged value helpers
// ===========================================================================

function getTagValue(elementOrConnector, tagName) {
  try {
    var tags = elementOrConnector.TaggedValues;
    if (tags == null) { return ''; }
    for (var i = 0; i < tags.Count; i++) {
      var tag = tags.GetAt(i);
      if (tag != null && safeString(tag.Name) === tagName) {
        return safeString(tag.Value);
      }
    }
  } catch (e) {}
  return '';
}

// ===========================================================================
// Lang-string helpers
// ===========================================================================

function firstLangValue(langStrings, fallback) {
  if (langStrings && langStrings.length && langStrings[0] && typeof langStrings[0].value !== 'undefined') {
    return safeString(langStrings[0].value);
  }
  return safeString(fallback);
}

// ===========================================================================
// Object helpers
// ===========================================================================

function shallowCopy(obj) {
  var out = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      out[key] = obj[key];
    }
  }
  return out;
}

// ===========================================================================
// File I/O
// ===========================================================================

function readUtf8File(filePath) {
  var stream = null;
  try {
    var fso = new ActiveXObject('Scripting.FileSystemObject');
    if (!fso.FileExists(filePath)) { return ''; }

    stream = new ActiveXObject('ADODB.Stream');
    stream.Type = 2;
    stream.Charset = 'UTF-8';
    stream.Open();
    stream.LoadFromFile(filePath);
    return stream.ReadText();
  } catch (e) {
    Session.Output('WARNING: Could not read baseline file: ' + filePath + ' :: ' + errorMessage(e));
    return '';
  } finally {
    if (stream != null) { try { stream.Close(); } catch (ignore) {} }
  }
}

function writeUtf8File(filePath, content) {
  var stream = null;
  try {
    var fso = new ActiveXObject('Scripting.FileSystemObject');
    var parentFolder = fso.GetParentFolderName(filePath);
    if (!fso.FolderExists(parentFolder)) {
      createFolderRecursive(fso, parentFolder);
    }

    stream = new ActiveXObject('ADODB.Stream');
    stream.Type = 2;
    stream.Charset = 'UTF-8';
    stream.Open();
    stream.WriteText(content);
    stream.SaveToFile(filePath, 2);
    Session.Output('File written: ' + filePath);
  } catch (e) {
    fail('Could not write UTF-8 file: ' + filePath + ' :: ' + errorMessage(e));
  } finally {
    if (stream != null) { try { stream.Close(); } catch (ignore) {} }
  }
}

function createFolderRecursive(fso, folderPath) {
  if (fso.FolderExists(folderPath)) { return; }
  var parent = fso.GetParentFolderName(folderPath);
  if (parent !== '' && !fso.FolderExists(parent)) {
    createFolderRecursive(fso, parent);
  }
  fso.CreateFolder(folderPath);
}

// ===========================================================================
// Path resolution (shared with import script)
// ===========================================================================

function trimString(s) {
  if (s == null) { return ''; }
  return ('' + s).replace(/^\s+|\s+$/g, '');
}

function getConnectionProperty(connectionString, keyName) {
  if (connectionString == null || connectionString == '') { return ''; }
  var pattern = new RegExp('(?:^|;)\\s*' + keyName + '\\s*=\\s*([^;]+)', 'i');
  var match = ('' + connectionString).match(pattern);
  if (match && match.length > 1) { return trimString(match[1]); }
  return '';
}

function stripWrappedQuotes(s) {
  var value = trimString(s);
  if (value.length >= 2) {
    var first = value.charAt(0);
    var last = value.charAt(value.length - 1);
    if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
      return value.substring(1, value.length - 1);
    }
  }
  return value;
}

function resolveModelFilePathFromConnectionString() {
  var connectionString = '';
  try { connectionString = '' + Repository.ConnectionString; } catch (e) { return ''; }
  if (connectionString == '') { return ''; }
  var dataSource = getConnectionProperty(connectionString, 'Data Source');
  if (dataSource == '') { dataSource = getConnectionProperty(connectionString, 'DataSource'); }
  if (dataSource == '') { dataSource = getConnectionProperty(connectionString, 'DBQ'); }
  if (dataSource != '') { return stripWrappedQuotes(dataSource); }
  var directPath = stripWrappedQuotes(connectionString);
  if (/^[A-Za-z]:\\/.test(directPath) || /^\\\\/.test(directPath)) { return directPath; }
  return '';
}

function resolveKnowledgeGraphPathFromCurrentModel() {
  var modelFilePath = resolveModelFilePathFromConnectionString();
  if (modelFilePath == '') { return ''; }
  try {
    var fso = new ActiveXObject('Scripting.FileSystemObject');
    var rootPath = fso.GetParentFolderName(modelFilePath);
    return fso.BuildPath(rootPath, KG_JSON_RELATIVE_PATH);
  } catch (e) {
    fail('Could not build the knowledge graph path from the current model path: ' + errorMessage(e));
    return '';
  }
}

// ===========================================================================
// Utility functions
// ===========================================================================

function safeString(value) {
  if (value == null || typeof value === 'undefined') { return ''; }
  return '' + value;
}

function isNonEmptyString(value) {
  return safeString(value) !== '';
}

function errorMessage(e) {
  if (e == null) { return 'Unknown error'; }
  if (typeof e.message !== 'undefined') { return '' + e.message; }
  return '' + e;
}

function fail(message) {
  Session.Output('ERROR: ' + message);
}

main();
