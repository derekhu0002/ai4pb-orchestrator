!INC Local Scripts.EAConstants-JScript
!INC JSON-Parser

/*
 * Script Name: EA Class Diagram to STIX
 * Purpose: Export an EA Class Diagram (created by stix_to_ea.js) back to a STIX bundle JSON.
 * Date: 2026-01-09
 */

function main() {
    Repository.EnsureOutputVisible("Script");
    Repository.EnableUIUpdates(false);
    Session.Output("Starting STIX Export...");

    // --- 1. GET SELECTED PACKAGE ---
    var currentPkg = Repository.GetTreeSelectedPackage();
    if (currentPkg == null) {
        Session.Output("ERROR: Please select the Package containing the STIX diagram.");
        Repository.EnableUIUpdates(true);
        return;
    }
    
    Session.Output("Exporting from Package: " + currentPkg.Name);

    // --- 2. PREPARE DATA STRUCTURES ---
    var bundle = {
        "type": "bundle",
        "id": "bundle--" + GenerateGUID(),
        "spec_version": "2.1",
        "objects": []
    };

    // Helper map to find Elements by ID for linking relationships
    // elementID -> alias (stix id)
    var elementIdToStixId = {};

    // --- 3. PROCESS NODES (Classes that are not Association Classes) ---
    // In our import script, Association Classes were given Stereotype "relationship".
    // Regular nodes have stereotypes like "indicator", "malware", etc.
    
    var elements = currentPkg.Elements;
    var assocClassMap = {}; // AssociationClassElementID -> ConnectorID (or just presence)
    
    // We first need to identify which classes are Association Classes to separate them.
    // However, we can just filter by Stereotype "relationship" as per our import convention.
    
    for (var i = 0; i < elements.Count; i++) {
        var el = elements.GetAt(i);
        
        // Skip Association Classes for now, we process them with Connectors
        if (el.Stereotype == "relationship") {
            continue;
        }
        
        if (el.Type != "Class") {
            continue;
        }

        var obj = {};
        
        // Use Stereotype as type, Alias as id (restore from import)
        obj.type = el.Stereotype || "unknown";
        obj.id = el.Alias || ("generated--" + el.ElementGUID);
        
        // Recover attributes
        var attrs = el.Attributes;
        for (var j = 0; j < attrs.Count; j++) {
            var attr = attrs.GetAt(j);
            var val = getAttributeValue(attr);
            obj[attr.Name] = parseValue(val);
        }
        
        // Ensure strictly required fields if missing/overwritten
        // (The import script put everything in attributes, so strictly speaking they should be there)
        // But let's make sure 'type' and 'id' match the top level if they exist in attributes
        if (!obj.type) obj.type = el.Stereotype;
        if (!obj.id) obj.id = el.Alias;

        bundle.objects.push(obj);
        elementIdToStixId[el.ElementID] = obj.id;
        
        Session.Output("Exported Node: " + el.Name + " (" + obj.type + ")");
    }

    // --- 4. PROCESS RELATIONSHIPS ---
    // Iterate connectors to find relationships and their Association Classes
    var connectors = currentPkg.Connectors;
    for (var i = 0; i < connectors.Count; i++) {
        var con = connectors.GetAt(i);
        
        // We only care about connectors that have an Association Class 
        // OR connectors that look like STIX relationships.
        // The import script always created an Association Class.
        
        if (con.AssociationClass > 0) {
            var assocClassEl = Repository.GetElementByID(con.AssociationClass);
            if (assocClassEl) {
                var relObj = {};
                
                // Base properties from Association Class
                relObj.type = "relationship"; // Fixed for STIX relationships
                relObj.id = assocClassEl.Alias;
                
                // Recover attributes from Association Class
                var attrs = assocClassEl.Attributes;
                for (var j = 0; j < attrs.Count; j++) {
                    var attr = attrs.GetAt(j);
                    var val = getAttributeValue(attr);
                    relObj[attr.Name] = parseValue(val);
                }
                
                // Ensure refs are correct
                var sourceStixId = elementIdToStixId[con.ClientID];
                var targetStixId = elementIdToStixId[con.SupplierID];
                
                if (sourceStixId) relObj.source_ref = sourceStixId;
                if (targetStixId) relObj.target_ref = targetStixId;
                
                relObj.relationship_type = con.Name;
                
                bundle.objects.push(relObj);
                Session.Output("Exported Relationship: " + relObj.id);
            }
        }
    }

    // --- 5. SAVE JSON FILE ---
    var now = new Date();
    var timestamp = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() +
                    "_" + now.getHours() + "-" + now.getMinutes() + "-" + now.getSeconds();
    
    // Save to same directory as input usually, or a specific export folder
    var outputPath = "d:\\projects\\EA-automation-scripts\\test\\stix_export_" + timestamp + ".json";
    
    saveFile(outputPath, JSON.stringify(bundle, null, 4));
    
    Session.Output("Done. Exported to: " + outputPath);
    Repository.EnableUIUpdates(true);
}

function getAttributeValue(attr) {
    // In import script:
    // if (valueStr.length < 255) attr.Default = valueStr;
    // else attr.Notes = valueStr;
    
    var val = attr.Default;
    if (!val || val === "") {
        val = attr.Notes;
    }
    return val;
}

function parseValue(valStr) {
    if (!valStr) return "";
    
    // Handle lack of .trim() in older JScript
    var trimmed = String(valStr).replace(/^\s+|\s+$/g, '');
    
    // Heuristic: Must start with [ or { and END with ] or }
    if (trimmed.length > 0 && 
       ((trimmed.charAt(0) === '[' && trimmed.charAt(trimmed.length-1) === ']') || 
        (trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length-1) === '}'))) {
        
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            // Not valid JSON, keep as string
            // Example: "[file:hashes.'SHA-256' = 'abc123']"
        }
    }
    return valStr;
}

function saveFile(filePath, content) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; // adTypeText
        stream.Charset = "UTF-8";
        stream.Open();
        stream.WriteText(content);
        stream.SaveToFile(filePath, 2); // 2 = adSaveCreateOverWrite
        stream.Close();
    } catch (e) {
        Session.Output("ERROR: Could not save file. " + e.message);
    }
}

function GenerateGUID() {
    // Simple GUID generator for the bundle ID if needed
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

main();
