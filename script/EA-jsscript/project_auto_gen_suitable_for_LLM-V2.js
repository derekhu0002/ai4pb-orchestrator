!INC Local Scripts.EAConstants-JScript

/*
 * Script Name: Export Diagram to JSON File
 * Author: Your Name
 * Purpose: Exports node and relation types of the current diagram to a user-selected JSON file.
 *          Compatible with older JScript engines without a native JSON object.
 * Date: 2025-07-12 	
 */

// Helper function to escape strings for JSON
function jsonEscape(str) {
    if (str == null || typeof str === "undefined") return "";
    // Ensure it's a string before calling replace
    var s = String(str);
    // Escape backslashes, double quotes, and control characters for valid JSON
    return s.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t');
}

function getCode(mainbehavior_fullpath) {
	var sanitizedpath = mainbehavior_fullpath.replace(/\\/g, "\\\\");
    var fileContent = "Relative File Path:" + sanitizedpath + "\n\n"; // Default return value
	
    try {
        // Use ADODB.Stream for robust character set handling
        var stream = new ActiveXObject("ADODB.Stream");

        // 1. Specify the character set of the source file BEFORE opening it.
        //    This is the most important step.
        stream.Charset = "UTF-8";

        // 2. Open the stream object
        stream.Open();

        // 3. Load the entire file from the specified path
        //    Note: We need to ensure the file exists first to avoid an error.
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        if (fso.FileExists(sanitizedpath)) {
            stream.LoadFromFile(sanitizedpath);

            // 4. Read the entire stream as text. Because the Charset was set to UTF-8,
            //    it will be decoded correctly.
            fileContent += stream.ReadText();
        } else {
            Session.Output("Error: File not found at path: " + sanitizedpath);
        }

        // 5. Close the stream to release resources
        stream.Close();

    } catch (e) {
        // Catch any other potential errors (e.g., permission denied)
        Session.Output("An unexpected error occurred in getcode(): " + e.message);
        Session.Output("File Path: " + mainbehavior_fullpath);
        fileContent = ""; // Ensure we return empty on error
    }

    // 6. Return the correctly decoded file content
    return fileContent;
}

function getDate(date) {
	var dd = new Date(date);
	var timestamp = dd.getFullYear() + "-" + (dd.getMonth() + 1) + "-" + dd.getDate();
	return timestamp;
}

function getPackagePath(packageID) {
    var path = "";
    var currentPkgID = packageID;
    var maxDepth = 20; // Prevent infinite loops
    var depth = 0;
    
    while (currentPkgID != 0 && depth < maxDepth) {
        var pkg as EA.Package;
        pkg = Repository.GetPackageByID(currentPkgID);
        if (pkg != null) {
            if (path == "") {
                path = pkg.Name;
            } else {
                path = pkg.Name + "/" + path;
            }
            currentPkgID = pkg.ParentID;
        } else {
            break;
        }
        depth++;
    }
    return path;
}

function getElementChainPath(elementID) {
	var path = "";
	var currentElementID = elementID;
	var maxDepth = 50; // Prevent infinite loops
	var depth = 0;

	while (currentElementID != 0 && depth < maxDepth) {
		var currentElement as EA.Element;
		currentElement = Repository.GetElementByID(currentElementID);
		if (currentElement == null) {
			break;
		}

		if (path == "") {
			path = currentElement.Name;
		} else {
			path = currentElement.Name + "/" + path;
		}

		currentElementID = currentElement.ParentID;
		depth++;
	}

	return path;
}

function getElementBrowserPath(ele) {
	var pkgPath = getPackagePath(ele.PackageID);
	var parentElementPath = "";

	if (ele.ParentID != 0) {
		parentElementPath = getElementChainPath(ele.ParentID);
	}

	var fullPath = pkgPath;
	if (parentElementPath != "") {
		if (fullPath == "") {
			fullPath = parentElementPath;
		} else {
			fullPath += "/" + parentElementPath;
		}
	}

	if (ele.Name != "") {
		if (fullPath == "") {
			fullPath = ele.Name;
		} else {
			fullPath += "/" + ele.Name;
		}
	}

	return fullPath;
}

