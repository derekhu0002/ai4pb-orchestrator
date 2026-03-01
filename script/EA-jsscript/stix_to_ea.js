!INC Local Scripts.EAConstants-JScript
!INC JSON-Parser

/*
 * Script Name: STIX to EA Class Diagram
 * Purpose: Translate a STIX bundle JSON object into an EA Class Diagram.
 *          Relationships are converted to Association Classes.
 * Date: 2026-01-09
 */

function main() {
    Repository.EnsureOutputVisible("Script");
    Repository.EnableUIUpdates(false);
    Session.Output("Starting STIX Import...");

    // --- 1. CONFIGURATION ---
    // You can change this path or implement a file dialog
    var filePath = "d:\\projects\\EA-automation-scripts\\test\\test.json";
    
    // --- 2. READ THE JSON FILE ---
    var jsonString = readFile(filePath);
    if (!jsonString) {
        Repository.EnableUIUpdates(true);
        return;
    }

    // --- 3. PARSE THE JSON DATA ---
    var bundleData;
    try {
        bundleData = JSON.parse(jsonString);
    } catch (e) {
        Session.Output("ERROR: Invalid JSON in file. " + e.message);
        Repository.EnableUIUpdates(true);
        return;
    }

    if (bundleData.type !== "bundle") {
        Session.Output("WARNING: The root object is not a STIX 'bundle'. Continuing anyway...");
    }

    // --- 4. PREPARE THE EA MODEL ---
    var parentPkg = Repository.GetTreeSelectedPackage();
    if (parentPkg == null) {
        Session.Output("ERROR: Please select a Package in the tree view to create the diagram in.");
        Repository.EnableUIUpdates(true);
        return;
    }

    var now = new Date();
    var timestamp = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() +
                    "_" + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
    var pkgName = "STIX Bundle " + timestamp;
    
    Session.Output("Creating Package: " + pkgName);
    var newPkg = parentPkg.Packages.AddNew(pkgName, "Package");
    newPkg.Update();
    parentPkg.Packages.Refresh();

    var diagramName = "STIX Diagram " + timestamp;
    var newDiagram = newPkg.Diagrams.AddNew(diagramName, "Logical");
    newDiagram.Update();
    newPkg.Diagrams.Refresh();

    // --- 5. PROCESS OBJECTS (FIRST PASS: NODES) ---
    var objects = bundleData.objects || [];
    var nodeMap = {}; // Map stix_id -> ea_element
    var relationships = [];

    Session.Output("Processing " + objects.length + " objects...");

    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        
        if (obj.type === "relationship") {
            relationships.push(obj);
            continue;
        }

        // Determine Name
        var name = obj.name || obj.type + " " + (obj.id.split("--")[1] || "").substring(0, 8);
        
        var element = newPkg.Elements.AddNew(name, "Class");
        element.Alias = obj.id; // Store full STIX ID in Alias
        element.Notes = obj.description || "";
        element.Stereotype = obj.type; // Use STIX type as Stereotype
        element.Update();

        // Add Attributes
        addAttributes(element, obj);
        
        // Add to Diagram
        var diaObj = newDiagram.DiagramObjects.AddNew("l=0;r=0;t=0;b=0;", "");
        diaObj.ElementID = element.ElementID;
        diaObj.Update();

        nodeMap[obj.id] = element;
        Session.Output("Created Node: " + name + " (" + obj.type + ")");
    }

    newPkg.Elements.Refresh();
    newDiagram.DiagramObjects.Refresh();

    // --- 6. PROCESS RELATIONSHIPS (SECOND PASS) ---
    Session.Output("Processing " + relationships.length + " relationships...");

    for (var i = 0; i < relationships.length; i++) {
        var rel = relationships[i];
        var sourceId = rel.source_ref;
        var targetId = rel.target_ref;

        var sourceElem = nodeMap[sourceId];
        var targetElem = nodeMap[targetId];

        if (sourceElem && targetElem) {
            // Create Association Connector
            var connector = sourceElem.Connectors.AddNew(rel.relationship_type, "Association");
            connector.SupplierID = targetElem.ElementID;
            connector.Name = rel.relationship_type;
            connector.Notes = rel.description || "";
            connector.Update();

            // Create Association Class to store properties
            var assocClassName = rel.relationship_type + " details";
            var assocClass = newPkg.Elements.AddNew(assocClassName, "Class");
            assocClass.Alias = rel.id;
            assocClass.Notes = "Association Class for " + rel.id;
            assocClass.Stereotype = "relationship";
            assocClass.Update();

            // Add attributes to Association Class
            addAttributes(assocClass, rel);

            // Link Class to Connector (Make it an Association Class)
            try {
                assocClass.CreateAssociationClass(connector.ConnectorID);
                assocClass.Update();
                Session.Output("Created Association Class for relationship: " + rel.id);
            } catch (e) {
                Session.Output("Error linking Association Class: " + e.message);
            }
            
            // Add Association Class to Diagram (optional, but good for visibility)
            // Ideally place it near the midpoint, but auto-layout is hard.
            // Just adding it will put it at default position.
            // Note: In EA, Association Classes often show up attached to the link automatically if on diagram? 
            // Or you need to add the class object to diagram.
            var diaObjClass = newDiagram.DiagramObjects.AddNew("l=0;r=0;t=0;b=0;", "");
            diaObjClass.ElementID = assocClass.ElementID;
            diaObjClass.Update();

        } else {
            Session.Output("WARNING: Could not find source or target for relationship " + rel.id);
        }
    }

    // --- 7. FINISH ---
    newPkg.Elements.Refresh();
    newDiagram.DiagramObjects.Refresh();
    
    // Auto Layout Diagram (Optional, simple layout)
    // var projectInterface = Repository.GetProjectInterface();
    // projectInterface.LayoutDiagramEx(newDiagram.DiagramGUID, 0, 4, 20, 20, true);

    Session.Output("Done.");
    Repository.EnableUIUpdates(true);
}

