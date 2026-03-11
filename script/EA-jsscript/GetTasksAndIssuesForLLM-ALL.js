!INC Local Scripts.EAConstants-JScript

/*
 * 主函数
 * 这个脚本会运行一个预定义的、带参数的模型搜索，并将结果导出为Markdown文件。
 */
function main() {
    // 这是你在步骤1中创建的搜索的名称
    var searchName = "MyToDoIssueSearch";

    // 提示用户输入搜索参数
    var searchTerm = '10000d';// 你可以根据需要修改这个提示和默认值

    try {
        // 运行已定义的模型搜索，并传入参数
        // 返回一个包含结果的XML字符串
        var xmlResult = runSearchXml(searchName, searchTerm);

        // 将XML结果转换为任务数组
        var taskArray = xmlToJson(xmlResult);

        if (taskArray.length > 0) {
            var filePath = getDefaultOutputPath();
            // 将Markdown数据写入文件
            writeToFile(toMarkdownString(taskArray), filePath);
            Session.Output("成功将 " + taskArray.length + " 个任务导出到: " + filePath);
        } else {
            Session.Output("搜索 '" + searchName + "' 没有返回任何结果。");
        }
    } catch (e) {
        Session.Output("执行脚本时发生错误: " + e.description);
        Session.Output("请确保名为 '" + searchName + "' 的模型搜索已正确创建，且脚本运行环境支持模型搜索API。");
    }
}

/*
 * 先尝试模型搜索，失败后回退到SQL查询
 * @param searchName - 模型搜索名称
 * @param searchTerm - 搜索参数(例如 30d)
 * @return 搜索结果XML字符串
 */
function runSearchXml(searchName, searchTerm) {
    try {
        return runModelSearch(searchName, searchTerm);
    } catch (modelSearchError) {
        Session.Output("RunModelSearch不可用，回退到SQLQuery。原因: " + modelSearchError.description);
        return runSqlFallbackSearch(searchTerm);
    }
}

/*
 * 执行模型搜索，并兼容不同EA版本暴露的Automation API
 * @param searchName - 模型搜索名称
 * @param searchTerm - 搜索参数
 * @return 搜索结果XML字符串
 */
function runModelSearch(searchName, searchTerm) {
    var xmlResult = "";
    var lastError = null;

    try {
        xmlResult = Repository.RunModelSearch(searchName, searchTerm, "", "");
        if (xmlResult && xmlResult.length > 0) {
            return xmlResult;
        }
    } catch (e1) {
        lastError = e1;
    }

    try {
        xmlResult = Repository.RunModelSearch(searchName, searchTerm);
        if (xmlResult && xmlResult.length > 0) {
            return xmlResult;
        }
    } catch (e2) {
        lastError = e2;
    }

    try {
        var projectInterface = Repository.GetProjectInterface();
        xmlResult = projectInterface.RunModelSearch(searchName, searchTerm, "", "");
        if (xmlResult && xmlResult.length > 0) {
            return xmlResult;
        }
    } catch (e3) {
        lastError = e3;
    }

    try {
        var projectInterface2 = Repository.GetProjectInterface();
        xmlResult = projectInterface2.RunModelSearch(searchName, searchTerm);
        if (xmlResult && xmlResult.length > 0) {
            return xmlResult;
        }
    } catch (e4) {
        lastError = e4;
    }

    if (lastError) {
        throw new Error("无法调用RunModelSearch: " + lastError.description);
    }

    throw new Error("无法调用RunModelSearch，未返回任何结果。");
}

/*
 * 使用SQLQuery作为回退路径
 * @param searchTerm - 搜索参数(例如 30d)
 * @return SQLQuery返回的XML字符串
 */
function runSqlFallbackSearch(searchTerm) {
    var sql = "SELECT t_object.Name as [Element], t_objectproblems.Object_ID, t_objectproblems.Problem, "
        + "t_objectproblems.ProblemNotes, t_objectproblems.ResolverNotes, t_objectproblems.Status, "
        + "t_objectproblems.Priority, t_objectproblems.ResolvedBy, t_objectproblems.ProblemType, "
        + "'t_objectproblems' as CLASSTABLE "
        + "FROM t_objectproblems, t_object "
        + "WHERE (t_objectproblems.ProblemType = 'ToDo' OR t_objectproblems.ProblemType = 'Issue') "
        + "AND t_objectproblems.Object_ID = t_object.Object_ID "
        + "AND t_objectproblems.ResolvedBy = 'llm' "
        + "ORDER BY t_objectproblems.ResolvedBy ASC";

    Session.Output("SQLQuery回退已启用：为兼容当前数据库驱动，已跳过日期宏过滤条件。");
    return Repository.SQLQuery(sql);
}

