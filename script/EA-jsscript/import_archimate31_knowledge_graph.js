!INC Local Scripts.EAConstants-JScript
!INC JSON-Parser

/*
 * Script Name: Import ArchiMate 3.1 Knowledge Graph
 * Purpose: Import a schema-compliant ArchiMate 3.1 exchange-model JSON knowledge graph into EA.
 * Usage:
 *   1. Select a target package in EA Project Browser.
 *   2. Adjust KG_JSON_PATH if needed.
 *   3. Run the script.
 * Notes:
 *   - The script preserves exchange-model identifiers, properties, and extensions in tagged values.
 *   - Elements are created with pragmatic EA base types and the ArchiMate type stored in StereotypeEx.
 *   - Relationships are imported as EA connectors with the source schema type retained in StereotypeEx.
 */

var KG_JSON_PATH = 'd:\\projects\\AICodingAgent\\ai4pb-orchestrator\\.opencode\\temp\\SharedKnowledgeGraph.archimate3.1.json';
var CREATE_IMPORT_DIAGRAM = true;
var DIAGRAM_TYPE = 'Logical';
var DIAGRAM_NAME_SUFFIX = ' Import';

function main() {
  Repository.EnsureOutputVisible('Script');
  Repository.EnableUIUpdates(false);

  try {
    Session.Output('Starting ArchiMate 3.1 knowledge graph import...');

    var parentPkg = Repository.GetTreeSelectedPackage();
    if (parentPkg == null) {
      fail('Please select a target Package in the Project Browser before running this script.');
      return;
    }

    var jsonString = readUtf8File(KG_JSON_PATH);
    if (!jsonString) {
      fail('Input file is empty or could not be read: ' + KG_JSON_PATH);
      return;
    }

    var graph = parseJson(jsonString);
    validateGraph(graph);

    var propertyDefinitionMap = buildPropertyDefinitionMap(graph.propertyDefinitions);
    var importPkg = createImportPackage(parentPkg, graph);
    var importDiagram = null;

    if (CREATE_IMPORT_DIAGRAM) {
      importDiagram = createImportDiagram(importPkg, graph);
    }

    var elementMap = {};
    var importedCount = importElements(importPkg, importDiagram, graph.elements, propertyDefinitionMap, elementMap);
    var relationshipCount = importRelationships(importDiagram, graph.relationships, propertyDefinitionMap, elementMap);

    Repository.RefreshModelView(parentPkg.PackageID);
    if (importDiagram != null) {
      Repository.OpenDiagram(importDiagram.DiagramID);
    }

    Session.Output('Import complete.');
    Session.Output('Elements imported: ' + importedCount);
    Session.Output('Relationships imported: ' + relationshipCount);
    Session.Output('Package: ' + importPkg.Name);
  } catch (e) {
    fail('Import failed: ' + errorMessage(e));
  } finally {
    Repository.EnableUIUpdates(true);
  }
}

function readUtf8File(filePath) {
  var stream = null;
  try {
    stream = new ActiveXObject('ADODB.Stream');
    stream.Type = 2;
    stream.Charset = 'UTF-8';
    stream.Open();
    stream.LoadFromFile(filePath);
    return stream.ReadText();
  } catch (e) {
    fail('Could not read UTF-8 file: ' + filePath + ' :: ' + errorMessage(e));
    return '';
  } finally {
    if (stream != null) {
      try {
        stream.Close();
      } catch (ignore) {
      }
    }
  }
}

function parseJson(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    throw new Error('Invalid JSON: ' + errorMessage(e));
  }
}

function validateGraph(graph) {
  if (graph == null || typeof graph !== 'object') {
    throw new Error('The JSON root must be an object.');
  }
  if (!isNonEmptyString(graph.identifier)) {
    throw new Error('Missing required root field: identifier');
  }
  if (!graph.name || !graph.name.length) {
    throw new Error('Missing required root field: name');
  }
}

function buildPropertyDefinitionMap(propertyDefinitionsNode) {
  var map = {};
  if (!propertyDefinitionsNode || !propertyDefinitionsNode.property) {
    return map;
  }

  for (var i = 0; i < propertyDefinitionsNode.property.length; i++) {
    var definition = propertyDefinitionsNode.property[i];
    if (definition && isNonEmptyString(definition.identifier)) {
      map[definition.identifier] = definition;
    }
  }
  return map;
}

