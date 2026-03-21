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
            # Remove // comments without breaking http://
            content = re.sub(r'(?<!:)//.*', '', content)
            # Clean trailing commas
            for _ in range(3):
                content = re.sub(r',\s*([\]}])', r'\1', content)
            if not content.strip(): return {}
            return json.loads(content)
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
        return {}

def deep_merge(dict1, dict2, sources1, source_name):
    for k, v in dict2.items():
        if isinstance(dict1.get(k), dict) and isinstance(v, dict):
            if k not in sources1 or not isinstance(sources1[k], dict):
                sources1[k] = {}
            deep_merge(dict1[k], v, sources1[k], source_name)
        else:
            dict1[k] = v
            sources1[k] = source_name

def serialize_jsonc(obj, sources, indent_level=0):
    lines = []
    pad = "  " * indent_level
    inner_pad = "  " * (indent_level + 1)
    
    if isinstance(obj, dict):
        lines.append("{")
        items = list(obj.items())
        for i, (k, v) in enumerate(items):
            is_last = (i == len(items) - 1)
            comma = "" if is_last else ","
            src = sources.get(k, "Default")
            # Format source name for comments
            if isinstance(src, dict):
                src_name = "Merged from multiple sources"
            else:
                src_name = str(src).replace('\\\\', '/').replace('\\', '/')
            
            if isinstance(v, dict):
                lines.append(f'{inner_pad}// Inherited from: {src_name}')
                lines.append(f'{inner_pad}"{k}": ' + serialize_jsonc(v, src if isinstance(src, dict) else {}, indent_level + 1) + comma)
            elif isinstance(v, list):
                list_str = json.dumps(v, indent=2)
                list_lines = list_str.split('\n')
                if len(list_lines) > 1:
                    shifted_list = list_lines[0] + '\n' + '\n'.join((inner_pad + ll) for ll in list_lines[1:])
                else:
                    shifted_list = list_lines[0]
                lines.append(f'{inner_pad}"{k}": {shifted_list}{comma} // Source: {src_name}')
            else:
                val_str = json.dumps(v)
                lines.append(f'{inner_pad}"{k}": {val_str}{comma} // Source: {src_name}')
        lines.append(pad + "}")
        return "\n".join(lines)
    else:
        return json.dumps(obj)

def main():
    cwd = Path.cwd()
    home = Path.home()
    
    print(f"Running in WSL at: {cwd}")

    merged_opencode_config = {"$schema": "https://opencode.ai/config.json"}
    merged_sources = {"$schema": "Official Schema"}

    # 1. Global Paths
    global_paths = [
        home / ".config" / "opencode" / "opencode.jsonc",
        home / ".config" / "opencode" / "opencode.json",
        home / ".local" / "share" / "opencode" / "opencode.jsonc",
        home / ".local" / "share" / "opencode" / "opencode.json"
    ]
    for gp in global_paths:
        if gp.exists():
            cfg = load_jsonc(gp)
            if cfg:
                deep_merge(merged_opencode_config, cfg, merged_sources, str(gp))
                print(f"Loaded Global config from: {gp}")

    # 2. Custom Env Var
    env_config_path = os.environ.get("OPENCODE_CONFIG")
    if env_config_path:
        cp = Path(env_config_path)
        if cp.exists():
            cfg = load_jsonc(cp)
            if cfg:
                deep_merge(merged_opencode_config, cfg, merged_sources, f"ENV OPENCODE_CONFIG ({cp})")
                print(f"Loaded Custom config: {cp}")

    # 3. Project Configs
    project_paths = [
        cwd / ".opencode" / "opencode.jsonc",
        cwd / ".opencode" / "opencode.json",
        cwd / "opencode.jsonc",
        cwd / "opencode.json",
    ]
    for lp in project_paths:
        if lp.exists():
            cfg = load_jsonc(lp)
            if cfg:
                rel_path = lp.relative_to(cwd)
                deep_merge(merged_opencode_config, cfg, merged_sources, f"Project File (./{rel_path})")
                print(f"Loaded Project config from: {lp}")

    # 4. Inline JSON
    env_config_content = os.environ.get("OPENCODE_CONFIG_CONTENT")
    if env_config_content:
        try:
            cfg = json.loads(env_config_content)
            deep_merge(merged_opencode_config, cfg, merged_sources, "ENV OPENCODE_CONFIG_CONTENT")
        except json.JSONDecodeError: pass

    # Write output to JSONC
    out_jsonc = cwd / "opencode_generated.jsonc"
    with open(out_jsonc, "w", encoding="utf-8") as f:
        f.write(serialize_jsonc(merged_opencode_config, merged_sources))
        
    print(f"==> Saved standardized annotated Config to: {out_jsonc.name}")

    # 5. Extract Extended Definitions
    config_patterns = {
        "ai_rules_and_agents": ["AGENTS.md", "*.agent.md", "*.prompt.md", "*.skill.md", "*.instructions.md", "copilot-instructions.md", ".clinerules*"],
        "build_and_system": ["bunfig.toml", "turbo.json", "package.json", "tsconfig.json", "flake.nix"],
        "infrastructure": ["sst.config.ts", "sst-env.d.ts", "vite.config.ts"]
    }
    ignore_dirs = {".git", "node_modules", "dist", ".sst", ".turbo", "build", "out", ".vite"}
    extended_data = {k: {} for k in config_patterns}
    
    for root, dirs, files in os.walk(cwd):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        for file in files:
            for cat, patterns in config_patterns.items():
                if any(fnmatch.fnmatch(file, p) for p in patterns):
                    filepath = Path(root) / file
                    rel_path = filepath.relative_to(cwd).as_posix()
                    try:
                        with open(filepath, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if filepath.suffix == '.json':
                                try: content = json.loads(content)
                                except: pass
                            extended_data[cat][rel_path] = content
                    except: pass

    out_extended = cwd / "opencode_extended_configs.json"
    with open(out_extended, "w", encoding="utf-8") as f:
        json.dump(extended_data, f, indent=4)
        
    print(f"==> Saved other project-specific configs to: {out_extended.name}")

if __name__ == "__main__":
    main()
