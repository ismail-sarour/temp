import re
from pathlib import Path

PAGES = Path(__file__).resolve().parent.parent / "frontend" / "src" / "pages"

for path in PAGES.glob("*.jsx"):
    if path.name == "GestionBudget.jsx":
        continue

    text = path.read_text(encoding="utf-8")
    orig = text

    text = re.sub(
        r"localStorage\.getItem\((['\"])([^'\"]+)\1\)",
        r"getData(\1\2\1)",
        text,
    )
    text = re.sub(
        r"localStorage\.setItem\((['\"])([^'\"]+)\1\s*,\s*JSON\.stringify\(([^)]+)\)\)",
        r"setData(\1\2\1, \3)",
        text,
    )
    text = re.sub(r"JSON\.parse\(getData\(", "getData(", text)

    # if (x) setState(JSON.parse(x))  ->  setState(getData('key', []))
    def fix_if_parse(m):
        var = m.group(1)
        setter = m.group(2)
        return f"set{setter}(getData('{var}Key'))"

    text = re.sub(
        r"const (\w+) = getData\((['\"])([^'\"]+)\2\);\s*\n\s*if \(\1\) set(\w+)\(\1\);",
        lambda m: f"set{m.group(3)}(getData({m.group(2)}{m.group(4)}{m.group(2)}, []));",
        text,
    )

    # Common pattern: const f = getData("familles"); if (f) setFamilles(f);
    text = re.sub(
        r"const (\w+) = getData\((['\"])([^'\"]+)\2\);\s*\n(\s*)if \(\1\) set(\w+)\(\1\);",
        lambda m: f"{m.group(4)}set{m.group(5)}(getData({m.group(2)}{m.group(3)}{m.group(2)}, []));",
        text,
    )

    if ("getData" in text or "setData" in text) and "dataStore" not in text:
        lines = text.split("\n")
        last_imp = 0
        for i, line in enumerate(lines):
            if line.startswith("import "):
                last_imp = i
        lines.insert(last_imp + 1, 'import { getData, setData } from "../services/dataStore";')
        text = "\n".join(lines)

    if text != orig:
        path.write_text(text, encoding="utf-8")
        print("patched", path.name)
