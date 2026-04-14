import argparse
import ast
import json
import sys
from typing import Any, Dict, List


def signature_for_function(node: ast.AST) -> str:
    if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        return ''

    args: List[str] = []
    for arg in node.args.posonlyargs:
        args.append(render_arg(arg))
    if node.args.posonlyargs:
        args.append('/')
    for arg in node.args.args:
        args.append(render_arg(arg))
    if node.args.vararg:
        args.append(f'*{render_arg(node.args.vararg)}')
    elif node.args.kwonlyargs:
        args.append('*')
    for arg in node.args.kwonlyargs:
        args.append(render_arg(arg))
    if node.args.kwarg:
        args.append(f'**{render_arg(node.args.kwarg)}')

    prefix = 'async def' if isinstance(node, ast.AsyncFunctionDef) else 'def'
    returns = f' -> {ast.unparse(node.returns)}' if getattr(node, 'returns', None) is not None else ''
    return f"{prefix} {node.name}({', '.join(args)}){returns}"


def render_arg(arg: ast.arg) -> str:
    if arg.annotation is None:
        return arg.arg
    return f'{arg.arg}: {ast.unparse(arg.annotation)}'


def class_signature(node: ast.ClassDef) -> str:
    if not node.bases:
        return f'class {node.name}'
    return f"class {node.name}({', '.join(ast.unparse(base) for base in node.bases)})"


def decorators_for_node(node: ast.AST) -> List[str]:
    decorators: List[str] = []
    for decorator in getattr(node, 'decorator_list', []):
        try:
            decorators.append(f'@{ast.unparse(decorator)}')
        except Exception:
            continue
    return decorators


def line_snippet(lines: List[str], line_number: int) -> str:
    if line_number <= 0 or line_number > len(lines):
        return ''
    return lines[line_number - 1].strip()


class SymbolCollector(ast.NodeVisitor):
    def __init__(self, relative_file: str, lines: List[str]) -> None:
        self.relative_file = relative_file
        self.lines = lines
        self.class_stack: List[str] = []
        self.symbols: List[Dict[str, Any]] = []

    def visit_ClassDef(self, node: ast.ClassDef) -> Any:
        self.symbols.append({
            'file': self.relative_file,
            'line': node.lineno,
            'kind': 'class',
            'name': node.name,
            'signature': class_signature(node),
            'decorators': decorators_for_node(node),
            'snippet': line_snippet(self.lines, node.lineno),
            'source': 'ast',
            'languageId': 'python',
        })
        self.class_stack.append(node.name)
        self.generic_visit(node)
        self.class_stack.pop()

    def visit_FunctionDef(self, node: ast.FunctionDef) -> Any:
        self._visit_function_like(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> Any:
        self._visit_function_like(node)

    def _visit_function_like(self, node: ast.AST) -> None:
        assert isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        if self.class_stack:
            owner = self.class_stack[-1]
            kind = 'method'
            name = f'{owner}.{node.name}'
        else:
            kind = 'function'
            name = node.name
        self.symbols.append({
            'file': self.relative_file,
            'line': node.lineno,
            'kind': kind,
            'name': name,
            'signature': signature_for_function(node),
            'decorators': decorators_for_node(node),
            'snippet': line_snippet(self.lines, node.lineno),
            'source': 'ast',
            'languageId': 'python',
        })
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign) -> Any:
        if self.class_stack:
            return
        names = [target.id for target in node.targets if isinstance(target, ast.Name)]
        for name in names:
            self.symbols.append({
                'file': self.relative_file,
                'line': node.lineno,
                'kind': 'variable',
                'name': name,
                'signature': f'variable {name}',
                'snippet': line_snippet(self.lines, node.lineno),
                'source': 'ast',
                'languageId': 'python',
            })
        self.generic_visit(node)

    def visit_AnnAssign(self, node: ast.AnnAssign) -> Any:
        if self.class_stack:
            return
        if isinstance(node.target, ast.Name):
            annotation = ast.unparse(node.annotation) if node.annotation is not None else ''
            signature = f'variable {node.target.id}{": " + annotation if annotation else ""}'
            self.symbols.append({
                'file': self.relative_file,
                'line': node.lineno,
                'kind': 'variable',
                'name': node.target.id,
                'signature': signature,
                'snippet': line_snippet(self.lines, node.lineno),
                'source': 'ast',
                'languageId': 'python',
            })
        self.generic_visit(node)


def main() -> int:
    parser = argparse.ArgumentParser(description='Extract Python structural symbols via ast.')
    parser.add_argument('--relative-file', required=True)
    args = parser.parse_args()

    content = sys.stdin.read()
    lines = content.splitlines()
    try:
        tree = ast.parse(content, filename=args.relative_file)
    except SyntaxError:
        sys.stdout.write('[]')
        return 0

    collector = SymbolCollector(args.relative_file, lines)
    collector.visit(tree)
    sys.stdout.write(json.dumps(collector.symbols, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())