/*
 * 解析搜索参数中的天数，支持 30d / 30 / 空值
 * @param searchTerm - 搜索参数
 * @return 天数(正整数)
 */
function parseDaysFromSearchTerm(searchTerm) {
    if (!searchTerm) {
        return 10000;
    }

    var match = ("" + searchTerm).match(/(\d+)/);
    if (!match || !match[1]) {
        return 10000;
    }

    var days = parseInt(match[1], 10);
    if (isNaN(days) || days <= 0) {
        return 10000;
    }

    return days;
}

/*
 * 获取默认输出路径: 相对于EA文件所在目录的 ./design/tasks/
 * @return 输出Markdown文件的完整路径
 */
function getDefaultOutputPath() {
    var fso = new ActiveXObject("Scripting.FileSystemObject");
    var eaFilePath = Repository.ConnectionString;

    if (!eaFilePath) {
        throw new Error("无法获取EA文件路径(Repository.ConnectionString为空)。");
    }

    var eaFolder = fso.GetParentFolderName(eaFilePath);
    var outputFolder = fso.BuildPath(eaFolder, "design");
    outputFolder = fso.BuildPath(outputFolder, "tasks");

    ensureFolderExists(fso, outputFolder);

    return fso.BuildPath(outputFolder, "taskandissues_for_LLM.md");
}

/*
 * 递归创建目录(如果不存在)
 * @param fso - FileSystemObject实例
 * @param folderPath - 目标目录
 */
function ensureFolderExists(fso, folderPath) {
    if (fso.FolderExists(folderPath)) {
        return;
    }

    var parentFolder = fso.GetParentFolderName(folderPath);
    if (parentFolder && !fso.FolderExists(parentFolder)) {
        ensureFolderExists(fso, parentFolder);
    }

    fso.CreateFolder(folderPath);
}

/*
 * 将SQL查询返回的XML字符串转换为JSON数组
 * @param xml - 从模型搜索API返回的XML字符串
 * @return 一个包含任务对象的数组
 */
function xmlToJson(xml) {
    var tasks = [];
    var xmlDoc = new ActiveXObject("MSXML2.DOMDocument");
    xmlDoc.async = false;
    xmlDoc.loadXML(xml);

    // 检查XML是否加载成功且包含数据
    if (xmlDoc.parseError.errorCode != 0) {
        throw new Error("无效的XML结果: " + xmlDoc.parseError.reason);
    }

    var rows = xmlDoc.selectNodes("//Row");

    for (var i = 0; i < rows.length; i++) {
        var row = rows.item(i);
        var objectIdText = getNodeValueByAliases(row, ["Object_ID", "OBJECT_ID", "ObjectId", "ea_guid"]);
        var objectIdNumber = parseInt(objectIdText, 10);

        var task = {
            "Name": getNodeValueByAliases(row, ["Element", "Name", "OBJECT_NAME"]),
            "Problem": getNodeValueByAliases(row, ["Problem", "DESCRIPTION", "Issue"]),
            "ProblemNotes": getNodeValueByAliases(row, ["ProblemNotes", "PROBLEMNOTES", "Notes"]),
            "ResolverNotes": getNodeValueByAliases(row, ["ResolverNotes", "RESOLVERNOTES", "Resolution"]),
            "ProblemType": getNodeValueByAliases(row, ["ProblemType", "PROBLEMTYPE", "Type"]),
            "Status": getNodeValueByAliases(row, ["Status", "STATUS"]),
            "Object_ID": isNaN(objectIdNumber) ? null : objectIdNumber
        };
        tasks.push(task);
    }

    return tasks;
}

/*
 * 从XML节点中安全地获取文本值
 * @param parentNode - 父节点
 * @param childNodeName - 子节点的名称
 * @return 子节点的文本值，如果不存在则返回空字符串
 */
function getNodeValue(parentNode, childNodeName) {
    var node = parentNode.selectSingleNode(childNodeName);
    if (node && node.text !== undefined) {
        return node.text;
    }

    var expectedName = ("" + childNodeName).toLowerCase();
    var children = parentNode.childNodes;
    for (var i = 0; i < children.length; i++) {
        var child = children.item(i);
        if (child && child.nodeName && ("" + child.nodeName).toLowerCase() == expectedName) {
            return child.text ? child.text : "";
        }
    }

    return "";
}