function getDiagramBrowserPath(diagram) {
	var pkgPath = getPackagePath(diagram.PackageID);
	var fullPath = pkgPath;

	if (diagram.ParentID != 0) {
		var parentElementPath = getElementChainPath(diagram.ParentID);
		if (parentElementPath != "") {
			if (fullPath == "") {
				fullPath = parentElementPath;
			} else {
				fullPath += "/" + parentElementPath;
			}
		}
	}

	if (diagram.Name != "") {
		if (fullPath == "") {
			fullPath = diagram.Name;
		} else {
			fullPath += "/" + diagram.Name;
		}
	}

	return fullPath;
}

function getProjectinfo(tele) {
    // Refactored for LLM readability
	var resall as EA.Collection;
	resall = tele.Resources;
	var stringresall = [];
	for (var i = 0; i < resall.Count; i++) {
		var ra as EA.Resource;
		ra = resall.GetAt(i);
		var sress = '{\n"owner": "' + jsonEscape(ra.Name) + '",\n' + 
			'"role": "' + jsonEscape(ra.Role) + '"\n';
		
		if(ra.Notes != "") {
			sress += ',"description": "' + jsonEscape(ra.Notes) + '"\n';
		}
		
		sress += ',"start_date": "' + jsonEscape(getDate(ra.DateStart)) + '",\n' +
			'"end_date": "' + jsonEscape(getDate(ra.DateEnd)) + '",\n' + 
			'"percent_complete": ' + ra.PercentComplete + ',\n' +
			'"expected_hours": ' + ra.ExpectedHours + '\n';
		
		if(ra.History != "") {
			sress += ',"history": "' + jsonEscape(ra.History) + '"\n';
		}
		
		sress +='}';
		
		stringresall.push(sress);
	}

	var tasks as EA.Collection;
	tasks = tele.Issues;
	var stringtasks = [];
	var projectSummury = null;
	// @ArchitectureID: 1193
	function shouldIncludeTaskByMaintenance(statusValue) {
		var status = (statusValue == null) ? "" : ("" + statusValue).toLowerCase();
		if (needallmaintenace == "All") {
			return true;
		}
		if (needallmaintenace == "ActiveAndVerified") {
			return status == "active" || status == "verified";
		}
		// Default and fallback behavior: only active tasks.
		return status == "active";
	}

	for (var i = 0; i < tasks.Count; i++) {
		var task as EA.Issue;
		task = tasks.GetAt(i);
		
		if (task.Name == "summury") {
			projectSummury = '{\n' +
							'"notes": "' + jsonEscape(task.Notes) + '",\n' +
							'"started": "' + jsonEscape(getDate(task.DateReported)) + '",\n' +
							'"deadline": "' + jsonEscape(getDate(task.DateResolved)) + '",\n' +
							'"priority": "' + jsonEscape(task.Priority) + '",\n' +
							'"assigned_to": "' + jsonEscape(task.Resolver) + '",\n' +
							'"progress": "' + jsonEscape(task.ResolverNotes) + '"\n' +
							'}';
		} else {
			
			if (!shouldIncludeTaskByMaintenance(task.Status)) {
				continue;
			}
			
			if (maintenacetype == "forllm") {
				if (task.Resolver != "llm") {
					continue;
				}
			} else {
				if (task.Resolver == "llm") {
					continue;
				}
			}
			
			var statata = '{\n"name": "' + jsonEscape(task.Name) + '"\n';
			
			if (task.Type != "") {
				statata += ',"type": "' + jsonEscape(task.Type) + '"\n';
			}
			
			if (task.Status != "") {
				statata += ',"status": "' + jsonEscape(task.Status) + '"\n';
			}
			
			if (task.Notes != "") {
				statata += ',"description": "' + jsonEscape(task.Notes) + '"\n';
			}
			
			statata += ',"start_date": "' + jsonEscape(getDate(task.DateReported)) + '"\n';
			
			if (task.Status == "Complete") {
				statata += ',"completion_date": "' + jsonEscape(getDate(task.DateResolved)) + '"\n';
			} else {
				statata += ',"due_date": "' + jsonEscape(getDate(task.DateResolved)) + '"\n';
			}

			if (task.Reporter != "") {
				statata += ',"reporter": "' + jsonEscape(task.Reporter) + '"\n';
			}

			statata += ',"priority": "' + jsonEscape(task.Priority) + '",\n' +
				'"assigned_to": "' + jsonEscape(task.Resolver) + '"\n';
			
			if (task.ResolverNotes != "") {
				statata += ',"progress": "' + jsonEscape(task.ResolverNotes) + '"\n';
			}
			
			statata += '}';
			stringtasks.push(statata);
		}
	}
	var lllll = stringresall.join(',\n');
	var tttt = stringtasks.join(',\n');
	
	if ((lllll == "") && (projectSummury == null) && (tttt == "")) {
		return "";
	}
	
	var finalJsonString = "{\n";
	
	if (projectSummury != null) {
		finalJsonString = '"summary":' + projectSummury + '\n';
	}

	if (lllll != "") {
		if (projectSummury != null) { finalJsonString += ','; }
		finalJsonString += '"resources": [\n' + lllll + '\n]\n';
	}

	if (tttt != "") {
		if (lllll != "") { finalJsonString += ','; }
		finalJsonString += '"tasks": [\n' + tttt + '\n]\n';
	}
	
    finalJsonString += '}';	
	return finalJsonString;
}

