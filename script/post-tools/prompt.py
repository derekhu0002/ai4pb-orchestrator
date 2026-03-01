import json

def getprompt(kg_data, pagemapping_data, question_string):
    """
    Generates a structured prompt for the LLM.
    
    Args:
        kg_data (dict or str): The Knowledge Graph data.
        pagemapping_data (dict or str): The PDF Page Mapping data.
        question_string (str): The user's question.
        
    Returns:
        str: The formatted prompt.
    """
    
    # 1. Ensure inputs are strings (formatted nicely if they are dicts)
    if isinstance(kg_data, (dict, list)):
        kg_str = json.dumps(kg_data, indent=2, ensure_ascii=False)
    else:
        kg_str = str(kg_data)

    if isinstance(pagemapping_data, (dict, list)):
        map_str = json.dumps(pagemapping_data, indent=2, ensure_ascii=False)
    else:
        map_str = str(pagemapping_data)

    # 2. Construct the f-string
    # NOTE: We use {{ and }} to escape curly braces in the Example Logic section
    prompt = f"""
You are my project partner, and an expert Knowledge Graph Analyst assisting with technical documentation. You have been provided with three specific resources to answer user queries:

1.  **The Knowledge Graph (JSON):** Contains the structural data, nodes, attributes, and relationships.
2.  **The Page Mapping (JSON):** A lookup table linking filenames to page numbers.
3.  **The Master Document (PDF):** A single PDF containing all detailed documentation.

**CRITICAL RETRIEVAL PROTOCOL:**
To get a specific details of a node or relationship, you must strictly follow this 3-step logic:

1.  **Locate the Reference:** Check that node for a field named `"details"`. This value contains a filename (e.g., `element_name.pdf`).
2.  **Resolve Page Numbers:** Look up that exact filename in **The Page Mapping**. Retrieve the `start_page` and `end_page` values.
3.  **Extract Content:** Read **The Master Document** *only* within those specific page numbers to find the detailed implementation logic, decision tables, or specifications.

**Example Logic:**
> 1. The node has `"details": "Login_System_123.pdf"`.
> 2. The Mapping JSON shows `"Login_System_123.pdf": {{ "start_page": 10, "end_page": 12 }}`.
> 3. You analyze pages 10–12 of the Master PDF to answer the question.

**Rule:**
Always prioritize the content found in the PDF for specific behaviors, while using the Graph JSON to understand relationships and metadata. If a node has no `"details"` field, rely solely on the JSON attributes.

**The Knowledge Graph (JSON):**
```json
{kg_str}
```

**The Page Mapping (JSON):**
```json
{map_str}
```

**The Master Document (PDF):** see the attachment.

Please follow the **Retrieval Protocol** defined above to answer my questions.

**QUESTION:**
{question_string}
"""
    return prompt.strip()

# ==========================================
# EXAMPLE USAGE
# ==========================================
if __name__ == "__main__":
    # 1. Load your JSON files
    kg = r"D:\projects\IDPS\ONLYSYSTEM.json"
    mapping = r"D:\projects\IDPS\pdf_page_mapping.json"
    user_question = """
    
车端问题：  
1、车端部署的IDS 是否有主从节  
点区分？  
2、车端若发生安全事件，相关的  
安全日志是由CDC统一收集上传  
VSOC，还是由TBOX统一收集上  
传？架构图暂时看不出来上传的链  
路  
3、方案中3.3.2章节有写到会对车  
端存储的含个人敏感信息的安全日  
志，采取安全访问技术、加密技术  
或其他安全技术做防护，具体采取  
的什么安全方案？  
4、下电再上电，上一周期内采集  
但未来得及上报的安全日志，是否  
会在下一个上电周期内继续上传？  
5、日志在车端存储是否满足6个  
月，车端如果在断网情况下能存储  
多久？  
6、车端和VSOC云之间通讯，是  
否有做TLS身份认证？  
其他问题：  
1、当前FO3/FO5 的VSOC平台，  
由哪一方在监控、管理？是不是之  
前针对IDS运行还没有讨论过分工;  
2、云端VSOC，是否有对应的试  
运行测试报告？因为车还没量产，  
只能通过试运行，触发安全事件来  
测试。（今天审核老师提出的问  
题，届时会对IDS运行的测试报告  
做审核)
    
    """
    
    try:
        with open(kg, "r", encoding="utf-8") as f:
            kg_json = json.load(f)
            
        with open(mapping, "r", encoding="utf-8") as f:
            mapping_json = json.load(f)

        # 3. Generate the prompt
        final_prompt = getprompt(kg_json, mapping_json, user_question)

        # 4. Print or Copy to clipboard
        print(final_prompt)
        
        # Optional: Save to file to copy-paste easily
        with open("prompt_output.txt", "w", encoding="utf-8") as f:
            f.write(final_prompt)
            print("\nPrompt saved to 'prompt_output.txt'")

    except FileNotFoundError:
        print("Error: Could not find JSON files. Please check paths in the Example Usage section.")