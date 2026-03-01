!INC Local Scripts.EAConstants-JScript
!INC JSON-Parser

/*
 * Script Name: Draw Diagram from JSON
 * Author: Our Partnership
 * Purpose: Reads a JSON file (in our specific format) and generates a new diagram.
 * Date: 2025-07-12
 */

function main() {
    Repository.EnsureOutputVisible("Script");
	Repository.EnableUIUpdates(false);
    Session.Output("Starting Diagram Import from JSON2...");

    // --- 1. GET AND READ THE JSON FILE ---
	//var kgname = "application-threat-analysis-knowledge-graph-schemaV0.1";
	var kgname = "attackcase1";
    var filePath = "D:\\projects\\riskassessment\\attackcases\\" + kgname + ".json";
    if (filePath == "") {
        Session.Output("User cancelled file selection. Aborting.");
        return;
    }

    // --- FIX START: Replace FileSystemObject with ADODB.Stream for UTF-8 Support ---
    var jsonString;
    try {
        // Create the ADODB Stream object
        var stream = new ActiveXObject("ADODB.Stream");
        
        // Set the stream type to text
        stream.Type = 2; // 2 = adTypeText
        
        // IMPORTANT: Set the character set to UTF-8 BEFORE opening the file
        stream.Charset = "UTF-8";
        
        // Open the stream and load the file content
        stream.Open();
        stream.LoadFromFile(filePath);
        
        // Read the entire file content as a string
        jsonString = stream.ReadText();
        
        // Clean up
        stream.Close();
        
        Session.Output("Successfully read UTF-8 file: " + filePath);
        
    } catch (e) {
        Session.Output("ERROR: Could not read file using ADODB.Stream. " + e.message);
        if (e.message.indexOf("ADODB.Stream") > -1) {
             Session.Output("This script requires the ADO components to be available on the system.");
        }
        Repository.EnableUIUpdates(true); // Re-enable UI on error
        return;
    }
    // --- FIX END ---
    
    // --- 2. PARSE THE JSON DATA ---
    var diagramData;
    try {
        diagramData = JSON.parse(jsonString);
    } catch (e) {
        Session.Output("ERROR: Invalid JSON in file. " + e.message);
        Repository.EnableUIUpdates(true);
        return;
    }

    // --- 3. PREPARE THE EA MODEL ---
    var parentPkg as EA.Package;
    parentPkg = Repository.GetTreeSelectedPackage();
    if (parentPkg == null) {
        Session.Output("ERROR: Please select a Package in the tree view to create the diagram in.");
        Repository.EnableUIUpdates(true);
        return;
    }

    Session.Output("Creating new content in Package: " + parentPkg.Name);
	var now = new Date();
	var timestamp = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() +
					"_" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    var newPkg = parentPkg.Packages.AddNew(kgname + "-" + timestamp, "Package");
    newPkg.Update();
    parentPkg.Packages.Refresh();

    var newDiagram as EA.Diagram;
	newDiagram = newPkg.Diagrams.AddNew(kgname + "-" + timestamp, "Logical");
    newDiagram.Update();
    newPkg.Diagrams.Refresh();

    // --- 4. CREATE THE ELEMENTS (FIRST PASS) ---
    Session.Output("Creating elements...");
    var createdElements = {}; // Map to track elements by name

    for (var i = 0; i < diagramData.nodeTypes.length; i++) {
        var node = diagramData.nodeTypes[i];
        var newElement as EA.Element;
		newElement = newPkg.Elements.AddNew(node.name, "Class"); // Create as a base Class
        newElement.Notes = node.description;
		newElement.StereotypeEx = node.superType;
		if (node.isAbstract == true) {
			newElement.Abstract = "1";
		}

		newElement.Update();
		
        // Add attributes
        if (node.attributes) {
            for (var j = 0; j < node.attributes.length; j++) {
                var attrData = node.attributes[j];
                var newOper as EA.Method;
				newOper = newElement.Methods.AddNew(attrData.name, attrData.type);
				newOper.Alias = attrData.defaultvalue;
				newOper.Notes = attrData.description;
				newOper.Behavior = attrData.isIndexed;
				newOper.Update();
				if (attrData.datasources) {
					for (var l = 0; l < attrData.datasources.length; l++) {
						var dsData = attrData.datasources[l];
						var param as EA.Parameter;
						param = newOper.Parameters.AddNew(dsData.datasourcetypeUuid, "string");
						param.Alias = dsData.datasourceTypeName;
						param.Notes = dsData.relaventProperyName;
						param.Update();
					}
				}
				newOper.Parameters.Refresh();
            }
        }
        newElement.Methods.Refresh();
        
        var diaObj as EA.DiagramObject;
		diaObj = newDiagram.DiagramObjects.AddNew("l=0;r=0;t=0;b=0;", "");
        diaObj.ElementID = newElement.ElementID;
        diaObj.Update();
        
        createdElements[node.name] = newElement;
        Session.Output("... Created Node: " + node.name);
    }
    newPkg.Elements.Refresh();
    newDiagram.DiagramObjects.Refresh();

    // --- 5. CREATE THE RELATIONS (SECOND PASS) ---
    Session.Output("Creating relationships...");
    for (var k = 0; k < diagramData.relationTypes.length; k++) {
        var rel = diagramData.relationTypes[k];
        
        var sourceElement = createdElements[rel.sourceNodeType];
        var targetElement = createdElements[rel.targetNodeType];

        if (sourceElement && targetElement) {
        
            // ** NEW: Check if this is an Association Class (if it has attributes) **
            if (rel.attributes && rel.attributes.length > 0) {
				var relationType = "Association";
				if (rel.type == "Generalization") {
					relationType = "Generalization";
				} else if (rel.type == "Realisation") {
					relationType = "Realisation";
				} else if ((rel.type == "COMPOSE") || (rel.type == "AGGREGATE")) {
					relationType = "Aggregation";
				}
                // 3. Create the underlying association connector
                var newConnector as EA.Connector;
				newConnector = sourceElement.Connectors.AddNew("", relationType);
                newConnector.SupplierID = targetElement.ElementID;
				newConnector.Alias = rel.alias;
				newConnector.Name = rel.type;
				if (rel.type == "COMPOSE") {
					newConnector.SupplierEnd.Aggregation = 2;
				} else if (rel.type == "AGGREGATE") {
					newConnector.SupplierEnd.Aggregation = 1;
				}
				newConnector.Notes = rel.description;
				newConnector.ClientEnd.Role = rel.sourceNodeRole;
				newConnector.ClientEnd.Cardinality = rel.sourceNodeMultiplicity;
				newConnector.ClientEnd.RoleNote = rel.sourceNodeRoleDescription;
				newConnector.SupplierEnd.Role = rel.targetNodeRole;
				newConnector.SupplierEnd.Cardinality = rel.targetNodeMultiplicity;
				newConnector.SupplierEnd.RoleNote = rel.targetNodeRoleDescription;
                newConnector.Update(); // Save connector first
				if (relationType == "Association") {
					// 1. Create the class element
					Session.Output("... Creating Association Class: " + rel.type);
					var assocClassElement as EA.Element;
					assocClassElement = newPkg.Elements.AddNew("", "Class");
					assocClassElement.Name = rel.type;
					assocClassElement.Alias = rel.alias;
					assocClassElement.Notes = rel.description;
					assocClassElement.Update();
					// 2. Add attributes to it
					for (var l = 0; l < rel.attributes.length; l++) {
						var attrData = rel.attributes[l];
						var newOper as EA.Method;
						newOper = assocClassElement.Methods.AddNew(attrData.name, attrData.type);
						newOper.Alias = attrData.defaultvalue;
						newOper.Notes = attrData.description;
						newOper.Behavior = attrData.isIndexed;
						newOper.Update();
						if (attrData.datasources) {
							for (var q = 0; q < attrData.datasources.length; q++) {
								var dsData = attrData.datasources[q];
								var param as EA.Parameter;
								param = newOper.Parameters.AddNew(dsData.datasourcetypeUuid, "string");
								param.Alias = dsData.datasourceTypeName;
								param.Notes = dsData.relaventProperyName;
								param.Update();
							}
						}
						newOper.Parameters.Refresh();
					}
					assocClassElement.Methods.Refresh();
					
					// 4. Link the class to the connector
					assocClassElement.CreateAssociationClass(newConnector.ConnectorID);
					assocClassElement.Update(); // Save again with the link
				} else {// for generation/compose/aggregate
					Session.Output("... Creating tags for: " + rel.type);
					// 2. Add attributes to it
					for (var l = 0; l < rel.attributes.length; l++) {
						var attrData = rel.attributes[l];
						if (attrData.datasources) {
							for (var q = 0; q < attrData.datasources.length; q++) {
								var dsData = attrData.datasources[q];
								var tagvalue = dsData.datasourcetypeUuid + "," + dsData.relaventProperyName;
								var tagname = attrData.name + q;
								putTag(newConnector.TaggedValues, tagname, tagvalue);
								Session.Output("... putTag " + newConnector.Type + " " + tagname + " " + tagvalue);
							}
						}
					}
					newConnector.TaggedValues.Refresh();
				}
            }
            else {
                // --- It's a simple connector ---
				var relationType = "Association";
				if (rel.type == "Generalization") {
					relationType = "Generalization";
				} else if (rel.type == "Realisation") {
					relationType = "Realisation";
				} else if ((rel.type == "COMPOSE") || (rel.type == "AGGREGATE")) {
					relationType = "Aggregation";
				}
                var newConnector = sourceElement.Connectors.AddNew("", relationType);
                newConnector.SupplierID = targetElement.ElementID;
                newConnector.Name = rel.type; // Apply the type from JSON as a name
				if (rel.type == "COMPOSE") {
					newConnector.SupplierEnd.Aggregation = 2;
				} else if (rel.type == "AGGREGATE") {
					newConnector.SupplierEnd.Aggregation = 1;
				}
				newConnector.Alias = rel.alias;
                newConnector.Notes = rel.description;
				newConnector.ClientEnd.Role = rel.sourceNodeRole;
				newConnector.ClientEnd.Cardinality = rel.sourceNodeMultiplicity;
				newConnector.ClientEnd.RoleNote = rel.sourceNodeRoleDescription;
				newConnector.SupplierEnd.Role = rel.targetNodeRole;
				newConnector.SupplierEnd.Cardinality = rel.targetNodeMultiplicity;
				newConnector.SupplierEnd.RoleNote = rel.targetNodeRoleDescription;
                newConnector.Update();
            }
			Session.Output("... Linked " + rel.sourceNodeType + " -> " + rel.targetNodeType + " with name <<" + rel.type + ">>");
        } else {
            Session.Output("... WARNING: Could not link '" + rel.sourceNodeType + "' to '" + rel.targetNodeType + "'. One or both not found.");
        }
    }
    
    newPkg.Elements.Refresh();
    newDiagram.DiagramObjects.Refresh();

    // --- 6. CLEAN UP AND DISPLAY ---
    Session.Output("=======================================");
    Session.Output("Diagram import complete!");
	Repository.EnableUIUpdates(true);
	
	//Repository.RefreshModelView(newPkg.PackageID);
    //Repository.OpenDiagram(newDiagram.DiagramID);
}

function putTag(tags, key, value) {
	var tag as EA.TaggedValue;
	tag = tags.GetByName(key);
	if (tag == null) {
		tag = tags.AddNew(key, "String");
	}
	tag.Value = value;
	tag.Update();
}

main();