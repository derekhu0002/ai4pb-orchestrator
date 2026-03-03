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
    if (str == null) return "";
    // Escape backslashes, double quotes, and control characters for valid JSON
    return str.replace(/\\/g, '\\\\')
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
			
			if (!needallmaintenace) {
				// include only the active ones.
				if (task.Status != "Active") {
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

function extractFromDiagram(currentDiagram, loadedElements) {
	// Refactored for LLM readability
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
		
		if (ele.AssociationClassConnectorID != 0) continue;
		
		var uniqueName = ele.Name + " (" + ele.ElementID + ")";

		var isloaded = false;
		if (loadedElements[ele.ElementGUID] == ele.ElementGUID) {
			isloaded = true;
		}
		
		if (isloaded) {
			nodeTypesJsonStrings.push(
				'{\n' +
				'"name": "' + jsonEscape(uniqueName) + '"\n' +
				'}'
			);
		} else {
			loadedElements[ele.ElementGUID] = ele.ElementGUID;
			
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
			
			var mainbehavior = "";
			var mainbehavior_relativepath = "";
			var decision_condition = "";
			var decision_condition_relativepath = "";
			var prompts = "";
			var prompts_relativepath = "";
			var opers as EA.Collection;
			opers = ele.MethodsEx;
			
			for (var j = 0; j < opers.Count; j++) {
				var oper as EA.Method;
				oper = opers.GetAt(j);
				if (oper.Name == "mainbehavior" && needCode) {
					mainbehavior_relativepath = oper.Notes;
					if (mainbehavior_relativepath != "") {
						var mainbehavior_fullpath = projectPath + mainbehavior_relativepath;
						mainbehavior = getCode(mainbehavior_fullpath, true);
					}
					continue;
				}
				if (oper.Name == "decision_condition" && needCode) {
					decision_condition_relativepath = oper.Notes;
					if (decision_condition_relativepath != "") {
						var decision_condition_fullpath = projectPath + decision_condition_relativepath;
						decision_condition = getCode(decision_condition_fullpath, true);
					}
					continue;
				}
				if (oper.Name == "prompts" && needCode) {
					prompts_relativepath = oper.Notes;
					if (prompts_relativepath != "") {
						var prompts_fullpath = projectPath + prompts_relativepath;
						prompts = getCode(prompts_fullpath, true);
					}
					continue;
				}
			}
				
			var opersJsonStrings = [];
			for (var j = 0; j < opers.Count; j++) {
				var oper as EA.Method;
				oper = opers.GetAt(j);
				
				if (oper.Name == "mainbehavior") {
					continue;
				}
				if (oper.Name == "decision_condition") {
					continue;
				}
				if (oper.Name == "prompts") {
					continue;
				}
				var params as EA.Collection;
				params = oper.Parameters;
				var paramsJsonStrings = [];
				for (var k = 0; k < params.Count; k++) {
					var param as EA.Parameter;
					param = params.GetAt(k);
					paramsJsonStrings.push(
						'{\n' +
						'"name": "' + jsonEscape(param.Name) + '",\n' +
						'"description": "' + jsonEscape(param.Notes) + '",\n' +
						'"Type": "' + jsonEscape(param.Type) + '"\n' +
						'}'
					);
				}
				var operbehavior = "";
				if (oper.Code == "") {
					if (mainbehavior != "") {
						operbehavior = "//check in the node's mainbehavior";
					}
					if (decision_condition != "") {
						operbehavior = "//check in the node's decision_condition";
					}
					if (prompts != "") {
						operbehavior = "//check in the node's prompts";
					}
				} else {
					operbehavior = oper.Code;
				}
				
				opersJsonStrings.push(
					'{\n' +
					'"name": "' + jsonEscape(oper.Name) + '",\n' +
					'"description": "' + jsonEscape(oper.Notes) + '"\n'+
					'}'
				);
			}
			
			var subdiags as EA.Collection;
			subdiags = ele.Diagrams;
			var subfinalJsonStrings = [];
			for (var j = 0; j < subdiags.Count; j++) {
				var subdiag as EA.Diagram;
				subdiag = subdiags.GetAt(j);
				subfinalJsonString = extractFromDiagram(subdiag, loadedElements);
				if (subfinalJsonString != "") {
					subfinalJsonStrings.push(subfinalJsonString);
				}
			}

			// START Refactoring Node JSON
			var finalnodetype = '{\n"name": "' + jsonEscape(uniqueName) + '"\n';
			// REMOVED id

			if (ele.Alias != "") {
				finalnodetype += ',"alias": "' + jsonEscape(ele.Alias) + '"\n';
			}
			
			if (ele.ClassifierName != "") {
				finalnodetype += ',"classifier": "' + jsonEscape(ele.ClassifierName) + '"\n';
			}
			
			if (ele.StereotypeEx != "") {
				finalnodetype += ',"type": "' + jsonEscape(ele.StereotypeEx) + '"\n';
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
				var pdfFileName = ele.Name.replace(/[\\s\\/\\:*?"<>|]/g, '_') + "_" + ele.ElementID + ".pdf";
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
			
			var submmmm = subfinalJsonStrings.join(',\n');
			if (submmmm != "") {
				finalnodetype += ',"subgraphs": [\n' + submmmm + '\n]\n';
			}

			var projectinfo = getProjectinfo(ele);
			if (projectinfo != "") {
				finalnodetype += ',"project_info": ' + projectinfo + '\n';
			}

			finalnodetype += '}';
			nodeTypesJsonStrings.push(finalnodetype);
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
		
		var sourceName = source.Name + " (" + source.ElementID + ")";
		var targetName = target.Name + " (" + target.ElementID + ")";
		
		var statement = jsonEscape(sourceName) + " --(" + jsonEscape(relType) + ")--> " + jsonEscape(targetName);
		var relatointypejss = '{\n"statement":"' + statement + '"\n';
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
				var pdfFileName = assclass.Name.replace(/[\\s\\/\\:*?"<>|]/g, '_') + "_" + ele.ElementID + ".pdf";
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
		} else {
			if (currentDiagram.Type == "Collaboration") {
				continue;
			}			
		}

		if (conn.StereotypeEx != "") {
			relatointypejss += ',"super_type": "' + jsonEscape(conn.StereotypeEx) + '"\n';
		}
		
		var relattrsss = relationAttributesJsonStrings.join(',\n');
		if (relattrsss != "") {
			relatointypejss += ',"attributes": [\n' + relattrsss + '\n]\n';
		}
		
		relatointypejss += 
			',"source":"' + jsonEscape(sourceName) + '"\n' +
			',"target":"' + jsonEscape(targetName) + '"\n' + 
            '}';
        relationTypesJsonStrings.push(relatointypejss);
    }

    // Manually construct the final JSON string
	var nooooooorr = nodeTypesJsonStrings.join(',\n');
	if (nooooooorr == "") return "";
	
	// Simplified Subgraph Wrapper
	var finalJsonString = '{\n"subgraph_name": "' + jsonEscape(currentDiagram.Name) + '"\n';
	if (currentDiagram.Notes != "") {
		finalJsonString += ',"description": "' + jsonEscape(currentDiagram.Notes) + '"\n';
	}
    finalJsonString += ',"nodes": [\n' + nooooooorr + '\n]\n';
	var relationtypessssjss = relationTypesJsonStrings.join(',\n');
	if (relationtypessssjss != "") {
		finalJsonString += ',"relations": [\n' + relationTypesJsonStrings.join(',\n') + '\n]\n';
	}
    finalJsonString += '}';
	return finalJsonString;
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

    finalJsonString += '"graph": ' + extractFromDiagram(currentDiagram, loadedElements) + '\n';
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
var projectPath = "D:\\projects\\BIG-THING\\";
var needCode = false;
var needContent = true;
var needdoc = true;
var needallmaintenace = false;
main();