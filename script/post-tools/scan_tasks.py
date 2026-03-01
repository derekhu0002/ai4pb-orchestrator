import json
import re

FILENAME = r'd:\projects\BIG-THING\design\KG\SystemArchitecture.json'

print("I have scanned the Architecture. I found the following active tasks:")

def scan_node(node):
    node_name = node.get('name', 'Unknown')
    node_id = 'Unknown'
    match = re.search(r'\((\d+)\)$', node_name)
    if match:
        node_id = match.group(1)

    project_info = node.get('project_info', {})
    tasks = project_info.get('tasks', [])
    for task in tasks:
        status = task.get('status', 'Active')
        if status not in ['Done', 'Complete']:
            print(f"- **[Node ID: {node_id}]** Task: \"{task.get('description', 'No description')}\" (Status: {status})")

    for subgraph in node.get('subgraphs', []):
        for sub_node in subgraph.get('nodes', []):
            scan_node(sub_node)

try:
    with open(FILENAME, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    for node in data.get('graph', {}).get('nodes', []):
        scan_node(node)

except Exception as e:
    print(f"Error scanning architecture: {e}")
