import argparse
import ast
import json
import os
import sys
from typing import Any, Dict, List


DEFAULT_EXCLUDES = [
    '.git',
    '.hg',
    '.svn',
    '.venv',
    'node_modules',
    'out',
    'dist',
    'coverage',
    'TEMP',
    'design/intention_reality_audit',
    'src/ast/py/__pycache__',
]


# @ArchitectureID: 1278
def main() -> int:
    parser = argparse.ArgumentParser(description='Scan Python files into a reality model.')
    parser.add_argument('--target-root', required=True, help='Workspace root to scan.')
    parser.add_argument('--exclude-json', default='[]', help='JSON encoded list of explicit excludes.')
    args = parser.parse_args()

    stdin_payload = read_stdin_payload()
    explicit_excludes = load_excludes(args.exclude_json, stdin_payload)

    try:
      model = scan_python_reality(args.target_root, explicit_excludes)
      sys.stdout.write(json.dumps(model, ensure_ascii=False))
      return 0
    except Exception as exc:
      sys.stderr.write(str(exc))
      return 1


# @ArchitectureID: 1278
def read_stdin_payload() -> Dict[str, Any]:
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


# @ArchitectureID: 1277
def load_excludes(argv_excludes: str, stdin_payload: Dict[str, Any]) -> List[str]:
    combined: List[str] = []
    try:
        parsed = json.loads(argv_excludes)
        if isinstance(parsed, list):
            combined.extend([str(item) for item in parsed])
    except json.JSONDecodeError:
        pass

    stdin_excludes = stdin_payload.get('excludePaths', [])
    if isinstance(stdin_excludes, list):
        combined.extend([str(item) for item in stdin_excludes])

    deduped = []
    seen = set()
    for item in DEFAULT_EXCLUDES + combined:
        normalized = normalize_path(item)
        if normalized and normalized not in seen:
            seen.add(normalized)
            deduped.append(normalized)
    return deduped


# @ArchitectureID: 1277
def scan_python_reality(target_root: str, explicit_excludes: List[str]) -> Dict[str, Any]:
    elements: List[Dict[str, Any]] = []
    relationships: List[Dict[str, Any]] = []
    included_elements: List[str] = []
    included_relationships: List[str] = []
    errors: List[str] = []

    for file_path in iter_python_files(target_root, explicit_excludes):
        relative_path = normalize_path(os.path.relpath(file_path, target_root))
        module_id = f'py:file:{relative_path}'
        elements.append({
            'id': module_id,
            'name': relative_path,
            'type': 'PythonModule',
            'file_path': relative_path,
            'source': 'python',
            'visibility': 'public',
            'exported': True,
            'extensions': {
                'language': 'python'
            }
        })
        included_elements.append(module_id)

        try:
            with open(file_path, 'r', encoding='utf-8') as handle:
                content = handle.read()
            tree = ast.parse(content, filename=file_path)
        except SyntaxError as exc:
            errors.append(f'{relative_path}: {exc.msg} at line {exc.lineno}')
            continue

        for node in tree.body:
            if isinstance(node, ast.ClassDef):
                push_symbol(elements, relationships, included_elements, included_relationships, module_id, relative_path, node.name, 'Class', True)
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                exported = not node.name.startswith('_')
                push_symbol(elements, relationships, included_elements, included_relationships, module_id, relative_path, node.name, 'Function', exported)

        for import_node in [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom))]:
            target_name = extract_import_target(import_node)
            target_id = f'py:import:{target_name}'
            if not any(element['id'] == target_id for element in elements):
                elements.append({
                    'id': target_id,
                    'name': target_name,
                    'type': 'ImportedModule',
                    'source': 'python',
                    'visibility': 'public',
                    'exported': True,
                    'extensions': {
                        'language': 'python'
                    }
                })
                included_elements.append(target_id)

            relationship_id = f'py:import:{module_id}->{target_id}'
            relationships.append({
                'id': relationship_id,
                'statement': f'{relative_path} --(ArchiMate_Access)--> {target_name}',
                'name': 'ArchiMate_Access',
                'super_type': 'ArchiMate_Access',
                'source_id': module_id,
                'target_id': target_id,
                'source_name': relative_path,
                'target_name': target_name,
                'description': 'Python module imports another module.',
                'extensions': {
                    'language': 'python'
                }
            })
            included_relationships.append(relationship_id)

    views = [{
        'view_id': 'py:reality-scan',
        'view_name': 'Python Reality Scan',
        'description': 'Python repository view generated via ast module.',
        'included_elements': included_elements,
        'included_relationships': included_relationships,
        'extensions': {
            'scanner': 'python-ast'
        }
    }]

    return {
        'name': 'python-reality',
        'description': 'Python scanner output.',
        'elements': elements,
        'relationships': relationships,
        'views': views,
        'extensions': {
            'defaultExcludes': DEFAULT_EXCLUDES,
            'explicitExcludes': explicit_excludes,
        },
        'errors': errors,
    }


