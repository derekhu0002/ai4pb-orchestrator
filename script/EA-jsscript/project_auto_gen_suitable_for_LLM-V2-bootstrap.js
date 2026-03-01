!INC Local Scripts.EAConstants-JScript

/*
 * Script Name: project_auto_gen_suitable_for_LLM-V2-bootstrap
 * Purpose: One-time script you keep inside each EA model.
 *          It loads and runs the shared exporter from a central file path,
 *          so future updates only happen in one place.
 */

var SHARED_SCRIPT_PATH = "D:\\projects\\AI-For-Project-Building\\script\\EA-jsscript\\project_auto_gen_suitable_for_LLM-V2.js";
var SHARED_SCRIPT_LOCAL_FALLBACK_PATH = "D:\\projects\\AI-For-Project-Building\\script\\EA-jsscript\\project_auto_gen_suitable_for_LLM-V2.js";
var PROJECT_CONFIG_FILE_PATH = ""; // Optional absolute path. If empty, use <projectPath>\\.aicodingconfig

// Per-model config (edit only this block for each EA repository)
var EA_AUTOGEN_CONFIG = {
	projectPath: "",
	needCode: false,
	needContent: true,
	needdoc: false,
	needallmaintenace: false,
	needbrowserlocation: true,
	maintenacetype: "forllm" // forllm | forproject
};

function trimString(s) {
	if (s == null) {
		return "";
	}
	return ("" + s).replace(/^\s+|\s+$/g, "");
}

function getConnectionProperty(connectionString, keyName) {
	if (connectionString == null || connectionString == "") {
		return "";
	}
	var pattern = new RegExp("(?:^|;)\\s*" + keyName + "\\s*=\\s*([^;]+)", "i");
	var m = ("" + connectionString).match(pattern);
	if (m && m.length > 1) {
		return trimString(m[1]);
	}
	return "";
}

function stripWrappedQuotes(s) {
	var v = trimString(s);
	if (v.length >= 2) {
		var first = v.charAt(0);
		var last = v.charAt(v.length - 1);
		if ((first == '"' && last == '"') || (first == "'" && last == "'")) {
			return v.substring(1, v.length - 1);
		}
	}
	return v;
}

function resolveModelFilePathFromConnectionString() {
	var conn = "";
	try {
		conn = "" + Repository.ConnectionString;
	} catch (e) {
		return "";
	}

	if (conn == "") {
		return "";
	}

	// EA file-based repositories often use Data Source=... in connection string.
	var dataSource = getConnectionProperty(conn, "Data Source");
	if (dataSource == "") {
		dataSource = getConnectionProperty(conn, "DataSource");
	}
	if (dataSource == "") {
		dataSource = getConnectionProperty(conn, "DBQ");
	}
	if (dataSource != "") {
		return stripWrappedQuotes(dataSource);
	}

	// Fallback: if connection string itself is a direct file path.
	var direct = stripWrappedQuotes(conn);
	if (/^[A-Za-z]:\\/.test(direct) || /^\\\\/.test(direct)) {
		return direct;
	}

	return "";
}

function resolveProjectPathFromCurrentModel() {
	var modelFilePath = resolveModelFilePathFromConnectionString();
	if (modelFilePath == "") {
		return "";
	}
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		var parentFolder = fso.GetParentFolderName(modelFilePath);
		return normalizeProjectPath(parentFolder);
	} catch (e) {
		return "";
	}
}

function normalizeProjectPath(pathValue) {
	if (pathValue == null || pathValue == "") {
		return "";
	}
	var s = "" + pathValue;
	if (s.charAt(s.length - 1) != "\\" && s.charAt(s.length - 1) != "/") {
		s += "\\";
	}
	return s;
}

function getProjectConfigPath() {
	if (PROJECT_CONFIG_FILE_PATH != null && PROJECT_CONFIG_FILE_PATH != "") {
		return PROJECT_CONFIG_FILE_PATH;
	}
	var base = normalizeProjectPath(EA_AUTOGEN_CONFIG.projectPath);
	if (base == "") {
		return "";
	}
	return base + ".aicodingconfig";
}