function saveRtfAsPdf(rtfContent, pdfFileName, baseFolderPath) {
    var pdfFilePath = "";
    var fso = null;
    var wordApp = null;
    var tempRtfPath = "";

    try {
        fso = new ActiveXObject("Scripting.FileSystemObject");
        var pdfsDir = fso.BuildPath(baseFolderPath, "pdfs");
        if (!fso.FolderExists(pdfsDir)) {
            fso.CreateFolder(pdfsDir);
        }
        
        var finalPdfPath = fso.BuildPath(pdfsDir, pdfFileName);

        // Get the path to the system's temporary folder
        var tempFolder = fso.GetSpecialFolder(2); // 2 = TemporaryFolder
        tempRtfPath = fso.BuildPath(tempFolder, fso.GetTempName() + ".rtf");

        // Step 1: Write the RTF content to a temporary file.
        // The RTF string from EA might have double-escaped backslashes. Let's correct it.
        var correctedRtf = rtfContent.replace(/\\\\/g, "\\");
        var tempFile = fso.CreateTextFile(tempRtfPath, true, false); // Unicode = false
        tempFile.Write(correctedRtf);
        tempFile.Close();
        
        // Step 2: Use Word Automation to convert RTF to PDF.
        // This requires MS Word to be installed.
        wordApp = new ActiveXObject("Word.Application");
        wordApp.Visible = false;
        
        var doc = wordApp.Documents.Open(tempRtfPath);
        
        // wdFormatPDF = 17
        doc.SaveAs2(finalPdfPath, 17);
        doc.Close(0); // 0 = wdDoNotSaveChanges
        
        pdfFilePath = pdfFileName; // Success, return the relative filename
    } catch (e) {
        Session.Output("ERROR converting RTF to PDF for " + pdfFileName + ": " + e.message);
        Session.Output("Please ensure Microsoft Word is installed and configured correctly.");
        pdfFilePath = ""; // Indicate failure
    } finally {
        // Step 3: Clean up.
        if (wordApp) {
            wordApp.Quit();
        }
        if (fso && tempRtfPath != "" && fso.FileExists(tempRtfPath)) {
            fso.DeleteFile(tempRtfPath);
        }
    }
    
    return pdfFilePath;
}

var globalElements = {};
var globalRelationships = {};
var globalViews = [];

