#!/usr/bin/env python3
"""Upsert finished articles into public/articles-content.json in place.

Source files: scripts/articles/content/<id>.html, starting with <!--meta {...} -->
(excerpt, seo_title, seo_description). Code blocks are escaped here.
The manually written Fastly CLI article keeps its content; only its slot and metadata change.
Entries not in this batch are left untouched.

Usage: build.py [--check-only]
"""
import collections, html, json, pathlib, re, shutil, sys, datetime as dt
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = ROOT / "scripts/articles"
OUT = ROOT / "public/articles-content.json"
BACKUP = HERE / "articles-content.before-upsert.json"
MANUAL_TITLE = "How to Remove a Fastly VCL Snippet Using CLI"
MANUAL_META = {
    "excerpt": "Remove a custom Fastly VCL snippet that locks you out of Magento admin by cloning the active version, deleting the snippet, validating, and activating through the API or CLI.",
    "seo_title": "Remove a Fastly VCL Snippet Using the CLI",
    "seo_description": "Back up, clone, delete, validate, and activate: removing a Fastly VCL snippet from Adobe Commerce safely via the Fastly API or CLI, with rollback steps.",
}
CODE_RE = re.compile(r'(<pre><code class="language-[a-z]+">)(.*?)(</code></pre>)', re.S)
META_RE = re.compile(r"^\s*<!--meta\s+(\{.*?\})\s*-->\s*", re.S)
VOID = {"br", "hr", "img", "input", "meta", "link", "wbr"}
BANNED = ["let's dive", "game-changer", "seamless", "robust", "leverage", "unlock",
          "fast-paced", "in conclusion", "key takeaways", "todo", "add your logic"]
errors = []


class Balance(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.bad = [], []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.bad.append(f"unexpected </{tag}>")


def escape_code(body):
    def fix(m):
        raw = m.group(2)
        if "&lt;" in raw or "&amp;" in raw or "&gt;" in raw:
            raw = html.unescape(raw)
        return m.group(1) + html.escape(raw.strip("\n"), quote=False) + m.group(3)
    return CODE_RE.sub(fix, body)


def text_of(fragment):
    return html.unescape(re.sub(r"<[^>]+>", "", fragment)).strip()


def check_article(a):
    b = Balance()
    b.feed(a["content"])
    b.close()
    if b.bad or b.stack:
        errors.append(f"{a['id']} html: {b.bad[:3]} unclosed={b.stack[-3:]}")
    for m in CODE_RE.finditer(a["content"]):
        if "<" in m.group(2) or re.search(r"&(?!lt;|gt;|amp;|quot;|#)", m.group(2)):
            errors.append(f"{a['id']} unescaped code block")
    plain = text_of(a["content"]).lower()
    for bad in BANNED:
        if bad in plain:
            errors.append(f"{a['id']} banned phrase '{bad}'")
    if re.search(r"^\s*\.\.\.\s*$|//\s*\.\.\.|#\s*\.\.\.$", a["content"], re.M):
        errors.append(f"{a['id']} placeholder '...' in code")


def main():
    base = json.loads(OUT.read_text())["articles"]
    plan = {p["title"]: p for p in json.loads((HERE / "plan.json").read_text())}
    result = list(base)
    written = []

    for title, p in plan.items():
        if title == MANUAL_TITLE:
            src = next((a for a in base if a["title"] == MANUAL_TITLE), None)
            if src is None:
                errors.append("manual Fastly article not found")
                continue
            meta, content = MANUAL_META, src["content"]
            cover, is_manual = src.get("cover_image_url", ""), True
        else:
            f = HERE / "content" / f"{p['id']}.html"
            if not f.exists():
                continue
            raw = f.read_text()
            m = META_RE.match(raw)
            if not m:
                errors.append(f"{p['id']}: no meta comment")
                continue
            meta, content = json.loads(m.group(1)), escape_code(raw[m.end():].strip())
            cover, is_manual = "", False

        art = {
            "id": p["id"], "title": p["title"], "slug": p["slug"], "category": p["category"],
            "excerpt": meta["excerpt"], "content": content, "cover_image_url": cover,
            "status": "published", "published_at": p["published_at"], "created_at": None,
            "updated_at": None, "author": "Mahesh Dave", "tags": p["tags"],
            "seo_title": meta["seo_title"], "seo_description": meta["seo_description"],
            "canonical_url": "",
        }
        idx = next((i for i, a in enumerate(result)
                    if a["id"] == art["id"] or a["title"] == art["title"]), None)
        if idx is None:
            result.append(art)
        else:
            result[idx] = art
        result = [a for a in result if a is art or a["title"] != art["title"]]
        if not is_manual:
            written.append(art)

    for a in written:
        check_article(a)
        d = dt.date.fromisoformat(a["published_at"])
        if not dt.date(2024, 1, 1) <= d <= dt.date(2026, 9, 30):
            errors.append(f"{a['id']} date out of range")
    for key in ["id", "title", "slug", "seo_title"]:
        dup = [v for v, c in collections.Counter(a[key] for a in result).items() if c > 1]
        if dup:
            errors.append(f"duplicate {key}: {dup}")

    if errors:
        for e in errors:
            print("ERROR", e)
        sys.exit(1)
    if "--check-only" in sys.argv:
        print(f"checks ok, would write {len(result)} articles")
        return
    shutil.copy(OUT, BACKUP)
    OUT.write_text(json.dumps({"articles": result}, indent=2, ensure_ascii=False) + "\n")
    json.loads(OUT.read_text())
    print(f"upserted {len(written) + 1} articles; file now has {len(result)}; checks ok")


if __name__ == "__main__":
    main()
