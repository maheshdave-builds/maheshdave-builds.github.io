#!/usr/bin/env python3
"""Build public/articles-content.json with exactly 30 articles.

Sources:
  content/draft-001.html .. draft-029.html  (<!--meta {...}--> then HTML; code escaped here)
  keep-fastly-content.html                  (manual Fastly CLI article, not modified)
"""
import collections, datetime as dt, html, json, pathlib, random, re, sys
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "public/articles-content.json"
CODE_RE = re.compile(r'(<pre><code class="language-[a-z]+">)(.*?)(</code></pre>)', re.S)
META_RE = re.compile(r"^\s*<!--meta\s+(\{.*?\})\s*-->\s*", re.S)
VOID = {"br", "hr", "img", "input", "meta", "link", "wbr"}

# id, title, category, tags. draft-030 is the manual Fastly article.
PLAN = [
("draft-001", "Hooking Product Saves So Admin, Import, and REST All Agree", "Customization", ["plugins", "observers", "catalog"]),
("draft-002", "Loading Extension Attributes in getList() Without N+1 Queries", "API", ["extension attributes", "repositories", "REST"]),
("draft-003", "Virtual Types for Per-Integration Loggers and HTTP Clients", "Customization", ["di.xml", "virtualType", "logging"]),
("draft-004", "Declarative Schema: Renames, Drops, and the Whitelist File", "Customization", ["declarative schema", "db_schema.xml", "upgrades"]),
("draft-005", "A Custom Indexer with Mview Changelogs for Partial Reindex", "Customization", ["indexers", "mview", "catalog"]),
("draft-006", "One Queue Topic on MySQL Locally and RabbitMQ in Production", "Customization", ["message queues", "RabbitMQ", "consumers"]),
("draft-007", "A Product Field in GraphQL That Does Not Query Once Per Item", "GraphQL", ["GraphQL", "resolvers", "N+1"]),
("draft-008", "Why a GraphQL Query Never Hits Fastly", "GraphQL", ["GraphQL", "Fastly", "caching"]),
("draft-009", "A REST Endpoint That Shares Its Service Contract with Cron", "API", ["REST", "webapi.xml", "service contracts"]),
("draft-010", "An Admin Grid Whose Collection Is Not Loaded in the Browser", "Admin UI", ["UI components", "grid", "data provider"]),
("draft-011", "A Mass Action That Queues Work Instead of Timing Out", "Admin UI", ["mass actions", "queues", "admin"]),
("draft-012", "Website-Scoped Config That Reads the Default Value from Cron", "Customization", ["configuration", "scopes", "cron"]),
("draft-013", "SearchCriteria Filters That Silently Return the Wrong Page", "API", ["SearchCriteria", "repositories", "REST"]),
("draft-014", "Category Pages That Stay Stale After a Catalog Reindex", "Fastly", ["Fastly", "cache tags", "indexers"]),
("draft-015", "Bypassing Fastly for One Query Parameter Only", "Fastly", ["Fastly", "VCL", "caching"]),
("draft-016", "A Custom Block Fastly Never Purges", "Fastly", ["FPC", "IdentityInterface", "cache tags"]),
("draft-017", "The Block That Turns Off Full-Page Cache for the Whole Page", "Fastly", ["FPC", "private content", "layout"]),
("draft-018", "Naming Cron and Consumer Transactions in New Relic", "New Relic", ["New Relic", "cron", "queues"]),
("draft-019", "NRQL for Checkout Latency by Store", "New Relic", ["NRQL", "checkout", "New Relic"]),
("draft-020", "From a New Relic Slow Query to an Index You Can Ship", "New Relic", ["New Relic", "MySQL", "declarative schema"]),
("draft-021", "Ack an Order Event in App Builder Before the Work Starts", "App Builder", ["App Builder", "I/O Runtime", "events"]),
("draft-022", "A Webhook Receiver That Survives Retries", "API", ["webhooks", "idempotency", "security"]),
("draft-023", "An Outbox So Placed Orders Reach the ERP After a Crash", "Integrations", ["ERP", "outbox", "orders"]),
("draft-024", "Updating MSI Source Items in Bulk from an External Feed", "Integrations", ["MSI", "inventory", "API"]),
("draft-025", "Price Writes That Land in the Wrong Website", "API", ["multi-website", "pricing", "stores"]),
("draft-026", "Blocking Checkout for a Company That Is Not Approved", "B2B", ["company", "checkout", "B2B"]),
("draft-027", "Server-Side Validation for a Custom Checkout Field", "Customization", ["checkout", "quote", "validation"]),
("draft-028", "An around Plugin That Called proceed() Twice", "Customization", ["plugins", "interceptors", "checkout"]),
("draft-029", "A Read-Only Health Command for Magento Diagnostics", "Developer Tooling", ["MaheshDave_DevTools", "CLI", "diagnostics"]),
("draft-030", "How to Remove a Fastly VCL Snippet Using CLI", "Fastly", ["Fastly", "VCL", "CLI"]),
]