function extractFromDiagram(currentDiagram) {
    var viewName = currentDiagram.Name;
    var viewNotes = currentDiagram.Notes;
	
    var includedElements = [];
    var includedRelationships = [];

    // Process all diagram objects (nodes)
    var diaObjs as EA.Collection;
    diaObjs = currentDiagram.DiagramObjects;

    for (var i = 0; i < diaObjs.Count; i++) {
        var diaObj as EA.DiagramObject;
        diaObj = diaObjs.GetAt(i);
        var ele as EA.Element;
        ele = Repository.GetElementByID(diaObj.ElementID);
		
		if (ele.AssociationClassConnectorID != 0) continue;
		
		var id = ele.ElementID;
		includedElements.push('"' + jsonEscape(id) + '"');

		if (typeof globalElements[id] === "undefined") {
			globalElements[id] = "PROCESSING"; // Prevent infinite recursion
			Session.Output("Processing:" + ele.Name + " id:" + ele.ElementID);
			var attrs as EA.Collection;
			attrs = ele.AttributesEx;
			var attributesJsonStrings = [];
			
			for (var j = 0; j < attrs.Count; j++) {
				var attr as EA.Attribute;
				attr = attrs.GetAt(j);
				
				if (attr.Alias == "notpub") {
					continue;
				}
				if ((attr.Alias == "content") && needContent) {
					var content = "";
					if (attr.Notes != "") {
						content = getCode(projectPath + attr.Notes);
					}
					if (content != "" && needContent) {
						attributesJsonStrings.push(
							'{\n' +
							'"name": "' + jsonEscape(attr.Name) + '",\n' +
							'"content": "' + jsonEscape(content) + '"\n' +
							'}'
						);
					}
				} else {
					var attbbbjss = '{\n"name": "' + jsonEscape(attr.Name) + '"\n';
					if (attr.Notes != "") {
						attbbbjss += ',"description": "' + jsonEscape(attr.Notes) + '"\n';
					}
					if (attr.Default != "") {
						attbbbjss += ',"value": "' + jsonEscape(attr.Default) + '"\n';
					}
					attbbbjss += '}';
					attributesJsonStrings.push(attbbbjss);
				}
			}
			
			var mainbehavior_relativepath = "";
			var decision_condition_relativepath = "";
			var prompts_relativepath = "";
			var opers as EA.Collection;
			opers = ele.MethodsEx;
			
			for (var j = 0; j < opers.Count; j++) {
				var oper as EA.Method;
				oper = opers.GetAt(j);
				if (oper.Name == "mainbehavior" && needCode) {
					mainbehavior_relativepath = oper.Notes;
					continue;
				}
				if (oper.Name == "decision_condition" && needCode) {
					decision_condition_relativepath = oper.Notes;
					continue;
				}
				if (oper.Name == "prompts" && needCode) {
					prompts_relativepath = oper.Notes;
					continue;
				}
			}
				
			var opersJsonStrings = [];
			for (var j = 0; j < opers.Count; j++) {
				var oper as EA.Method;
				oper = opers.GetAt(j);
				
				if (oper.Name == "mainbehavior" || oper.Name == "decision_condition" || oper.Name == "prompts") {
					continue;
				}
				
				opersJsonStrings.push(
					'{\n' +
					'"name": "' + jsonEscape(oper.Name) + '",\n' +
					'"description": "' + jsonEscape(oper.Notes) + '"\n'+
					'}'
				);
			}
			
			var subDiagramJsonStrings = [];
			var subdiags as EA.Collection;
			subdiags = ele.Diagrams;
			for (var j = 0; j < subdiags.Count; j++) {
				var subdiag as EA.Diagram;
				subdiag = subdiags.GetAt(j);
				subDiagramJsonStrings.push(
					'{\n' +
					'"view_id": "' + jsonEscape(subdiag.DiagramID) + '",\n' +
					'"view_name": "' + jsonEscape(subdiag.Name) + '"\n' +
					'}'
				);
				extractFromDiagram(subdiag);
			}

			// START Refactoring Node JSON
			var finalnodetype = '{\n"id": "' + jsonEscape(id) + '",\n';
			finalnodetype += '"name": "' + jsonEscape(ele.Name) + '"\n';

			if (ele.Alias != "") {
				finalnodetype += ',"alias": "' + jsonEscape(ele.Alias) + '"\n';
			}
			
			if (ele.ClassifierName != "") {
				finalnodetype += ',"classifier": "' + jsonEscape(ele.ClassifierName) + '"\n';
			}
			
			if (ele.StereotypeEx != "") {
				finalnodetype += ',"type": "' + jsonEscape(ele.StereotypeEx) + '"\n';
			} else {
				finalnodetype += ',"type": "' + jsonEscape(ele.Type) + '"\n';
			}

			if (needbrowserlocation) {
				var elementBrowserPath = getElementBrowserPath(ele);
				if (elementBrowserPath != "") {
					finalnodetype += ',"browser_path": "' + jsonEscape(elementBrowserPath) + '"\n';
				}
			}

			if (ele.Status == "Implemented") {
				finalnodetype += ',"status": "' + jsonEscape(ele.Status) + '"\n';
			}
			
			if (ele.Notes != "") {
				finalnodetype += ',"description": "' + jsonEscape(ele.Notes) + '"\n';
			}
			
			var linkedDoc = null;
			if (needdoc) {
				linkedDoc = ele.GetLinkedDocument();
			}
			
			if (linkedDoc && linkedDoc.substring(0, 5) == "{\\rtf" && !isRtfEmpty(linkedDoc)) {
				var pdfFileName = ele.Name.replace(/[\s\/\\:*?"<>|]/g, '_') + "_" + ele.ElementID + ".pdf";
				var savedFileName = saveRtfAsPdf(linkedDoc, pdfFileName, projectPath);
				
				if (savedFileName != "") {
					finalnodetype += ',"document": "pdfs/' + jsonEscape(savedFileName) + '"\n';
				}
			}

			Array.prototype.push.apply(attributesJsonStrings, opersJsonStrings);

			var attrsjsstr = attributesJsonStrings.join(',\n');
			if (attrsjsstr != "") {
				finalnodetype += ',"attributes": [\n' + attrsjsstr + '\n]\n';
			}
			
			if (mainbehavior_relativepath != "") {
				finalnodetype += ',"code_file": "' + jsonEscape(mainbehavior_relativepath) + '"\n';
			}
			
			if (decision_condition_relativepath != "") {
				finalnodetype += ',"condition_file": "' + jsonEscape(decision_condition_relativepath) + '"\n';
			}
			
			if (prompts_relativepath != "") {
				finalnodetype += ',"prompts_file": "' + jsonEscape(prompts_relativepath) + '"\n';
			}

			var projectinfo = getProjectinfo(ele);
			if (projectinfo != "") {
				finalnodetype += ',"project_info": ' + projectinfo + '\n';
			}

			if (subDiagramJsonStrings.length > 0) {
				finalnodetype += ',"subdiagram_views": [\n' + subDiagramJsonStrings.join(',\n') + '\n]\n';
			}

			finalnodetype += '}';
			globalElements[id] = finalnodetype;
		}
    }

    // Process all diagram links (relations)
    var diaLinks as EA.Collection;
    diaLinks = currentDiagram.DiagramLinks;

    for (var k = 0; k < diaLinks.Count; k++) {
        var link as EA.DiagramLink;
        link = diaLinks.GetAt(k);	
		
		if (link.IsHidden) { continue;}
		if (link.Geometry == "") { continue;}
        var conn as EA.Connector;
        conn = Repository.GetConnectorByID(link.ConnectorID);
		
		var connId = conn.ConnectorID;
		includedRelationships.push('"' + jsonEscape(connId) + '"');

		if (typeof globalRelationships[connId] === "undefined") {
			var source as EA.Element;
			source = Repository.GetElementByID(conn.ClientID);
			var target as EA.Element;
			target = Repository.GetElementByID(conn.SupplierID);

			var relType = (conn.Name) ? conn.Name : conn.Stereotype;
			
			if (relType == "") {
				relType = jsonEscape(conn.Type);
			}
			
			if (relType == "Aggregation") {
				relType = "aggregates";
			}
			
			var statement = jsonEscape(source.Name) + " --(" + jsonEscape(relType) + ")--> " + jsonEscape(target.Name);
			var relatointypejss = '{\n"id":"' + jsonEscape(connId) + '"\n';
			relatointypejss += ',"statement":"' + statement + '"\n';
			relatointypejss += ',"name":"' + jsonEscape(relType) + '"\n';
			
			var relationAttributesJsonStrings = [];
			var connassnotes = "";

			if (conn.AssociationClass != null) {
				var assclass as EA.Element;
				assclass = conn.AssociationClass;
				connassnotes = assclass.Notes;
				var linkedDoc = null;
				if (needdoc) {
					linkedDoc = assclass.GetLinkedDocument();
				}
				
				if (linkedDoc && linkedDoc.substring(0, 5) == "{\\rtf" && !isRtfEmpty(linkedDoc)) {
					var pdfFileName = assclass.Name.replace(/[\s\/\\:*?"<>|]/g, '_') + "_" + assclass.ElementID + ".pdf";
					var savedFileName = saveRtfAsPdf(linkedDoc, pdfFileName, projectPath);
					
					if (savedFileName != "") {
						relatointypejss += ',"document": "pdfs/' + jsonEscape(savedFileName) + '"\n';
					}
				}
				var relAttrs as EA.Collection;
				relAttrs = assclass.AttributesEx;
				for (var l = 0; l < relAttrs.Count; l++) {
					var relAttr as EA.Attribute;
					relAttr = relAttrs.GetAt(l);
					relationAttributesJsonStrings.push(
						'{\n' +
						'"name": "' + jsonEscape(relAttr.Name) + '",\n' +
						'"description": "' + jsonEscape(relAttr.Notes) + '"\n' +
						'}'
					);
				}
			}

			if ((connassnotes != "") && (conn.Notes != "")) {
				connassnotes = conn.Notes + '\r\n' + connassnotes;
			} else if (conn.Notes != "") {
				connassnotes = conn.Notes;
			}

			if (connassnotes != "") {
				relatointypejss += ',"description": "' + jsonEscape(connassnotes) + '"\n';
			}
			
			if (conn.SequenceNo != "") {
				relatointypejss += ',"sequence": "' + jsonEscape("" + conn.SequenceNo) + '"\n';
			}

			if (conn.StereotypeEx != "") {
				relatointypejss += ',"super_type": "' + jsonEscape(conn.StereotypeEx) + '"\n';
			}
			
			var relattrsss = relationAttributesJsonStrings.join(',\n');
			if (relattrsss != "") {
				relatointypejss += ',"attributes": [\n' + relattrsss + '\n]\n';
			}
			
			relatointypejss += 
				',"source_id":"' + jsonEscape(source.ElementID) + '"\n' +
				',"target_id":"' + jsonEscape(target.ElementID) + '"\n' + 
				',"source_name":"' + jsonEscape(source.Name) + '"\n' +
				',"target_name":"' + jsonEscape(target.Name) + '"\n' + 
				'}';
			globalRelationships[connId] = relatointypejss;
		}
    }

	var viewJson = '{\n"view_id": "' + jsonEscape(currentDiagram.DiagramID) + '",\n';
	viewJson += '"view_name": "' + jsonEscape(viewName) + '"\n';
	Session.Output("Processing diag:" + viewName + " id:" + currentDiagram.DiagramID);
	
	if (needbrowserlocation) {
		var diagramBrowserPath = getDiagramBrowserPath(currentDiagram);
		if (diagramBrowserPath != "") {
			viewJson += ',"browser_path": "' + jsonEscape(diagramBrowserPath) + '"\n';
		}
	}

	if (currentDiagram.ParentID != 0) {
		var parentElement as EA.Element;
		parentElement = Repository.GetElementByID(currentDiagram.ParentID);
		if (parentElement != null) {
			viewJson += ',"parent_element_id": "' + jsonEscape(parentElement.ElementID) + '"\n';
			viewJson += ',"parent_element_name": "' + jsonEscape(parentElement.Name) + '"\n';
		}
	}
	
	if (viewNotes != "") {
		viewJson += ',"description": "' + jsonEscape(viewNotes) + '"\n';
	}
	viewJson += ',"included_elements": [\n' + includedElements.join(',\n') + '\n]\n';
	viewJson += ',"included_relationships": [\n' + includedRelationships.join(',\n') + '\n]\n';
	viewJson += '}';
	
	globalViews.push(viewJson);
}

function isRtfEmpty(rtfContent) {
	//Session.Output(rtfContent);
    // 1. Safety check
    if (rtfContent == null || typeof(rtfContent) == "undefined") {
        return true;
    }
    
    var s = String(rtfContent);

    // 2. KEY FIX: Isolate the Body
    // EA separates the metadata headers (fonts, styles, lists) from the actual content
    // using the "\sectd" command. We discard everything before the last "\sectd".
    var splitIndex = s.lastIndexOf("\\sectd");
    if (splitIndex > -1) {
        s = s.substring(splitIndex);
    } else {
        // Fallback: If no section found, manually strip the noisy groups defined in your input
        // Note: We use [\s\S]*? to match across newlines
        s = s.replace(/\{\\fonttbl[\s\S]*?\}/g, "");
        s = s.replace(/\{\\colortbl[\s\S]*?\}/g, "");
        s = s.replace(/\{\\stylesheet[\s\S]*?\}/g, "");
        // Your input has lists with asterisk: {\*\listtable...}
        s = s.replace(/\{\\\*\\listtable[\s\S]*?\}/g, ""); 
        s = s.replace(/\{\\\*\\listoverridetable[\s\S]*?\}/g, "");
        s = s.replace(/\{\\\*\\revtbl[\s\S]*?\}/g, "");
    }

    // 3. Remove all RTF command words (e.g. \par, \plain, \fs20, \lang1033)
    // Matches backslash followed by alphanumeric characters or hyphen
    s = s.replace(/\\[a-z0-9\-]+/ig, " ");

    // 4. Remove leftover braces and common punctuation inside tags
    s = s.replace(/[{};]/g, " ");

    // 5. Remove newlines and tabs
    s = s.replace(/[\r\n\t]+/g, " ");

    // 6. Trim whitespace (JScript compatible regex)
    s = s.replace(/^\s+|\s+$/g, "");

    // 7. Check if anything is left
    return s.length === 0;
}

function logGlobalRuntimeConfig() {
	Session.Output("==== EA_AUTOGEN Global Vars ====");
	Session.Output("projectPath=" + projectPath);
	Session.Output("needCode=" + needCode);
	Session.Output("needContent=" + needContent);
	Session.Output("needdoc=" + needdoc);
	Session.Output("needallmaintenace=" + needallmaintenace);
	Session.Output("needbrowserlocation=" + needbrowserlocation);
	Session.Output("maintenacetype=" + maintenacetype);
	if (typeof EA_AUTOGEN_CONFIG != "undefined" && EA_AUTOGEN_CONFIG != null) {
		Session.Output("EA_AUTOGEN_CONFIG=present");
	} else {
		Session.Output("EA_AUTOGEN_CONFIG=missing");
	}
	Session.Output("===============================");
}

function main() {
    // Show the script output window
    Repository.EnsureOutputVisible("Script");
    Session.Output("Starting diagram to JSON export...");
	logGlobalRuntimeConfig();

    // Get the currently open diagram
    var currentDiagram as EA.Diagram;
    currentDiagram = Repository.GetCurrentDiagram();

    if (!currentDiagram) {
        Session.Output("Error: No diagram is currently open. Aborting script.");
        return;
    }

    //Session.Output("Processing diagram: " + currentDiagram.Name);

    // --- FILE SELECTION ---
    // Prompt the user to select a save location for the JSON file.
	var now = new Date();
	var timestamp = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() +
					"_" + now.getHours() + "_" + now.getMinutes() + "_" + now.getSeconds();
    var defaultFilename = currentDiagram.Name.replace(/[\s\/\\:*?"<>|]/g, '_') + ".json";
    var filePath = projectPath;
	filePath += "design\\KG\\";
	filePath += defaultFilename;
	Session.Output("filePath:" + filePath);
    // If the user cancelled the dialog, filePath will be empty.
    if (filePath == "") {
        Session.Output("User cancelled file selection. Aborting script.");
        return;
    }
	var loadedElements = {}; // Map to track elements by name
    //Session.Output("User selected file path: " + filePath);
	var ppkg as EA.Package;
	ppkg = Repository.GetPackageByID(currentDiagram.PackageID);
	var ppele as EA.Element;
	ppele = null;
	//Session.Output("currentDiagram.ParentID:" + currentDiagram.ParentID);
	if (currentDiagram.ParentID != 0) {
		ppele = Repository.GetElementByID(currentDiagram.ParentID);
	}
	
	var finalJsonString = '{\n';
	
	if (ppele == null) {
		finalJsonString += '"name": "' + jsonEscape(ppkg.Name) + '",\n';
		finalJsonString += '"description": "' + jsonEscape(ppkg.Notes) + '",\n';
	} else {
		finalJsonString += '"name": "' + jsonEscape(ppele.Name) + '",\n';
		finalJsonString += '"description": "' + jsonEscape(ppele.Notes) + '",\n';
		
		var attrs as EA.Collection;
		attrs = ppele.AttributesEx;
		var attributesJsonStrings = [];
		//Session.Output("ppele attrs: \n");
		for (var j = 0; j < attrs.Count; j++) {
			var attr as EA.Attribute;
			attr = attrs.GetAt(j);
			//Session.Output("attr: \n" + attr.Name);
			if (attr.Alias == "notpub") {
				continue;
			}
			if ((attr.Alias == "content") && needContent) {
				//Session.Output(ppele.Name + " - find content:" + attr.Notes + " needContent:" + needContent);
				var content = "";
				if (attr.Notes != "") {
					content = getCode(projectPath + attr.Notes);
				}
				if (content != "" && needContent) {
					attributesJsonStrings.push(
						'{\n' +
						'"name": "' + jsonEscape(attr.Name) + '",\n' +
						'"content": "' + jsonEscape(content) + '"\n' +
						'}'
					);
				}
			} else {
				var attbbbjss = '{\n"name": "' + jsonEscape(attr.Name) + '"\n';
				if (attr.Notes != "") {
					attbbbjss += ',"description": "' + jsonEscape(attr.Notes) + '"\n';
				}
				if (attr.Default != "") {
					attbbbjss += ',"value": "' + jsonEscape(attr.Default) + '"\n';
				}
				attbbbjss += '}';
				attributesJsonStrings.push(attbbbjss);
			}
		}
		
		var attrsjsstr = attributesJsonStrings.join(',\n');
		if (attrsjsstr != "") {
			finalJsonString += '"attributes": [\n' + attrsjsstr + '\n],\n';
		}
	}

    extractFromDiagram(currentDiagram);

	var elementsArray = [];
	for (var key in globalElements) {
		if (globalElements.hasOwnProperty(key)) {
			elementsArray.push(globalElements[key]);
		}
	}

	var relationshipsArray = [];
	for (var key in globalRelationships) {
		if (globalRelationships.hasOwnProperty(key)) {
			relationshipsArray.push(globalRelationships[key]);
		}
	}

	finalJsonString += '"elements": [\n' + elementsArray.join(',\n') + '\n],\n';
	finalJsonString += '"relationships": [\n' + relationshipsArray.join(',\n') + '\n],\n';
	finalJsonString += '"views": [\n' + globalViews.join(',\n') + '\n]\n';
    finalJsonString += '}';
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

var projectPath = "D:\\projects\\AI4X\\AI4X-Platform\\";
var needCode = false;
var needContent = true;
var needdoc = true;
var needallmaintenace = "onlyActive";
var needbrowserlocation = true;
var maintenacetype = "forproject"; // forllm forproject

if (typeof EA_AUTOGEN_CONFIG != "undefined" && EA_AUTOGEN_CONFIG != null) {
	if (typeof EA_AUTOGEN_CONFIG.projectPath != "undefined") {
		projectPath = EA_AUTOGEN_CONFIG.projectPath;
	}
	if (typeof EA_AUTOGEN_CONFIG.needCode != "undefined") {
		needCode = EA_AUTOGEN_CONFIG.needCode;
	}
	if (typeof EA_AUTOGEN_CONFIG.needContent != "undefined") {
		needContent = EA_AUTOGEN_CONFIG.needContent;
	}
	if (typeof EA_AUTOGEN_CONFIG.needdoc != "undefined") {
		needdoc = EA_AUTOGEN_CONFIG.needdoc;
	}
	if (typeof EA_AUTOGEN_CONFIG.needallmaintenace != "undefined") {
		if (EA_AUTOGEN_CONFIG.needallmaintenace === true) {
			needallmaintenace = "All";
		} else if (EA_AUTOGEN_CONFIG.needallmaintenace === false) {
			needallmaintenace = "onlyActive";
		} else {
			needallmaintenace = EA_AUTOGEN_CONFIG.needallmaintenace;
		}
	}
	if (typeof EA_AUTOGEN_CONFIG.needbrowserlocation != "undefined") {
		needbrowserlocation = EA_AUTOGEN_CONFIG.needbrowserlocation;
	}
	if (typeof EA_AUTOGEN_CONFIG.maintenacetype != "undefined") {
		maintenacetype = EA_AUTOGEN_CONFIG.maintenacetype;
	}
}

if (projectPath != "" && projectPath.charAt(projectPath.length - 1) != "\\" && projectPath.charAt(projectPath.length - 1) != "/") {
	projectPath += "\\";
}

if (!(typeof EA_AUTOGEN_SKIP_MAIN != "undefined" && EA_AUTOGEN_SKIP_MAIN == true)) {
	main();
}