function readTextFileUtf8(filePath) {
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		if (!fso.FileExists(filePath)) {
			Session.Output("WARN: File not found: " + filePath);
			return "";
		}

		var stream = new ActiveXObject("ADODB.Stream");
		stream.Type = 2; // Text
		stream.Charset = "utf-8";
		stream.Open();
		stream.LoadFromFile(filePath);
		var text = stream.ReadText();
		stream.Close();
		return text;
	} catch (e) {
		Session.Output("ERROR: Failed reading shared script. " + e.message);
		return "";
	}
}

function fileExists(filePath) {
	try {
		var fso = new ActiveXObject("Scripting.FileSystemObject");
		return fso.FileExists(filePath);
	} catch (e) {
		return false;
	}
}

function getLocalSharedScriptCandidates() {
	var candidates = [];

	if (SHARED_SCRIPT_LOCAL_FALLBACK_PATH != null && trimString(SHARED_SCRIPT_LOCAL_FALLBACK_PATH) != "") {
		candidates.push(trimString(SHARED_SCRIPT_LOCAL_FALLBACK_PATH));
	}

	if (EA_AUTOGEN_CONFIG.projectPath != null && trimString(EA_AUTOGEN_CONFIG.projectPath) != "") {
		var projectRoot = normalizeProjectPath(EA_AUTOGEN_CONFIG.projectPath);
		candidates.push(projectRoot + "script\\EA-jsscript\\project_auto_gen_suitable_for_LLM-V2.js");
		candidates.push(projectRoot + "tools\\EA-jsscript\\project_auto_gen_suitable_for_LLM-V2.js");
	}

	var unique = [];
	for (var i = 0; i < candidates.length; i++) {
		var p = candidates[i];
		var exists = false;
		for (var j = 0; j < unique.length; j++) {
			if (unique[j].toLowerCase() == p.toLowerCase()) {
				exists = true;
				break;
			}
		}
		if (!exists) {
			unique.push(p);
		}
	}

	return unique;
}

function tryLoadSharedScriptFromLocalCandidates() {
	var candidates = getLocalSharedScriptCandidates();
	for (var i = 0; i < candidates.length; i++) {
		var localPath = candidates[i];
		if (fileExists(localPath)) {
			Session.Output("Trying local shared script: " + localPath);
			var text = readTextFileUtf8(localPath);
			if (text != "") {
				Session.Output("Loaded shared script from local path.");
				return text;
			}
		}
	}
	return "";
}

function readSharedScriptText(sourcePathOrUrl) {
	if (sourcePathOrUrl != null && trimString(sourcePathOrUrl) != "" && !/^https?:\/\//i.test(sourcePathOrUrl)) {
		Session.Output("Trying primary local shared script: " + sourcePathOrUrl);
		var primary = readTextFileUtf8(sourcePathOrUrl);
		if (primary != "") {
			Session.Output("Loaded shared script from primary local path.");
			return primary;
		}
	}

	var localFallback = tryLoadSharedScriptFromLocalCandidates();
	if (localFallback != "") {
		return localFallback;
	}

	Session.Output("ERROR: Failed to load shared script from local paths.");
	return "";
}

