import os
import json
import re
import fnmatch
from pathlib import Path

def load_jsonc(filepath):
    if not filepath.exists(): return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
            # Remove /* ... */ comments
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            
            # Remove // comments, but don't break http:// or https://
            # Negative lookbehind: match // only if not preceded by :
            content = re.sub(r'(?<!:)//.*', '', content)
            
            # Remove trailing commas right before } or ]
            # We can run it a few times to catch nested like  },  }
            for _ in range(3):
                content = re.sub(r',\s*([\]}])', r'\1', content)
                
            if not content.strip(): return {}
            return json.loads(content)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return {}

def deep_merge(dict1, dict2):
    for k, v in dict2.items():
        if isinstance(dict1.get(k), dict) and isinstance(v, dict):
            deep_merge(dict1[k], v)
        else: dict1[k] = v

def main():
    cwd = Path.cwd()
    home = Path.home()
    
    print(f"Running in WSL at: {cwd}")
    print(f"WSL Home directory: {home}")

    # Official Precedence Order:
    # 1. Remote config (omitted/unavailable via script)
    # 2. Global config (~/.config/opencode/opencode.json)
    # 3. Custom config (OPENCODE_CONFIG env var)
    # 4. Project config (opencode.json in project)
    # 5. .opencode directories (handled in extended configs export)
    # 6. Inline config (OPENCODE_CONFIG_CONTENT env var)

    merged_opencode_config = {"$schema": "https://opencode.ai/config.json"}

    # --- 2. Global Config ---
    global_paths = [
        home / ".config" / "opencode" / "opencode.jsonc",
        home / ".config" / "opencode" / "opencode.json"
    ]
    for gp in global_paths:
        if gp.exists():
            cfg = load_jsonc(gp)
            if cfg:
                deep_merge(merged_opencode_config, cfg)
                print(f"Loaded Global config from: {gp}")

    # --- 3. Custom Config (Env Var) ---
    env_config_path = os.environ.get("OPENCODE_CONFIG")
    if env_config_path:
        cp = Path(env_config_path)
        if cp.exists():
            cfg = load_jsonc(cp)
            if cfg:
                deep_merge(merged_opencode_config, cfg)
                print(f"Loaded Custom config from OPENCODE_CONFIG: {cp}")

    # --- 4. Project Config ---
    # According to docs, project config can be in opencode.json or under .opencode/
    project_paths = [
        cwd / ".opencode" / "opencode.jsonc",
        cwd / ".opencode" / "opencode.json"
    ]
    for lp in project_paths:
        if lp.exists():
            cfg = load_jsonc(lp)
            if cfg:
                deep_merge(merged_opencode_config, cfg)
                print(f"Loaded Project config from: {lp}")

    # --- 6. Inline Config (Env Var) ---
    env_config_content = os.environ.get("OPENCODE_CONFIG_CONTENT")
    if env_config_content:
        try:
            cfg = json.loads(env_config_content)
            deep_merge(merged_opencode_config, cfg)
            print("Loaded Inline config from OPENCODE_CONFIG_CONTENT env var")
        except json.JSONDecodeError:
            print("Failed to parse OPENCODE_CONFIG_CONTENT as JSON")

    # Save finalized standard config
    with open(cwd / "opencode_generated.json", "w", encoding="utf-8") as f:
        json.dump(merged_opencode_config, f, indent=2)
        
    print("==> Saved standardized Opencode config to: opencode_generated.json")

if __name__ == "__main__":
    main()
