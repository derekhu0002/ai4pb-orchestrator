from __future__ import annotations

import argparse
import html
import json
import re
import socket
import ssl
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DEFAULT_URL = "https://www.opengroup.org/xsd/archimate/3.1/html-model/"
DEFAULT_TIMEOUT_SECONDS = 20.0
DEFAULT_OUTPUT = (
    Path(__file__).resolve().parents[2]
    / ".opencode"
    / "schema"
    / "archimate3.1"
    / "archimate3.1-exchange-model.schema.json"
)


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        text = data.strip()
        if text:
            self.parts.append(text)

    def get_text(self) -> str:
        return "\n".join(self.parts)


COMPONENT_PATTERN = re.compile(
    r'<div class="componentTitle">\s*([^<]+?)\s*<span class="qname">([^<]+)</span></div>(.*?)(?=<div class="toTop"><a href="#INDEX">\s*\[ top \]\s*</a></div><a id=|\Z)',
    re.DOTALL,
)


def fetch_html(url: str, timeout_seconds: float, insecure: bool) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; AI4PB schema generator)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
    )
    ssl_context = None
    if insecure:
        ssl_context = ssl._create_unverified_context()

    with urlopen(request, timeout=timeout_seconds, context=ssl_context) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return response.read().decode(charset, errors="replace")


def fetch_html_via_powershell(url: str, timeout_seconds: float) -> str:
    timeout_seconds_int = max(1, int(timeout_seconds))
    command = [
        "powershell",
        "-NoProfile",
        "-Command",
        (
            "$ProgressPreference='SilentlyContinue'; "
            "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; "
            "$headers = @{"
            "'User-Agent'='Mozilla/5.0 (compatible; AI4PB schema generator)';"
            "'Accept'='text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'"
            "}; "
            f"(Invoke-WebRequest -UseBasicParsing -Uri '{url}' -TimeoutSec {timeout_seconds_int} -Headers $headers).Content"
        ),
    ]

    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )

    if completed.returncode != 0:
        stderr_text = completed.stderr.strip() or completed.stdout.strip() or "unknown PowerShell fetch error"
        raise RuntimeError(stderr_text)

    if not completed.stdout.strip():
        raise RuntimeError("PowerShell fetch returned empty content")

    return completed.stdout


def html_to_text(raw_html: str) -> str:
    parser = TextExtractor()
    parser.feed(raw_html)
    text = html.unescape(parser.get_text())
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{2,}", "\n", text)
    return text


def html_fragment_to_text(raw_html: str) -> str:
    parser = TextExtractor()
    parser.feed(html.unescape(raw_html))
    text = parser.get_text()
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n{2,}", "\n", text)
    return text


def extract_components(raw_html: str) -> dict[str, str]:
    components: dict[str, str] = {}
    for match in COMPONENT_PATTERN.finditer(raw_html):
        kind = html.unescape(match.group(1).strip())
        name = html.unescape(match.group(2).strip())
        body = match.group(3)
        components[f"{kind}:{name}"] = body
    return components