function createImportPackage(parentPkg, graph) {
  var modelName = firstLangValue(graph.name, graph.identifier);
  var version = safeString(graph.version);
  var packageName = modelName;

  if (version !== '') {
    packageName += ' v' + version;
  }
  packageName += ' Import';

  var pkg = parentPkg.Packages.AddNew(packageName, 'Package');
  pkg.Notes = buildPackageNotes(graph);
  pkg.Update();
  parentPkg.Packages.Refresh();

  Session.Output('Created package: ' + packageName);
  return pkg;
}

function createImportDiagram(importPkg, graph) {
  var modelName = firstLangValue(graph.name, graph.identifier);
  var diagram = importPkg.Diagrams.AddNew(modelName + DIAGRAM_NAME_SUFFIX, DIAGRAM_TYPE);
  diagram.Notes = 'Generated from ' + KG_JSON_PATH;
  diagram.Update();
  importPkg.Diagrams.Refresh();
  Session.Output('Created diagram: ' + diagram.Name);
  return diagram;
}

function importElements(importPkg, importDiagram, elementsNode, propertyDefinitionMap, elementMap) {
  var count = 0;
  if (!elementsNode || !elementsNode.element || !elementsNode.element.length) {
    Session.Output('No elements found in graph.');
    return count;
  }

  for (var i = 0; i < elementsNode.element.length; i++) {
    var concept = elementsNode.element[i];
    if (!concept || !isNonEmptyString(concept.identifier)) {
      continue;
    }
    Session.Output('concept.type:' + concept.type);
    var baseType = mapElementTypeToEa(concept.type);
    Session.Output('baseType:' + baseType);
    var elementName = firstLangValue(concept.name, concept.identifier);
    var element = importPkg.Elements.AddNew(elementName, baseType);
    element.Alias = concept.identifier;
    element.StereotypeEx = mapStereotypeToEa(safeString(concept.type));
    element.Notes = buildConceptNotes(concept, propertyDefinitionMap);
    applyConceptTags(element.TaggedValues, concept, propertyDefinitionMap);
    element.Update();

    importPkg.Elements.Refresh();
    elementMap[concept.identifier] = element;

    if (importDiagram != null) {
      addElementToDiagram(importDiagram, element);
    }

    count++;
    Session.Output('Created element [' + concept.type + ']: ' + elementName + ' (' + concept.identifier + ')');
  }

  if (importDiagram != null) {
    importDiagram.DiagramObjects.Refresh();
  }

  return count;
}

function importRelationships(importDiagram, relationshipsNode, propertyDefinitionMap, elementMap) {
  var count = 0;
  if (!relationshipsNode || !relationshipsNode.relationship || !relationshipsNode.relationship.length) {
    Session.Output('No relationships found in graph.');
    return count;
  }

  for (var i = 0; i < relationshipsNode.relationship.length; i++) {
    var relation = relationshipsNode.relationship[i];
    if (!relation || !isNonEmptyString(relation.identifier)) {
      continue;
    }

    var sourceElement = elementMap[relation.source];
    var targetElement = elementMap[relation.target];

    if (!sourceElement || !targetElement) {
      Session.Output('WARNING: Skipping relationship ' + relation.identifier + ' because source or target element is missing.');
      continue;
    }

    var connectorMeta = mapRelationshipTypeToEa(relation.type);
    var connector = sourceElement.Connectors.AddNew(firstLangValue(relation.name, relation.type), connectorMeta.connectorType);
    connector.SupplierID = targetElement.ElementID;
    connector.Alias = relation.identifier;
    connector.StereotypeEx = safeString(mapRelationshipTypeToEaStereotype(relation.type));
    connector.Notes = buildConceptNotes(relation, propertyDefinitionMap);

    applyRelationshipTags(connector, relation, propertyDefinitionMap);
    connector.Update();

    if (importDiagram != null) {
      addConnectorToDiagram(importDiagram, connector);
    }

    count++;
    Session.Output('Created relationship [' + relation.type + ']: ' + relation.identifier + ' (' + relation.source + ' -> ' + relation.target + ')');
  }

  if (importDiagram != null) {
    importDiagram.DiagramLinks.Refresh();
  }

  return count;
}

function addElementToDiagram(diagram, element) {
  var diagramObject = diagram.DiagramObjects.AddNew('', '');
  diagramObject.ElementID = element.ElementID;
  disableRectangleNotationForDiagramObject(diagramObject);
  diagramObject.Update();
}

function disableRectangleNotationForDiagramObject(diagramObject) {
  diagramObject.Style = setStyleToken(diagramObject.Style, 'UCRect', '0');
}

function setStyleToken(styleText, key, value) {
  var source = safeString(styleText);
  var pattern = new RegExp('(^|;)' + escapeRegExp(key) + '=[^;]*', 'i');

  if (pattern.test(source)) {
    return source.replace(pattern, '$1' + key + '=' + value);
  }

  if (source !== '' && source.charAt(source.length - 1) !== ';') {
    source += ';';
  }

  return source + key + '=' + value + ';';
}