function readFile(filePath) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; // adTypeText
        stream.Charset = "UTF-8";
        stream.Open();
        stream.LoadFromFile(filePath);
        var content = stream.ReadText();
        stream.Close();
        Session.Output("Read file: " + filePath);
        return content;
    } catch (e) {
        Session.Output("ERROR: Could not read file '" + filePath + "'. " + e.message);
        return null;
    }
}

function addAttributes(element, jsonObject) {
    // Iterate over keys and add as attributes
    // Skip complex objects/arrays for now or convert to string
    for (var key in jsonObject) {
        // Safe check for hasOwnProperty to avoid "Object doesn't support this property or method"
        var hasProperty = false;
        try {
            hasProperty = Object.prototype.hasOwnProperty.call(jsonObject, key);
        } catch (e) {
            // Fallback if safe check fails, though unlikely for plain objects
            hasProperty = true;
        }

        if (hasProperty) {
            // Skip internal keys or ones we handled differently if needed
            // But user asked to store "all of the properties"
            
            var value = jsonObject[key];
            var type = "String";
            var valueStr = "";

            if (key === "type" || key === "id" || key === "source_ref" || key === "target_ref") {
                // We might skip these as they are structural, but storing them is safe.
            }

            if (typeof value === 'object' && value !== null) {
                // Simplify object/array to string
                try {
                    if (typeof JSON !== 'undefined' && JSON.stringify) {
                        valueStr = JSON.stringify(value);
                    } else {
                        valueStr = "[Object]"; // Fallback if JSON.stringify is missing
                    }
                } catch (e) {
                    valueStr = "[Error converting object]";
                }
            } else {
                valueStr = String(value);
            }

            try {
                // Ensure key is a valid name. Replace invalid chars if necessary.
                // EA Attribute names are usually flexible but let's be safe.
                var cleanKey = key.replace(/[^\w\d_]/g, "_");
                
                var attr = element.Attributes.AddNew(cleanKey, type);
                // DefaultValue has a limit, Notes is better for long content
                if (valueStr.length < 255) {
                    attr.Default = valueStr;
                } else {
                    attr.Notes = valueStr;
                }
                attr.Update();
            } catch (ex) {
                Session.Output("WARNING: Could not add attribute '" + key + "': " + ex.message);
            }
        }
    }
    element.Attributes.Refresh();
}

main();