def extract_sections(text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    pattern = re.compile(r"\[ top \]\s+(Complex Type|Simple Type|Element)\s+([^\n]+)(.*?)(?=\[ top \]|\Z)", re.DOTALL)
    for match in pattern.finditer(text):
        kind = match.group(1).strip()
        name = match.group(2).strip()
        body = match.group(3).strip()
        sections[f"{kind}:{name}"] = body
    return sections


def extract_enumerations(section_body: str) -> list[str]:
    values = re.findall(r'value=\s*"([^"]+)"', section_body, flags=re.IGNORECASE)

    if not values:
        lines = [line.strip() for line in section_body.splitlines() if line.strip()]
        for index, line in enumerate(lines[:-1]):
            if line.lower() != "enumeration":
                continue
            candidate = lines[index + 1]
            if candidate.lower() == "of":
                continue
            values.append(candidate)

    seen: set[str] = set()
    ordered: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            ordered.append(value)
    return ordered


def build_schema(
    source_url: str,
    element_types: list[str],
    composite_types: list[str],
    relationship_connector_types: list[str],
    relationship_types: list[str],
    data_types: list[str],
    access_types: list[str],
    influence_strengths: list[str],
) -> dict:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "./.opencode/schema/archimate3.1/archimate3.1-exchange-model.schema.json",
        "title": "ArchiMate 3.1 Exchange Model JSON Schema",
        "description": (
            "A JSON Schema derived from the Open Group ArchiMate 3.1 HTML model at "
            f"{source_url}. This is a JSON projection of the XML exchange model: XML wildcard "
            "extension points are represented as optional JSON 'extensions' objects."
        ),
        "type": "object",
        "additionalProperties": False,
        "required": ["identifier", "name"],
        "properties": {
            "identifier": {"$ref": "#/$defs/identifier"},
            "version": {"type": "string"},
            "name": {
                "type": "array",
                "minItems": 1,
                "items": {"$ref": "#/$defs/langString"},
            },
            "documentation": {
                "type": "array",
                "items": {"$ref": "#/$defs/preservedLangString"},
            },
            "properties": {"$ref": "#/$defs/properties"},
            "metadata": {"$ref": "#/$defs/metadata"},
            "elements": {"$ref": "#/$defs/elements"},
            "relationships": {"$ref": "#/$defs/relationships"},
            "organizations": {
                "type": "array",
                "items": {"$ref": "#/$defs/organization"},
            },
            "propertyDefinitions": {"$ref": "#/$defs/propertyDefinitions"},
            "extensions": {"$ref": "#/$defs/extensions"},
        },
        "$defs": {
            "identifier": {
                "type": "string",
                "minLength": 1,
                "description": "JSON equivalent of xs:ID or xs:IDREF values in the exchange model.",
            },
            "extensions": {
                "type": "object",
                "description": "JSON projection of foreign-namespace XML elements or attributes.",
                "additionalProperties": True,
            },
            "langString": {
                "type": "object",
                "additionalProperties": False,
                "required": ["value"],
                "properties": {
                    "value": {"type": "string"},
                    "lang": {
                        "type": "string",
                        "description": "JSON projection of xml:lang.",
                    },
                },
            },
            "preservedLangString": {
                "allOf": [{"$ref": "#/$defs/langString"}],
                "description": "Multi-language string with preserved whitespace semantics.",
            },
            "property": {
                "type": "object",
                "additionalProperties": False,
                "required": ["propertyDefinitionRef", "value"],
                "properties": {
                    "propertyDefinitionRef": {"$ref": "#/$defs/identifier"},
                    "value": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/langString"},
                    },
                },
            },
            "properties": {
                "type": "object",
                "additionalProperties": False,
                "required": ["property"],
                "properties": {
                    "property": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/property"},
                    }
                },
            },
            "schemaInfo": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "schema": {"type": "string"},
                    "schemaversion": {"type": "string"},
                    "extensions": {"$ref": "#/$defs/extensions"},
                },
            },
            "metadata": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "schema": {"type": "string"},
                    "schemaversion": {"type": "string"},
                    "schemaInfo": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/schemaInfo"},
                    },
                    "extensions": {"$ref": "#/$defs/extensions"},
                },
            },
            "conceptBase": {
                "type": "object",
                "additionalProperties": False,
                "required": ["identifier", "type", "name"],
                "properties": {
                    "identifier": {"$ref": "#/$defs/identifier"},
                    "type": {"type": "string"},
                    "name": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/langString"},
                    },
                    "documentation": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/preservedLangString"},
                    },
                    "properties": {"$ref": "#/$defs/properties"},
                    "extensions": {"$ref": "#/$defs/extensions"},
                },
            },
            "element": {
                "allOf": [
                    {"$ref": "#/$defs/conceptBase"},
                    {
                        "type": "object",
                        "properties": {
                            "type": {"$ref": "#/$defs/elementEnumType"}
                        },
                    },
                ]
            },
            "relationship": {
                "allOf": [
                    {"$ref": "#/$defs/conceptBase"},
                    {
                        "type": "object",
                        "required": ["source", "target"],
                        "properties": {
                            "type": {"$ref": "#/$defs/relationshipTypeEnum"},
                            "source": {"$ref": "#/$defs/identifier"},
                            "target": {"$ref": "#/$defs/identifier"},
                            "accessType": {"$ref": "#/$defs/accessTypeEnum"},
                            "modifier": {"$ref": "#/$defs/influenceModifierType"},
                            "isDirected": {"type": "boolean", "default": False},
                        },
                        "allOf": [
                            {
                                "if": {"properties": {"type": {"const": "Access"}}},
                                "then": {
                                    "properties": {
                                        "accessType": {"$ref": "#/$defs/accessTypeEnum"}
                                    }
                                },
                            },
                            {
                                "if": {"properties": {"type": {"const": "Influence"}}},
                                "then": {
                                    "properties": {
                                        "modifier": {
                                            "$ref": "#/$defs/influenceModifierType"
                                        }
                                    }
                                },
                            },
                            {
                                "if": {"properties": {"type": {"const": "Association"}}},
                                "then": {
                                    "properties": {
                                        "isDirected": {"type": "boolean", "default": False}
                                    }
                                },
                            },
                        ],
                    },
                ]
            },
            "elements": {
                "type": "object",
                "additionalProperties": False,
                "required": ["element"],
                "properties": {
                    "element": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/element"},
                    }
                },
            },
            "relationships": {
                "type": "object",
                "additionalProperties": False,
                "required": ["relationship"],
                "properties": {
                    "relationship": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/relationship"},
                    }
                },
            },
            "organization": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "identifier": {"$ref": "#/$defs/identifier"},
                    "label": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/langString"},
                    },
                    "documentation": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/preservedLangString"},
                    },
                    "item": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/organization"},
                    },
                    "elementRef": {"$ref": "#/$defs/identifier"},
                    "relationshipRef": {"$ref": "#/$defs/identifier"},
                    "conceptRef": {"$ref": "#/$defs/identifier"},
                    "propertyDefinitionRef": {"$ref": "#/$defs/identifier"},
                    "stereotypeRef": {"$ref": "#/$defs/identifier"},
                    "extensions": {"$ref": "#/$defs/extensions"},
                },
            },
            "propertyDefinition": {
                "type": "object",
                "additionalProperties": False,
                "required": ["identifier", "type", "name"],
                "properties": {
                    "identifier": {"$ref": "#/$defs/identifier"},
                    "type": {"$ref": "#/$defs/dataType"},
                    "name": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/langString"},
                    },
                    "documentation": {
                        "type": "array",
                        "items": {"$ref": "#/$defs/preservedLangString"},
                    },
                    "extensions": {"$ref": "#/$defs/extensions"},
                },
            },
            "propertyDefinitions": {
                "type": "object",
                "additionalProperties": False,
                "required": ["propertyDefinition"],
                "properties": {
                    "propertyDefinition": {
                        "type": "array",
                        "minItems": 1,
                        "items": {"$ref": "#/$defs/propertyDefinition"},
                    }
                },
            },
            "dataType": {"type": "string", "enum": data_types},
            "accessTypeEnum": {"type": "string", "enum": access_types},
            "influenceStrengthEnum": {
                "type": "string",
                "enum": influence_strengths,
            },
            "influenceModifierType": {
                "anyOf": [
                    {"$ref": "#/$defs/influenceStrengthEnum"},
                    {"type": "string"},
                ]
            },
            "elementTypeEnum": {"type": "string", "enum": element_types},
            "compositeTypeEnum": {"type": "string", "enum": composite_types},
            "relationshipConnectorEnum": {
                "type": "string",
                "enum": relationship_connector_types,
            },
            "elementEnumType": {
                "anyOf": [
                    {"$ref": "#/$defs/elementTypeEnum"},
                    {"$ref": "#/$defs/compositeTypeEnum"},
                    {"$ref": "#/$defs/relationshipConnectorEnum"},
                ]
            },
            "relationshipTypeEnum": {"type": "string", "enum": relationship_types},
        },
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fetch the Open Group ArchiMate 3.1 HTML model and generate a JSON Schema projection."
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help="Source HTML model URL.",
    )
    parser.add_argument(
        "--input-html",
        type=Path,
        help="Optional local HTML file to parse instead of fetching the URL.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Output JSON Schema path.",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=DEFAULT_TIMEOUT_SECONDS,
        help="Network timeout in seconds when fetching the HTML model.",
    )
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS certificate verification for environments with broken SSL interception.",
    )
    parser.add_argument(
        "--fetch-method",
        choices=["auto", "urllib", "powershell"],
        default="auto",
        help="Fetch backend to use. 'auto' tries urllib first, then PowerShell on Windows.",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()

    try:
        if args.input_html:
            raw_html = args.input_html.read_text(encoding="utf-8")
            source_label = str(args.input_html)
        else:
            if args.fetch_method == "urllib":
                raw_html = fetch_html(args.url, args.timeout, args.insecure)
            elif args.fetch_method == "powershell":
                raw_html = fetch_html_via_powershell(args.url, args.timeout)
            else:
                try:
                    raw_html = fetch_html(args.url, args.timeout, args.insecure)
                except (TimeoutError, socket.timeout, ssl.SSLError, HTTPError, URLError, OSError):
                    if sys.platform.startswith("win"):
                        raw_html = fetch_html_via_powershell(args.url, args.timeout)
                    else:
                        raise
            source_label = args.url
    except FileNotFoundError as error:
        print(f"Input HTML file not found: {error}", file=sys.stderr)
        return 1
    except TimeoutError:
        print(
            "Timed out while fetching the ArchiMate HTML model. "
            "Retry with --timeout 60, or download the page manually and run with --input-html.",
            file=sys.stderr,
        )
        return 1
    except socket.timeout:
        print(
            "Timed out while fetching the ArchiMate HTML model. "
            "Retry with --timeout 60, or download the page manually and run with --input-html.",
            file=sys.stderr,
        )
        return 1
    except ssl.SSLError as error:
        print(
            "TLS/SSL error while fetching the ArchiMate HTML model: "
            f"{error}. If your network uses SSL interception, retry with --insecure or use --input-html.",
            file=sys.stderr,
        )
        return 1
    except HTTPError as error:
        print(f"HTTP error while fetching the ArchiMate HTML model: {error}", file=sys.stderr)
        return 1
    except RuntimeError as error:
        print(
            "Failed to fetch ArchiMate HTML model via PowerShell fallback: "
            f"{error}. You can also save the page locally and pass --input-html <path>.",
            file=sys.stderr,
        )
        return 1
    except URLError as error:
        print(
            "Failed to fetch ArchiMate HTML model: "
            f"{error}. You can also save the page locally and pass --input-html <path>.",
            file=sys.stderr,
        )
        return 1
    except OSError as error:
        print(
            "Failed to fetch ArchiMate HTML model: "
            f"{error}. You can also save the page locally and pass --input-html <path>.",
            file=sys.stderr,
        )
        return 1

    components = extract_components(raw_html)

    enum_sections = {
        key: html_fragment_to_text(value)
        for key, value in components.items()
        if key.startswith("Simple Type:")
    }

    element_types = extract_enumerations(enum_sections.get("Simple Type:ElementTypeEnum", ""))
    composite_types = extract_enumerations(enum_sections.get("Simple Type:CompositeTypeEnum", ""))
    relationship_connector_types = extract_enumerations(
        enum_sections.get("Simple Type:RelationshipConnectorEnum", "")
    )
    relationship_types = extract_enumerations(
        enum_sections.get("Simple Type:RelationshipTypeEnum", "")
    )
    data_types = extract_enumerations(enum_sections.get("Simple Type:DataType", ""))
    access_types = extract_enumerations(enum_sections.get("Simple Type:AccessTypeEnum", ""))
    influence_strengths = extract_enumerations(
        enum_sections.get("Simple Type:InfluenceStrengthEnum", "")
    )

    if not element_types or not relationship_types:
        print(
            "Could not extract enough type information from the HTML model. The page structure may have changed.",
            file=sys.stderr,
        )
        return 2

    schema = build_schema(
        source_label,
        element_types,
        composite_types,
        relationship_connector_types,
        relationship_types,
        data_types,
        access_types,
        influence_strengths,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote schema to: {args.output}")
    print(f"Element types: {len(element_types)}")
    print(f"Composite types: {len(composite_types)}")
    print(f"Relationship connector types: {len(relationship_connector_types)}")
    print(f"Relationship types: {len(relationship_types)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())