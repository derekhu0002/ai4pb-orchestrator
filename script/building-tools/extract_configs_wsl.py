import os
import json
import re
import fnmatch
import datetime
import shutil
import glob
from pathlib import Path

def load_jsonc(filepath):
    if not filepath.exists(): return {}
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
            content = re.sub(r'(?<!:)//.*', '', content)
            for _ in range(3): content = re.sub(r',\s*([\]}])', r'\1', content)
            if not content.strip(): return {}
            return json.loads(content)
    except Exception as e:
        return {}

def extract_references(obj, config_path, file_set):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k == "instructions" and isinstance(v, list):
                for inst in v:
                    if isinstance(inst, str):
                        base = config_path.parent if config_path else Path.cwd()
                        if inst.startswith('~'):
                            search_paths = [str(Path.home() / inst[2:])]
                        else:
                            search_paths = []
                            if not Path(inst).is_absolute():
                                if config_path:
                                    search_paths.append(str(config_path.parent / inst))
                                search_paths.append(str(Path.cwd() / inst))
                            else:
                                search_paths.append(inst)
                        for search_path in search_paths:
                            try:
                                found_match = False
                                for match in glob.glob(search_path, recursive=True):
                                    mp = Path(match).resolve()
                                    if mp.is_file():
                                        file_set.add(mp)
                                        found_match = True
                                if found_match:
                                    break  # Stop hunting if we found matches in the preceding paths
                            except: pass
            else:
                extract_references(v, config_path, file_set)
    elif isinstance(obj, list):
        for item in obj: extract_references(item, config_path, file_set)
    elif isinstance(obj, str):
        for m in re.findall(r'\{file:(.*?)\}', obj):
            p = m.strip()
            if p.startswith('~/'): p = str(Path.home() / p[2:])
            fp = Path(p)
            if not fp.is_absolute():
                search_paths = []
                if config_path: search_paths.append(config_path.parent / p)
                search_paths.append(Path.cwd() / p)
            else:
                search_paths = [fp]
            for search_fp in search_paths:
                try:
                    search_fp = search_fp.resolve()
                    if search_fp.is_file():
                        file_set.add(search_fp)
                        break  # Stop at first found match honoring precedence
                except: pass

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
            src_name = "Merged from multiple sources" if isinstance(src, dict) else str(src).replace('\\\\', '/').replace('\\', '/')
            
            if isinstance(v, dict):
                lines.append(f'{inner_pad}// Inherited from: {src_name}')
                lines.append(f'{inner_pad}"{k}": ' + serialize_jsonc(v, src if isinstance(src, dict) else {}, indent_level + 1) + comma)
            elif isinstance(v, list):
                list_str = json.dumps(v, indent=2)
                list_lines = list_str.split('\n')
                shifted = list_lines[0] + ('\n' + '\n'.join((inner_pad + ll) for ll in list_lines[1:]) if len(list_lines)>1 else '')
                lines.append(f'{inner_pad}"{k}": {shifted}{comma} // Source: {src_name}')
            else:
                lines.append(f'{inner_pad}"{k}": {json.dumps(v)}{comma} // Source: {src_name}')
        lines.append(pad + "}")
        return "\n".join(lines)
    return json.dumps(obj)

def copy_to_archive(src_path, cwd, home, out_dir):
    try:
        src_path = Path(src_path).resolve()
        base_target = ""
        
        # Determine base root mapping
        try:
            rel = src_path.relative_to(cwd)
            base_target = "workspace"
        except ValueError:
            try:
                rel = src_path.relative_to(home)
                base_target = "home"
            except ValueError:
                drive, tail = os.path.splitdrive(src_path)
                rel = tail.lstrip('\\/')
                base_target = "external"
                if drive:
                    base_target = f"external/{drive.replace(':', '')}"
                    
        target = out_dir / base_target / rel
        if target and src_path.exists():
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src_path, target)
    except Exception as e:
        print(f"Failed to copy {src_path}: {e}")