function escapeRegExp(text) {
  return safeString(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addConnectorToDiagram(diagram, connector) {
  var link = diagram.DiagramLinks.AddNew('', '');
  link.ConnectorID = connector.ConnectorID;
  link.Update();
}

function mapRelationshipTypeToEaStereotype(relationshipType) {
  switch (safeString(relationshipType)) {
    case 'Flow':
        return 'Archimate_Flow';
    case 'Triggering':
        return 'Archimate_Triggering';
    case 'Influence':
        return 'Archimate_Influence';
    case 'Realization':
        return 'Archimate_Realization';
    case 'Access':
        return 'Archimate_Access';
    case 'Serving':
        return 'Archimate_Serving';
    case 'Assignment':
        return 'Archimate_Assignment';
    case 'Composition':
        return 'Archimate_Composition';
    case 'Aggregation':
        return 'Archimate_Aggregation';
    case 'Specialization':
        return 'Archimate_Specialization';
    case 'Association':
        return 'Archimate_Association';
    default:
        return relationshipType;
  }
}

function mapStereotypeToEa(conceptType) {
    switch (safeString(conceptType)) {
        case 'Requirement':
            return 'Archimate_Requirement';
        case 'Constraint':
            return 'Archimate_Constraint';
        case 'Capability':
            return 'Archimate_Capability';
        case 'CourseOfAction':
            return 'Archimate_CourseOfAction';
        case 'Outcome':
            return 'Archimate_Outcome';
        case 'Goal':
            return 'Archimate_Goal';
        case 'Principle':
            return 'Archimate_Principle';
        case 'Driver':
            return 'Archimate_Driver';
        case 'Assessment':
            return 'Archimate_Assessment';
        case 'Resource':
            return 'Archimate_Resource';
        case 'ValueStream':
            return 'Archimate_ValueStream';
        case 'BusinessActor':
            return 'Archimate_BusinessActor';
        case 'BusinessRole':
            return 'Archimate_BusinessRole';
        case 'Stakeholder':
            return 'Archimate_Stakeholder';
        case 'BusinessProcess':
            return 'Archimate_BusinessProcess';
        case 'BusinessFunction':
            return 'Archimate_BusinessFunction';
        case 'BusinessInteraction':
            return 'Archimate_BusinessInteraction';
        case 'ApplicationFunction':
            return 'Archimate_ApplicationFunction';
        case 'ApplicationInteraction':
            return 'Archimate_ApplicationInteraction';
        case 'ApplicationProcess':
            return 'Archimate_ApplicationProcess';
        case 'TechnologyFunction':
            return 'Archimate_TechnologyFunction';
        case 'TechnologyProcess':
            return 'Archimate_TechnologyProcess';
        case 'TechnologyInteraction':
            return 'Archimate_TechnologyInteraction';
        case 'WorkPackage':
            return 'Archimate_WorkPackage';
        case 'ApplicationComponent':
            return 'Archimate_ApplicationComponent';
        case 'ApplicationCollaboration':
            return 'Archimate_ApplicationCollaboration';
        case 'TechnologyCollaboration':
            return 'Archimate_TechnologyCollaboration';
        case 'Node':
            return 'Archimate_Node';
        case 'Device':
            return 'Archimate_Device';
        case 'SystemSoftware':
            return 'Archimate_SystemSoftware';
        case 'Equipment':
            return 'Archimate_Equipment';
        case 'Facility':
            return 'Archimate_Facility';
        case 'DistributionNetwork':
            return 'Archimate_DistributionNetwork';
        case 'CommunicationNetwork':
            return 'Archimate_CommunicationNetwork';
        case 'Path':
            return 'Archimate_Path';
        case 'Artifact':
            return 'Archimate_Artifact';
        case 'Specialization':
            return 'Archimate_Specialization';
        case 'Association':
            return 'Archimate_Association';
        case 'Triggering':
            return 'Archimate_Triggering';
        case 'Flow':
            return 'Archimate_Flow';
        case 'Influence':
            return 'Archimate_Influence';
        case 'Access':
            return 'Archimate_Access';
        case 'Realization':
            return 'Archimate_Realization';
        case 'Serving':
            return 'Archimate_Serving';
        case 'Assignment':
            return 'Archimate_Assignment';
        case 'Composition':
            return 'Archimate_Composition';
        case 'Aggregation':
            return 'Archimate_Aggregation';
        case 'BusinessService':
            return 'Archimate_BusinessService';
        case 'ApplicationService':
            return 'Archimate_ApplicationService';
        case 'DataObject':
            return 'Archimate_DataObject';
        default:
            return conceptType;
    }
}

function mapElementTypeToEa(archimateType) {
  switch (safeString(archimateType)) {
    case 'ApplicationComponent':
        return 'Component';
    case 'BusinessService':
    case 'ApplicationService':
    case 'ValueStream':
    case 'TechnologyInteraction':
    case 'TechnologyProcess':
    case 'TechnologyFunction':
    case 'ApplicationProcess':
    case 'ApplicationInteraction':
    case 'ApplicationFunction':
    case 'BusinessInteraction':
    case 'BusinessFunction':
    case 'BusinessProcess':
        return 'Activity';
    case 'BusinessActor':
    case 'BusinessRole':
    case 'Stakeholder':
    case 'WorkPackage':
    case 'TechnologyCollaboration':
    case 'Capability':
    case 'Resource':
    case 'Product':
    case 'DataObject':
    case 'ApplicationCollaboration':
    case 'CourseOfAction':
    case 'Assessment':
    case 'Driver':
    case 'Principle':
    case 'Outcome':
    case 'Goal':
    case 'Constraint':
    case 'Requirement':
    case 'Artifact':
    case 'Path':
    case 'CommunicationNetwork':
    case 'DistributionNetwork':
    case 'Facility':
    case 'Equipment':
    case 'SystemSoftware':
    case 'Device':
    case 'Node':
        return 'Class';
    default:
        return 'Class';
  }
}

function mapRelationshipTypeToEa(relationshipType) {
  var typeName = safeString(relationshipType);
  var meta = {
    connectorType: 'Association',
    aggregationKind: -1,
    useGeneralizationName: false
  };

  switch (typeName) {
    case 'Flow':
    case 'Triggering':
    case 'Influence':
        meta.connectorType = 'ControlFlow';
        break;
    case 'Realization':
    case 'Access':
        meta.connectorType = 'Dependency';
        break;
    case 'Aggregation':
    case 'Composition':
    case 'Assignment':
    case 'Serving':
    case 'Association':
      meta.connectorType = 'Association';
      break;
    case 'Specialization':
      meta.connectorType = 'Generalization';
      break;
  }

  return meta;
}

function buildPackageNotes(graph) {
  var lines = [];
  lines.push('Imported from ArchiMate 3.1 exchange-model JSON');
  lines.push('Source file: ' + KG_JSON_PATH);
  lines.push('Identifier: ' + safeString(graph.identifier));
  lines.push('Version: ' + safeString(graph.version));
  appendDocumentationLines(lines, graph.documentation);

  if (graph.metadata) {
    if (isNonEmptyString(graph.metadata.schema)) {
      lines.push('Schema: ' + graph.metadata.schema);
    }
    if (isNonEmptyString(graph.metadata.schemaversion)) {
      lines.push('Schema version: ' + graph.metadata.schemaversion);
    }
  }

  if (graph.extensions) {
    lines.push('Extensions JSON:');
    lines.push(stringifyCompact(graph.extensions));
  }

  return lines.join('\r\n');
}

function buildConceptNotes(concept, propertyDefinitionMap) {
  var lines = [];
  lines.push('Identifier: ' + safeString(concept.identifier));
  lines.push('Type: ' + safeString(concept.type));
  appendDocumentationLines(lines, concept.documentation);

  var propertyLines = buildPropertyLines(concept.properties, propertyDefinitionMap);
  for (var i = 0; i < propertyLines.length; i++) {
    lines.push(propertyLines[i]);
  }

  if (concept.extensions) {
    lines.push('Extensions JSON:');
    lines.push(stringifyCompact(concept.extensions));
  }

  return lines.join('\r\n');
}

function buildPropertyLines(propertiesNode, propertyDefinitionMap) {
  var lines = [];
  if (!propertiesNode || !propertiesNode.property) {
    return lines;
  }

  lines.push('Properties:');
  for (var i = 0; i < propertiesNode.property.length; i++) {
    var property = propertiesNode.property[i];
    if (!property) {
      continue;
    }

    var definitionName = property.propertyDefinitionRef;
    var definition = propertyDefinitionMap[property.propertyDefinitionRef];
    if (definition && definition.name) {
      definitionName = firstLangValue(definition.name, definitionName);
    }

    lines.push('- ' + definitionName + ': ' + joinLangValues(property.value));
  }

  return lines;
}

function appendDocumentationLines(lines, documentationNode) {
  var docs = joinLangValues(documentationNode);
  if (docs !== '') {
    lines.push('Documentation:');
    lines.push(docs);
  }
}

function applyConceptTags(tagCollection, concept, propertyDefinitionMap) {
  putTag(tagCollection, 'kg_identifier', safeString(concept.identifier));
  putTag(tagCollection, 'kg_type', safeString(concept.type));

  if (concept.properties && concept.properties.property) {
    for (var i = 0; i < concept.properties.property.length; i++) {
      var property = concept.properties.property[i];
      if (!property) {
        continue;
      }

      var tagName = 'prop_' + sanitizeTagName(resolvePropertyName(property, propertyDefinitionMap));
      putTag(tagCollection, tagName, truncateTagValue(joinLangValues(property.value)));
    }
  }

  if (concept.extensions) {
    putTag(tagCollection, 'extensions_json', truncateTagValue(stringifyCompact(concept.extensions)));
  }
}

function applyRelationshipTags(connector, relation, propertyDefinitionMap) {
  putTag(connector.TaggedValues, 'kg_identifier', safeString(relation.identifier));
  putTag(connector.TaggedValues, 'kg_type', safeString(relation.type));
  putTag(connector.TaggedValues, 'kg_source', safeString(relation.source));
  putTag(connector.TaggedValues, 'kg_target', safeString(relation.target));

  if (isNonEmptyString(relation.accessType)) {
    putTag(connector.TaggedValues, 'accessType', relation.accessType);
  }
  if (isNonEmptyString(relation.modifier)) {
    putTag(connector.TaggedValues, 'modifier', relation.modifier);
  }
  if (typeof relation.isDirected !== 'undefined') {
    putTag(connector.TaggedValues, 'isDirected', '' + relation.isDirected);
  }

  if (relation.properties && relation.properties.property) {
    for (var i = 0; i < relation.properties.property.length; i++) {
      var property = relation.properties.property[i];
      if (!property) {
        continue;
      }

      var tagName = 'prop_' + sanitizeTagName(resolvePropertyName(property, propertyDefinitionMap));
      putTag(connector.TaggedValues, tagName, truncateTagValue(joinLangValues(property.value)));
    }
  }

  if (relation.extensions) {
    putTag(connector.TaggedValues, 'extensions_json', truncateTagValue(stringifyCompact(relation.extensions)));
  }
}

function resolvePropertyName(property, propertyDefinitionMap) {
  var definitionName = property.propertyDefinitionRef;
  var definition = propertyDefinitionMap[property.propertyDefinitionRef];
  if (definition && definition.name) {
    definitionName = firstLangValue(definition.name, definitionName);
  }
  return safeString(definitionName);
}

function putTag(tags, key, value) {
  var tag = tags.GetByName(key);
  if (tag == null) {
    tag = tags.AddNew(key, '');
  }
  tag.Value = safeString(value);
  tag.Update();
  tags.Refresh();
}

function firstLangValue(langStrings, fallback) {
  if (langStrings && langStrings.length && langStrings[0] && typeof langStrings[0].value !== 'undefined') {
    return safeString(langStrings[0].value);
  }
  return safeString(fallback);
}

function joinLangValues(langStrings) {
  if (!langStrings || !langStrings.length) {
    return '';
  }

  var values = [];
  for (var i = 0; i < langStrings.length; i++) {
    if (langStrings[i] && typeof langStrings[i].value !== 'undefined') {
      values.push(safeString(langStrings[i].value));
    }
  }
  return values.join('\r\n');
}

function sanitizeTagName(value) {
  var sanitized = safeString(value).replace(/[^A-Za-z0-9_]/g, '_');
  sanitized = sanitized.replace(/_+/g, '_');
  if (sanitized === '') {
    sanitized = 'value';
  }
  if (sanitized.length > 40) {
    sanitized = sanitized.substring(0, 40);
  }
  return sanitized;
}

function truncateTagValue(value) {
  var text = safeString(value);
  if (text.length > 255) {
    return text.substring(0, 252) + '...';
  }
  return text;
}

function stringifyCompact(value) {
  try {
    return JSON.stringify(value);
  } catch (e) {
    return '[unserializable extensions]';
  }
}

function safeString(value) {
  if (value == null || typeof value === 'undefined') {
    return '';
  }
  return '' + value;
}

function isNonEmptyString(value) {
  return safeString(value) !== '';
}

function errorMessage(e) {
  if (e == null) {
    return 'Unknown error';
  }
  if (typeof e.message !== 'undefined') {
    return '' + e.message;
  }
  return '' + e;
}

function fail(message) {
  Session.Output('ERROR: ' + message);
}

main();