# @ArchitectureID: 1278
def iter_python_files(target_root: str, excludes: List[str]):
    for current_root, dirs, files in os.walk(target_root):
        relative_root = normalize_path(os.path.relpath(current_root, target_root))
        dirs[:] = [directory for directory in dirs if not is_excluded(join_path(relative_root, directory), excludes)]
        for file_name in files:
            if not file_name.endswith('.py'):
                continue
            relative_path = join_path(relative_root, file_name)
            if is_excluded(relative_path, excludes):
                continue
            yield os.path.join(current_root, file_name)


# @ArchitectureID: 1278
def push_symbol(
    elements: List[Dict[str, Any]],
    relationships: List[Dict[str, Any]],
    included_elements: List[str],
    included_relationships: List[str],
    module_id: str,
    relative_path: str,
    symbol_name: str,
    symbol_type: str,
    exported: bool,
) -> None:
    symbol_id = f'py:{symbol_type.lower()}:{relative_path}:{symbol_name}'
    elements.append({
        'id': symbol_id,
        'name': symbol_name,
        'type': symbol_type,
        'file_path': relative_path,
        'source': 'python',
        'visibility': 'public' if exported else 'private',
        'exported': exported,
        'extensions': {
            'language': 'python'
        }
    })
    included_elements.append(symbol_id)

    relationship_id = f'py:contains:{module_id}->{symbol_id}'
    relationships.append({
        'id': relationship_id,
        'statement': f'{relative_path} --(ArchiMate_Composition)--> {symbol_name}',
        'name': 'ArchiMate_Composition',
        'super_type': 'ArchiMate_Composition',
        'source_id': module_id,
        'target_id': symbol_id,
        'source_name': relative_path,
        'target_name': symbol_name,
        'description': 'Python module contains declaration.',
        'extensions': {
            'language': 'python'
        }
    })
    included_relationships.append(relationship_id)


# @ArchitectureID: 1278
def extract_import_target(node: ast.AST) -> str:
    if isinstance(node, ast.Import):
        return node.names[0].name if node.names else 'unknown'
    if isinstance(node, ast.ImportFrom):
        return node.module or 'unknown'
    return 'unknown'


# @ArchitectureID: 1277
def is_excluded(relative_path: str, excludes: List[str]) -> bool:
    normalized = normalize_path(relative_path)
    if normalized in ('.', ''):
        return False
    return any(normalized == item or normalized.startswith(f'{item}/') for item in excludes)


# @ArchitectureID: 1277
def join_path(left: str, right: str) -> str:
    if left in ('', '.'):
        return normalize_path(right)
    return normalize_path(f'{left}/{right}')


# @ArchitectureID: 1277
def normalize_path(value: str) -> str:
    return value.replace('\\', '/').strip('./').lower()


if __name__ == '__main__':
    raise SystemExit(main())