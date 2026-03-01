!INC Local Scripts.EAConstants-JScript

/*
 * Script Name: Export Diagram to JSON File (UTF-8)
 * Author: Your Name
 * Purpose: Exports node and relation types of the current diagram to a user-selected JSON file.
 *          This version uses ADODB.Stream to ensure UTF-8 encoding.
 * Date: 2025-08-02
 */

// Helper function to escape strings for JSON
function jsonEscape(str) {
    if (str == null) return "";
    // Escape backslashes, double quotes, and control characters for valid JSON
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
}

function extractFromDiagram(currentDiagram) {
	Session.Output("currentDiagram: " + currentDiagram.Name);
    // --- DATA EXTRACTION & JSON STRING BUILDING ---
    var nodeTypesJsonStrings = [];
    var relationTypesJsonStrings = [];
    // Process all diagram objects (nodes)
    var diaObjs as EA.Collection;
    diaObjs = currentDiagram.DiagramObjects;

    for (var i = 0; i < diaObjs.Count; i++) {
        var diaObj as EA.DiagramObject;
        diaObj = diaObjs.GetAt(i);
        var ele as EA.Element;
        ele = Repository.GetElementByID(diaObj.ElementID);
		Session.Output("ele.Name: " + ele.Name);
		if (ele.Stereotype == "datasource") continue;
		if (ele.AssociationClassConnectorID != 0) continue;
        var opers as EA.Collection;
        opers = ele.Methods;
        var attributesJsonStrings = [];
		//Session.Output("attrs: \n");
        for (var j = 0; j < opers.Count; j++) {
            var oper as EA.Method;
            oper = opers.GetAt(j);
			//Session.Output("attr: \n" + oper.Name);
			if (oper.Name == "getUUIDCode") continue;

			var params as EA.Collection;
			params = oper.Parameters;
			var paramsJsonStrings = [];
			for (var k = 0; k < params.Count; k++) {
				var param as EA.Parameter;
				param = params.GetAt(k);
				//Session.Output("param: \n" + param.Name);
				paramsJsonStrings.push(
					'{\n' +
					'"datasourcetypeUuid": "' + jsonEscape(param.Name) + '",\n' +
					'"relaventProperyName": "' + jsonEscape(param.Notes) + '"\n' +
					'}'
				);
			}

			var attributesJsonStringsprep = 
				'{\n' +
				'"name": "' + jsonEscape(oper.Name) + '",\n' +
				'"type": "' + jsonEscape(oper.ReturnType) + '"\n';
			
			if (oper.Behavior == "-1") {
				attributesJsonStringsprep += ',"isIndexed": true\n';
				if (oper.ReturnType.toLowerCase() == "string") {
					attributesJsonStringsprep += ',"defaultvalue": "UNKNOWN"\n';
				} else if (oper.ReturnType.toLowerCase() == "datetime") {
					attributesJsonStringsprep += ',"defaultvalue": 2025-03-01 00:00:00\n';
				} else if (oper.ReturnType.toLowerCase() == "list<string>") {
					attributesJsonStringsprep += ',"defaultvalue": []\n';
				} else if (oper.ReturnType.toLowerCase() == "boolean") {
					attributesJsonStringsprep += ',"defaultvalue": false\n';
				} else {
					attributesJsonStringsprep += ',"defaultvalue": 0\n';
				}
			}
			
			if (oper.Notes != "") {
				attributesJsonStringsprep += ',"description": "' + jsonEscape(oper.Notes) + '"\n';
			}

			if (paramsJsonStrings.join(',\n') != "") {
				attributesJsonStringsprep += ',"datasources": [\n' + paramsJsonStrings.join(',\n') + '\n]\n';
			}
			
			attributesJsonStringsprep += '}';
			
			attributesJsonStrings.push(attributesJsonStringsprep);
        }

		var isabstract = false;
		if (ele.Abstract == "1") {
			isabstract = true;
		}
		var nodeTypesJsonStringsprep = 
			'{\n' +
			'"name": "' + jsonEscape(ele.Name) + '",\n' +
			'"isAbstract": ' + isabstract + '\n';		

		if (ele.StereotypeEx != "") {
			nodeTypesJsonStringsprep += ',"superType": "' + jsonEscape(ele.StereotypeEx) + '"\n';
		}

		if (ele.Notes != "") {
			nodeTypesJsonStringsprep += ',"description": "' + jsonEscape(ele.Notes) + '"\n';
		}

		if (attributesJsonStrings.join(',\n') != "") {
			nodeTypesJsonStringsprep += ',"attributes": [\n' + attributesJsonStrings.join(',\n') + '\n]\n';
		}
		
		nodeTypesJsonStringsprep += '}';
		
		nodeTypesJsonStrings.push(nodeTypesJsonStringsprep);
    }

    // Process all diagram links (relations)
    var diaLinks as EA.Collection;
    diaLinks = currentDiagram.DiagramLinks;

    for (var k = 0; k < diaLinks.Count; k++) {
        var link as EA.DiagramLink;
        link = diaLinks.GetAt(k);		
        var conn as EA.Connector;
        conn = Repository.GetConnectorByID(link.ConnectorID);
		
        var source as EA.Element;
        source = Repository.GetElementByID(conn.ClientID);
        var target as EA.Element;
        target = Repository.GetElementByID(conn.SupplierID);

        var relType = conn.Type;
		if (conn.Type == "Association" && conn.Name) {
			relType = conn.Name;
		} else if (conn.Type == "Aggregation") {
			if (conn.SupplierEnd.Aggregation == 1) {
				relType = "AGGREGATE";
			} else if (conn.SupplierEnd.Aggregation == 2) {
				relType = "COMPOSE";
			}
		}
		var hassourceId = false;
		var hastargetId = false;
		var hasrelationName = false;
		var hasId = false;
		Session.Output("conn.Name: " + conn.Name);
        var relationAttributesJsonStrings = [];
        if (conn.AssociationClass != null) {
            var assclass as EA.Element;
            assclass = conn.AssociationClass;
            var relOpers as EA.Collection;
            relOpers = assclass.Methods;
            for (var l = 0; l < relOpers.Count; l++) {
                var relOper as EA.Method;
                relOper = relOpers.GetAt(l);
				//Session.Output("relattr: \n" + relOper.Name);
				if (relOper.Name == "sourceId") {
					hassourceId = true;
				}
				if (relOper.Name == "targetId") {
					hastargetId = true;
				}
				if (relOper.Name == "name") {
					hasrelationName = true;
				}
				if (relOper.Name == "id") {
					hasId = true;
				}
				var params as EA.Collection;
				params = relOper.Parameters;
				var paramsJsonStrings = [];
				for (var j = 0; j < params.Count; j++) {
					var param as EA.Parameter;
					param = params.GetAt(j);
					//Session.Output("param: \n" + param.Name);
					paramsJsonStrings.push(
						'{\n' +
						'"datasourcetypeUuid": "' + jsonEscape(param.Name) + '",\n' +
						'"relaventProperyName": "' + jsonEscape(param.Notes) + '"\n' +
						'}'
					);
				}

				var attributesJsonStringsprep = 
					'{\n' +
					'"name": "' + jsonEscape(relOper.Name) + '",\n' +
					'"type": "' + jsonEscape(relOper.ReturnType) + '"\n';
				
				if (relOper.Behavior == "-1") {
					attributesJsonStringsprep += ',"isIndexed": true\n';
					if (relOper.ReturnType.toLowerCase() == "string") {
						attributesJsonStringsprep += ',"defaultvalue": "UNKNOWN"\n';
					} else if (relOper.ReturnType.toLowerCase() == "datetime") {
						attributesJsonStringsprep += ',"defaultvalue": 2025-03-01 00:00:00\n';
					} else if (relOper.ReturnType.toLowerCase() == "list<string>") {
						attributesJsonStringsprep += ',"defaultvalue": []\n';
					} else if (relOper.ReturnType.toLowerCase() == "boolean") {
						attributesJsonStringsprep += ',"defaultvalue": false\n';
					} else {
						attributesJsonStringsprep += ',"defaultvalue": 0\n';
					}
				}

				if (relOper.Notes != "") {
					attributesJsonStringsprep += ',"description": "' + jsonEscape(relOper.Notes) + '"\n';
				}

				if (paramsJsonStrings.join(',\n') != "") {
					attributesJsonStringsprep += ',"datasources": [\n' + paramsJsonStrings.join(',\n') + '\n]\n';
				}
				
				attributesJsonStringsprep += '}';
				
                relationAttributesJsonStrings.push(attributesJsonStringsprep);
            }
        } else if (conn.Type != "Association") {// generation/compose/aggregate
			var tags as EA.Collection;
			tags = conn.TaggedValues;
			var iddatasourcetypeJsonStrings = [];
			var sourceiddatasourcetypeJsonStrings = [];
			var targetiddatasourcetypeJsonStrings = [];
			for (var j = 0; j < tags.Count; j++) {
				var tag as EA.TaggedValue;
				tag = tags.GetAt(j);
				if (tag.Name.indexOf("id") != -1) {
					var valuess = tag.Value.split(',');
					if (valuess.length != 2) {
						continue;
					}
					var datasourceuuid_forc = valuess[0];
					var datasourcepropername_forc = valuess[1];
					iddatasourcetypeJsonStrings.push(
						'{\n' +
						'"datasourcetypeUuid": "' + jsonEscape(datasourceuuid_forc) + '",\n' +
						'"relaventProperyName": "' + jsonEscape(datasourcepropername_forc) + '"\n' +
						'}'
					);
				} else if (tag.Name.indexOf("sourceId") != -1) {
					var valuess = tag.Value.split(',');
					if (valuess.length != 2) {
						continue;
					}
					var datasourceuuid_forc = valuess[0];
					var datasourcepropername_forc = valuess[1];
					sourceiddatasourcetypeJsonStrings.push(
						'{\n' +
						'"datasourcetypeUuid": "' + jsonEscape(datasourceuuid_forc) + '",\n' +
						'"relaventProperyName": "' + jsonEscape(datasourcepropername_forc) + '"\n' +
						'}'
					);
				} else if (tag.Name.indexOf("targetId") != -1) {
					var valuess = tag.Value.split(',');
					if (valuess.length != 2) {
						continue;
					}
					var datasourceuuid_forc = valuess[0];
					var datasourcepropername_forc = valuess[1];
					targetiddatasourcetypeJsonStrings.push(
						'{\n' +
						'"datasourcetypeUuid": "' + jsonEscape(datasourceuuid_forc) + '",\n' +
						'"relaventProperyName": "' + jsonEscape(datasourcepropername_forc) + '"\n' +
						'}'
					);
				}
			}
			relationAttributesJsonStrings.push(
				'{\n' +
				'"name": "sourceId",\n' +
				'"type": "string",\n' +
				'"description": "the source node id of the relation",\n' +
				'"datasources": [\n' + sourceiddatasourcetypeJsonStrings.join(',\n') + '\n]\n' +
				'}'
			);
			relationAttributesJsonStrings.push(
				'{\n' +
				'"name": "targetId",\n' +
				'"type": "string",\n' +
				'"description": "the target node id of the relation",\n' +
				'"datasources": [\n' + targetiddatasourcetypeJsonStrings.join(',\n') + '\n]\n' +
				'}'
			);
			relationAttributesJsonStrings.push(
				'{\n' +
				'"name": "id",\n' +
				'"type": "string",\n' +
				'"description": "the target node id of the relation",\n' +
				'"datasources": [\n' + iddatasourcetypeJsonStrings.join(',\n') + '\n]\n' +
				'}'
			);
		}

		// we add some basic attributes for relationships
		// sourceId, sourceName, targetId, targetName, relationName
		if (conn.Type == "Association") {
			if (!hassourceId) {
				relationAttributesJsonStrings.push(
					'{\n' +
					'"name": "sourceId",\n' +
					'"type": "string",\n' +
					'"description": "the source node id of the relation"\n' + 
					'}'
				);
			}
			if (!hastargetId) {
				relationAttributesJsonStrings.push(
					'{\n' +
					'"name": "targetId",\n' +
					'"type": "string",\n' +
					'"description": "the target node id of the relation"\n' + 
					'}'
				);
			}
			if (!hasrelationName) {
				relationAttributesJsonStrings.push(
					'{\n' +
					'"name": "name",\n' +
					'"type": "string",\n' +
					'"description": "the edge name of the relation"\n' + 
					'}'
				);
			}
			if (!hasId) {
				relationAttributesJsonStrings.push(
					'{\n' +
					'"name": "id",\n' +
					'"type": "string",\n' +
					'"description": "the edge id of the relation"\n' + 
					'}'
				);
			}
		}
		
		var relationTypesJsonStringPrep = '{\n"type": "' + jsonEscape(relType) + '"\n';

		if (conn.Alias != "") {
			relationTypesJsonStringPrep += ',"alias": "' + jsonEscape(conn.Alias) + '"\n';
		}
		if (conn.Notes != "") {
			relationTypesJsonStringPrep += ',"description": "' + jsonEscape(conn.Notes) + '"\n';
		}
		if (source.Name != "") {
			relationTypesJsonStringPrep += ',"sourceNodeType": "' + jsonEscape(source.Name) + '"\n';
		}
		if (conn.ClientEnd.Role != "") {
			relationTypesJsonStringPrep += ',"sourceNodeRole": "' + jsonEscape(conn.ClientEnd.Role) + '"\n';
		}
		if (conn.ClientEnd.Cardinality != "") {
			relationTypesJsonStringPrep += ',"sourceNodeMultiplicity": "' + jsonEscape(conn.ClientEnd.Cardinality) + '"\n';
		}
		if (conn.ClientEnd.RoleNote != "") {
			relationTypesJsonStringPrep += ',"sourceNodeRoleDescription": "' + jsonEscape(conn.ClientEnd.RoleNote) + '"\n';
		}
		if (target.Name != "") {
			relationTypesJsonStringPrep += ',"targetNodeType": "' + jsonEscape(target.Name) + '"\n';
		}
		if (conn.SupplierEnd.Role != "") {
			relationTypesJsonStringPrep += ',"targetNodeRole": "' + jsonEscape(conn.SupplierEnd.Role) + '"\n';
		}
		if (conn.SupplierEnd.Cardinality != "") {
			relationTypesJsonStringPrep += ',"targetNodeMultiplicity": "' + jsonEscape(conn.SupplierEnd.Cardinality) + '"\n';
		}
		if (conn.SupplierEnd.RoleNote != "") {
			relationTypesJsonStringPrep += ',"targetNodeRoleDescription": "' + jsonEscape(conn.SupplierEnd.RoleNote) + '"\n';
		}
		if (relationAttributesJsonStrings.join(',\n') != "") {
			relationTypesJsonStringPrep += ',"attributes": [\n' + relationAttributesJsonStrings.join(',\n') + '\n]\n';
		}
		relationTypesJsonStringPrep += '}';
        relationTypesJsonStrings.push(relationTypesJsonStringPrep);
    }
	
    // Manually construct the final JSON string
    var finalJsonString = '{\n';
    finalJsonString += '"nodeTypes": [\n' + nodeTypesJsonStrings.join(',\n') + '\n],\n';
    finalJsonString += '"relationTypes": [\n' + relationTypesJsonStrings.join(',\n') + '\n]\n';
	finalJsonString += '}';	
	return finalJsonString;
}