FASTLY = {
    "slug": "how-to-remove-a-fastly-vcl-snippet-using-cli",
    "published_at": "2026-08-08",
    "cover_image_url": "/uploads/articles/1792929004320-xnvm0p.jpg",
    "excerpt": "Remove a custom Fastly VCL snippet that locks you out of Magento admin by cloning the active version, deleting the snippet, validating, and activating through the API or CLI.",
    "seo_title": "Remove a Fastly VCL Snippet Using the CLI",
    "seo_description": "Back up, clone, delete, validate, and activate: removing a Fastly VCL snippet from Adobe Commerce safely via the Fastly API or CLI, with rollback steps.",
}


def slugify(title):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", title.lower())).strip("-")


def dates_for(n, reserved):
    rng = random.Random(20261112)
    start, end = dt.date(2024, 1, 8), dt.date(2026, 9, 20)
    span = (end - start).days
    out = []
    for i in range(n):
        day = start + dt.timedelta(days=int(i * span / n) + rng.randint(0, 6))
        if day > end:
            day = end
        out.append(day)
    rng.shuffle(out)
    fixed = dt.date.fromisoformat(reserved)
    out = [d for d in out if d != fixed]
    return out


def escape_code(body):
    def fix(m):
        raw = m.group(2)
        if "&lt;" in raw or "&amp;" in raw or "&gt;" in raw:
            raw = html.unescape(raw)
        return m.group(1) + html.escape(raw.strip("\n"), quote=False) + m.group(3)
    return CODE_RE.sub(fix, body)


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
            self.bad.append(tag)


def main():
    pool = dates_for(29, FASTLY["published_at"])
    di = 0
    articles, errors = [], []
    for id_, title, category, tags in PLAN:
        if id_ == "draft-030":
            content = (HERE / "keep-fastly-content.html").read_text()
            art = {
                "id": id_, "title": title, "slug": FASTLY["slug"], "category": category,
                "excerpt": FASTLY["excerpt"], "content": content,
                "cover_image_url": FASTLY["cover_image_url"], "status": "published",
                "published_at": FASTLY["published_at"], "created_at": None, "updated_at": None,
                "author": "Mahesh Dave", "tags": tags, "seo_title": FASTLY["seo_title"],
                "seo_description": FASTLY["seo_description"], "canonical_url": "",
            }
        else:
            raw = (HERE / "content" / f"{id_}.html").read_text()
            m = META_RE.match(raw)
            if not m:
                errors.append(f"{id_}: no meta")
                continue
            meta = json.loads(m.group(1))
            art = {
                "id": id_, "title": title, "slug": slugify(title), "category": category,
                "excerpt": meta["excerpt"], "content": escape_code(raw[m.end():].strip()),
                "cover_image_url": "", "status": "published",
                "published_at": pool[di].isoformat(), "created_at": None, "updated_at": None,
                "author": "Mahesh Dave", "tags": tags, "seo_title": meta["seo_title"],
                "seo_description": meta["seo_description"], "canonical_url": "",
            }
            di += 1
            b = Balance()
            b.feed(art["content"])
            b.close()
            if b.bad or b.stack:
                errors.append(f"{id_} html unclosed={b.stack[-4:]} bad={b.bad[:4]}")
            for block in CODE_RE.finditer(art["content"]):
                if "<" in block.group(2) or re.search(r"&(?!lt;|gt;|amp;|quot;|#)", block.group(2)):
                    errors.append(f"{id_} unescaped code")
            plain = html.unescape(re.sub(r"<[^>]+>", "", art["content"])).lower()
            for bad in ["let's dive", "game-changer", "seamless", "robust", "leverage", "unlock", "fast-paced", "key takeaways", "add your logic"]:
                if bad in plain:
                    errors.append(f"{id_} banned '{bad}'")
            if len(plain.split()) < 450:
                errors.append(f"{id_} only {len(plain.split())} words")
            if len(art["seo_title"]) > 60:
                errors.append(f"{id_} seo_title {len(art['seo_title'])}")
            if len(art["seo_description"]) > 155:
                errors.append(f"{id_} seo_description {len(art['seo_description'])}")
        articles.append(art)

    if len(articles) != 30:
        errors.append(f"count {len(articles)}")
    months = collections.Counter(a["published_at"][:7] for a in articles)
    if max(months.values()) > 3:
        errors.append(f"month cluster {months.most_common(3)}")
    for key in ["id", "title", "slug", "seo_title"]:
        dup = [v for v, c in collections.Counter(a[key] for a in articles).items() if c > 1]
        if dup:
            errors.append(f"duplicate {key}: {dup}")
    heads = collections.defaultdict(list)
    for a in articles:
        if a["id"] == "draft-030":
            continue
        for h in re.findall(r"<h2>(.*?)</h2>", a["content"], re.S):
            t = html.unescape(re.sub(r"<[^>]+>", "", h)).strip().lower()
            heads[t].append(a["id"])
    for t, ids in heads.items():
        if len(ids) > 1:
            errors.append(f"repeated h2 '{t}' in {ids}")

    if errors:
        print("\n".join(errors))
        sys.exit(1)
    OUT.write_text(json.dumps({"articles": articles}, indent=2, ensure_ascii=False) + "\n")
    json.loads(OUT.read_text())
    print(f"wrote {len(articles)} articles")


if __name__ == "__main__":
    main()
