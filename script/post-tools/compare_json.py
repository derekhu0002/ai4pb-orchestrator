import json
import sys
import os
import difflib

def normalize(obj):
    """
    Recursively sorts lists in the JSON object to allow order-independent comparison.
    Dictionaries are left as is (Python compares them order-independently).
    """
    if isinstance(obj, dict):
        return {k: normalize(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        # Normalize elements first
        normalized_list = [normalize(x) for x in obj]
        # Sort the list based on JSON representation of its elements to ensure consistent order
        # sort_keys=True ensures dictionaries inside the list are sorted by key for the string representation
        return sorted(normalized_list, key=lambda x: json.dumps(x, sort_keys=True))
    else:
        return obj

def compare_files(file1_path, file2_path, ignore_root_id=False):
    if not os.path.exists(file1_path):
        print(f"Error: File not found: {file1_path}")
        return False
    if not os.path.exists(file2_path):
        print(f"Error: File not found: {file2_path}")
        return False

    try:
        with open(file1_path, 'r', encoding='utf-8-sig') as f1:
            j1 = json.load(f1)
        with open(file2_path, 'r', encoding='utf-8-sig') as f2:
            j2 = json.load(f2)
            
        # Optional: Ignore root ID if it's auto-generated and expected to differ
        if ignore_root_id:
            if 'id' in j1: del j1['id']
            if 'id' in j2: del j2['id']

        n1 = normalize(j1)
        n2 = normalize(j2)

        if n1 == n2:
            print("Files are IDENTICAL (ignoring order).")
            return True
        else:
            print("Files are DIFFERENT.")
            print("Differences (ignoring order):")
            
            # Convert normalized objects to pretty-printed strings for diffing
            s1 = json.dumps(n1, indent=2, sort_keys=True).splitlines()
            s2 = json.dumps(n2, indent=2, sort_keys=True).splitlines()
            
            diff = difflib.unified_diff(
                s1, s2, 
                fromfile=file1_path, 
                tofile=file2_path, 
                lineterm=''
            )
            
            for line in diff:
                print(line)
                
            return False

    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python compare_json.py <file1> <file2> [--ignore-root-id]")
        sys.exit(1)

    file1 = sys.argv[1]
    file2 = sys.argv[2]
    ignore_id = "--ignore-root-id" in sys.argv

    compare_files(file1, file2, ignore_id)