function getTag(ele, tagName) {
	var tags as EA.Collection;
	tags = ele.TaggedValuesEx;
	var tag = tags.GetByName(tagName);
	if (tag == null) return "";
	return tag;
}

function main() {
    // Show the script output window
    Repository.EnsureOutputVisible("Script");
    Session.Output("Starting diagram to JSON export...");

    // Get the currently open diagram
    var currentDiagram as EA.Diagram;
    currentDiagram = Repository.GetCurrentDiagram();

    if (!currentDiagram) {
        Session.Output("Error: No diagram is currently open. Aborting script.");
        return;
    }

    Session.Output("Processing diagram: " + currentDiagram.Name);

    // --- FILE SELECTION ---
	var now = new Date();
	var timestamp = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() +
					"_" + now.getHours() + "_" + now.getMinutes() + "_" + now.getSeconds();
    var defaultFilename = currentDiagram.Name.replace(/[\s\/\\:*?"<>|]/g, '_') + "_" + timestamp + ".json";
    projectPath += "schema\\";
	var filePath = projectPath + defaultFilename;
    Session.Output("filePath:" + filePath);
    if (filePath == "") {
        Session.Output("User cancelled file selection. Aborting script.");
        return;
    }

    Session.Output("User selected file path: " + filePath);
    var finalJsonString = extractFromDiagram(currentDiagram);

    // --- FILE WRITING (UTF-8 WITHOUT BOM) ---
    try {
        // Step 1: Write the text to a temporary text stream, which includes the BOM
        var textStream = new ActiveXObject("ADODB.Stream");
        textStream.Type = 2; // Text
        textStream.Charset = "utf-8";
        textStream.Open();
        textStream.WriteText(finalJsonString);
        
        // Step 2: Move the stream's position past the 3-byte BOM
        textStream.Position = 3; 
        
        // Step 3: Copy the BOM-less content to a second, binary stream
        var binaryStream = new ActiveXObject("ADODB.Stream");
        binaryStream.Type = 1; // Binary
        binaryStream.Open();
        textStream.CopyTo(binaryStream);

        // Step 4: Save the clean binary stream to the file
        binaryStream.SaveToFile(filePath, 2); // 2 = Create or Overwrite
        
        // Clean up
        textStream.Close();
        binaryStream.Close();
        
        Session.Output("=======================================");
        Session.Output("Success! UTF-8 (no BOM) JSON data written to file.");
    }
    catch(e) {
        Session.Output("=======================================");
        Session.Output("ERROR: Could not write to file. " + e.message);
        if (e.message.indexOf("ADODB.Stream") > -1) {
             Session.Output("This script requires the ADO components to be available on the system.");
        }
    }
}
var projectPath = "D:\\projects\\riskassessment\\attackcases\\";
main();