def main():
    cwd = Path.cwd()
    home = Path.home()
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_root = cwd / f"{timestamp}_{cwd.name}_exported_configs"
    out_root.mkdir(parents=True, exist_ok=True)
    print(f"Running in WSL at: {cwd}")
    print(f"Output Directory Setup: {out_root}")

    merged_cfg = {"$schema": "https://opencode.ai/config.json"}
    sources = {"$schema": "Official Schema"}
    files_to_collect = set()

    def process_config(cfg_path, source_label):
        if cfg_path.exists():
            c = load_jsonc(cfg_path)
            if c:
                deep_merge(merged_cfg, c, sources, source_label)
                extract_references(c, cfg_path, files_to_collect)
                files_to_collect.add(cfg_path.resolve())
                print(f"Loaded config: {cfg_path}")

    # 1. Global
    for gp in [home/".config"/"opencode"/"opencode.jsonc", home/".config"/"opencode"/"opencode.json",
               home/".local"/"share"/"opencode"/"opencode.jsonc", home/".local"/"share"/"opencode"/"opencode.json"]:
        process_config(gp, str(gp))

    # 2. Env
    if os.environ.get("OPENCODE_CONFIG"):
        process_config(Path(os.environ["OPENCODE_CONFIG"]), f"ENV OPENCODE_CONFIG")

    # 3. Project
    for lp in [cwd/".opencode"/"opencode.jsonc", cwd/".opencode"/"opencode.json", cwd/"opencode.jsonc", cwd/"opencode.json"]:
        try:
            rel = lp.relative_to(cwd)
            process_config(lp, f"Project File (./{rel})")
        except:
            process_config(lp, f"Project File ({lp})")

    # 4. Inline Env Config
    inline_content = os.environ.get("OPENCODE_CONFIG_CONTENT")
    if inline_content:
        try:
            content = re.sub(r'/\*.*?\*/', '', inline_content, flags=re.DOTALL)
            content = re.sub(r'(?<!:)//.*', '', content)
            for _ in range(3): content = re.sub(r',\s*([\]}])', r'\1', content)
            if content.strip():
                c = json.loads(content)
                deep_merge(merged_cfg, c, sources, "ENV OPENCODE_CONFIG_CONTENT")
                extract_references(c, None, files_to_collect)
                print("Loaded config: ENV OPENCODE_CONFIG_CONTENT")
        except Exception as e:
            print(f"Failed to parse OPENCODE_CONFIG_CONTENT: {e}")

    # Write merged config JSONC
    with open(out_root / "opencode_generated.jsonc", "w", encoding="utf-8") as f:
        f.write(serialize_jsonc(merged_cfg, sources))

    # Collect explicit OpenCode environment directories (agents, modes, skills, etc)
    opencode_env_dirs = [
        cwd / ".opencode",
        home / ".config" / "opencode",
        home / ".local" / "share" / "opencode"
    ]
    
    ignore_heavy_subdirs = {"snapshot", "node_modules", "dist", "build"}
    
    for env_dir in opencode_env_dirs:
        if env_dir.exists() and env_dir.is_dir():
            for root, dirs, files in os.walk(env_dir):
                # Ignore heavy unnecessary snapshot and build cache directories
                dirs[:] = [d for d in dirs if d not in ignore_heavy_subdirs]
                
                for file in files:
                    fp = Path(root) / file
                    if fp.is_file() and fp.suffix in ['.json', '.jsonc', '.md', '.ts', '.js', '.yaml', '.yml']:
                        files_to_collect.add(fp.resolve())

    print(f"\nCopying {len(files_to_collect)} referenced OpenCode configuration items to structural archive...")
    for fp in files_to_collect:
        copy_to_archive(fp, cwd, home, out_root)
        
    print(f"Extraction fully complete. Archive created at: {out_root.name}")

if __name__ == "__main__": main()