/*
 * 按多个候选列名读取XML节点值
 * @param parentNode - 父节点
 * @param aliases - 候选列名数组
 * @return 匹配到的第一个非空值
 */
function getNodeValueByAliases(parentNode, aliases) {
    for (var i = 0; i < aliases.length; i++) {
        var value = getNodeValue(parentNode, aliases[i]);
        if (value !== "") {
            return value;
        }
    }
    return "";
}

/*
 * 将内容写入到指定的文件路径
 * @param content - 要写入文件的字符串内容
 * @param filePath - 文件的完整路径
 */
function writeToFile(content, filePath) {
    try {
        var stream = new ActiveXObject("ADODB.Stream");
        stream.Type = 2; // adTypeText
        stream.Charset = "utf-8";
        stream.Open();
        stream.WriteText(content);
        stream.SaveToFile(filePath, 2); // adSaveCreateOverWrite
        stream.Close();
    } catch (e) {
        // 回退: 某些环境下若ADODB不可用，使用FSO写入
        var fso = new ActiveXObject("Scripting.FileSystemObject");
        var file = fso.CreateTextFile(filePath, true); // true表示覆盖已存在的文件
        file.Write(content);
        file.Close();
    }
}

/*
 * 将任务数组序列化为Markdown表格
 * @param tasks - 任务对象数组
 * @return Markdown字符串
 */
function toMarkdownString(tasks) {
    var lines = [];
    lines.push("# Task And Issues For LLM");
    lines.push("");
    lines.push("| Name | Problem | ProblemNotes | ResolverNotes | ProblemType | Status | Object_ID |");
    lines.push("| --- | --- | --- | --- | --- | --- | --- |");

    for (var i = 0; i < tasks.length; i++) {
        var task = tasks[i];
        lines.push("| "
            + toMarkdownCell(task.Name) + " | "
            + toMarkdownCell(task.Problem) + " | "
            + toMarkdownCell(task.ProblemNotes) + " | "
            + toMarkdownCell(task.ResolverNotes) + " | "
            + toMarkdownCell(task.ProblemType) + " | "
            + toMarkdownCell(task.Status) + " | "
            + toMarkdownCell(task.Object_ID) + " |");
    }

    return lines.join("\r\n") + "\r\n";
}

/*
 * 转义Markdown单元格内容
 * @param value - 单元格值
 * @return 可安全写入Markdown表格的文本
 */
function toMarkdownCell(value) {
    if (value === null || value === undefined) {
        return "";
    }

    var s = String(value);
    s = s.replace(/\|/g, "\\|");
    s = s.replace(/\r\n/g, "<br>");
    s = s.replace(/\n/g, "<br>");
    s = s.replace(/\r/g, "<br>");
    return s;
}

/*
 * JScript兼容的JSON序列化
 * @param value - 任意值
 * @return JSON字符串
 */
function toJsonString(value) {
    if (value === null) {
        return "null";
    }

    var t = typeof value;
    if (t == "number") {
        return isFinite(value) ? String(value) : "null";
    }
    if (t == "boolean") {
        return value ? "true" : "false";
    }
    if (t == "string") {
        return '"' + escapeJsonString(value) + '"';
    }

    if (value instanceof Array) {
        var items = [];
        for (var i = 0; i < value.length; i++) {
            items.push(toJsonString(value[i]));
        }
        return "[" + items.join(",") + "]";
    }

    if (t == "object") {
        var props = [];
        for (var key in value) {
            if (value.hasOwnProperty(key)) {
                props.push('"' + escapeJsonString(key) + '":' + toJsonString(value[key]));
            }
        }
        return "{" + props.join(",") + "}";
    }

    return "null";
}

/*
 * 转义JSON字符串中的特殊字符
 * @param text - 原始字符串
 * @return 转义后的字符串
 */
function escapeJsonString(text) {
    var s = String(text);
    s = s.replace(/\\/g, "\\\\");
    s = s.replace(/\"/g, "\\\"");
    s = s.replace(/\r/g, "\\r");
    s = s.replace(/\n/g, "\\n");
    s = s.replace(/\t/g, "\\t");
    s = s.replace(/\f/g, "\\f");
    s = s.replace(/\x08/g, "\\b");
    return s;
}

// 运行主函数
main();