function parseAiCodingConfig(text) {
	if (text == null) {
		return null;
	}

	var raw = "" + text;
	raw = raw.replace(/^\uFEFF/, "");
	raw = raw.replace(/\/\*[\s\S]*?\*\//g, "");
	raw = raw.replace(/^\s*\/\/.*$/gm, "");
	raw = raw.replace(/^\s+|\s+$/g, "");

	if (raw == "") {
		return null;
	}

	var objectLiteral = raw;
	var assignedMatch = raw.match(/EA_AUTOGEN_CONFIG\s*=\s*([\s\S]*?)\s*;?\s*$/);
	if (assignedMatch && assignedMatch.length > 1) {
		objectLiteral = assignedMatch[1];
	}

	try {
		var parsed = eval("(" + objectLiteral + ")");
		if (parsed == null) {
			return null;
		}
		if (typeof parsed.EA_AUTOGEN_CONFIG != "undefined") {
			return parsed.EA_AUTOGEN_CONFIG;
		}
		if (typeof parsed.eaAutogenConfig != "undefined") {
			return parsed.eaAutogenConfig;
		}
		return parsed;
	} catch (e) {
		Session.Output("WARN: .aicodingconfig parse failed. " + e.message);
		return null;
	}
}

function applyExternalConfig(overrides) {
	if (overrides == null) {
		return;
	}

	if (typeof overrides.sharedScriptPath != "undefined") SHARED_SCRIPT_PATH = overrides.sharedScriptPath;
	if (typeof overrides.sharedScriptLocalFallbackPath != "undefined") SHARED_SCRIPT_LOCAL_FALLBACK_PATH = overrides.sharedScriptLocalFallbackPath;

	if (typeof overrides.needCode != "undefined") EA_AUTOGEN_CONFIG.needCode = overrides.needCode;
	if (typeof overrides.needContent != "undefined") EA_AUTOGEN_CONFIG.needContent = overrides.needContent;
	if (typeof overrides.needdoc != "undefined") EA_AUTOGEN_CONFIG.needdoc = overrides.needdoc;
	if (typeof overrides.needallmaintenace != "undefined") EA_AUTOGEN_CONFIG.needallmaintenace = overrides.needallmaintenace;
	if (typeof overrides.needbrowserlocation != "undefined") EA_AUTOGEN_CONFIG.needbrowserlocation = overrides.needbrowserlocation;
	if (typeof overrides.maintenacetype != "undefined") EA_AUTOGEN_CONFIG.maintenacetype = overrides.maintenacetype;

	EA_AUTOGEN_CONFIG.projectPath = normalizeProjectPath(EA_AUTOGEN_CONFIG.projectPath);
}

function sanitizeForEval(scriptText) {
	if (scriptText == null || scriptText == "") {
		return "";
	}

	// !INC is an EA preprocessor directive and is invalid inside eval().
	// Remove include lines so the loaded script can be parsed at runtime.
	var normalized = scriptText.replace(/^\s*!INC[^\r\n]*[\r\n]*/gm, "");

	// EA supports "var x as EA.Type;" in scripts, but eval() does not.
	// Convert to plain JScript declarations.
	normalized = normalized.replace(/\bvar\s+([A-Za-z_][A-Za-z0-9_]*)\s+as\s+[A-Za-z_][A-Za-z0-9_\.]*/g, "var $1");

	return normalized;
}

function mainBootstrap() {
	Repository.EnsureOutputVisible("Script");
	Session.Output("Loading shared exporter script...");
	Session.Output("Path: " + SHARED_SCRIPT_PATH);

	var autoProjectPath = resolveProjectPathFromCurrentModel();
	if (autoProjectPath != "") {
		EA_AUTOGEN_CONFIG.projectPath = autoProjectPath;
		Session.Output("Auto projectPath from EA model: " + EA_AUTOGEN_CONFIG.projectPath);
	}

	EA_AUTOGEN_CONFIG.projectPath = normalizeProjectPath(EA_AUTOGEN_CONFIG.projectPath);

	var configFilePath = getProjectConfigPath();
	if (configFilePath != "") {
		Session.Output("Config path: " + configFilePath);
		var configText = readTextFileUtf8(configFilePath);
		if (configText != "") {
			var fileConfig = parseAiCodingConfig(configText);
			if (fileConfig != null) {
				applyExternalConfig(fileConfig);
				Session.Output("Loaded config from .aicodingconfig");
			}
		}
	}

	var sharedCode = readSharedScriptText(SHARED_SCRIPT_PATH);
	if (sharedCode == "") {
		Session.Output("Aborted: shared script content is empty.");
		return;
	}

	sharedCode = sanitizeForEval(sharedCode);

	try {
		eval(sharedCode);
	} catch (e) {
		Session.Output("ERROR: Shared script execution failed. " + e.message);
	}
}

mainBootstrap();
