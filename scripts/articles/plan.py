#!/usr/bin/env python3
"""Stage 1: 74-topic plan. Outputs plan.json + plan.md with script-generated dates."""
import json, random, re, datetime as dt, collections, pathlib

ARCH, B2B, CLOUD, CACHE, PERF, MCP, INT, OPS = (
    "Magento Architecture", "Adobe Commerce B2B", "App Builder & Cloud", "Fastly & Caching",
    "Performance & New Relic", "MCP & Developer Tooling", "Enterprise Integrations", "DevOps & Infrastructure")

T = [
 (ARCH, "Hooking Product Saves So Admin, Import, and REST All Agree", ["plugins","observers","repositories"], "Decide where to intercept product saves when admin, REST, and import take different code paths."),
 (ARCH, "Loading Extension Attributes in getList() Without N+1 Queries", ["extension attributes","service contracts","performance"], "Populate extension attributes for repository list calls with one batched query instead of one per item."),
 (ARCH, "Virtual Types for Per-Integration Loggers and HTTP Clients", ["di.xml","virtualType","logging"], "Give each integration its own log file and client config through di.xml virtual types instead of subclasses."),
 (ARCH, "Declarative Schema: Renames, Drops, and the Whitelist File", ["declarative schema","db_schema.xml","upgrades"], "Explain why column renames and drops in db_schema.xml lose data or do nothing without the whitelist and onCreate rules."),
 (ARCH, "A Custom Indexer with Mview Changelogs for Partial Reindex", ["indexers","mview","update by schedule"], "Build an indexer that reindexes only changed rows through mview.xml subscriptions."),
 (ARCH, "One Queue Topic, Two Transports: MySQL and AMQP Consumers", ["message queues","RabbitMQ","consumers"], "Configure a topic that runs on the MySQL queue locally and on AMQP in production without code changes."),
 (ARCH, "Isolating Slow Jobs with a Dedicated Cron Group", ["cron","cron_groups.xml","scheduling"], "Stop a long export from delaying indexer cron jobs by moving it to its own cron group and process."),
 (ARCH, "Cacheable Custom GraphQL Queries with Identity Classes", ["GraphQL","cache tags","resolvers"], "Make a custom GraphQL query cacheable and invalidated correctly via @cache and an identity class."),
 (ARCH, "Admin Mass Actions That Publish to a Queue Instead of Timing Out", ["UI components","mass actions","queues"], "Replace a synchronous grid mass action that times out on 5,000 rows with a queued, trackable job."),
 (ARCH, "Reading Website-Scoped Config Correctly from Store Context", ["configuration","scopes","ScopeConfigInterface"], "Explain why a website-scoped setting reads the default value in cron, CLI, and API contexts, and how to fix it."),
 (ARCH, "What addAttributeToSelect('*') Costs on Large EAV Catalogs", ["EAV","collections","catalog performance"], "Measure and cut the cost of broad EAV attribute selection on product collections."),
 (ARCH, "Designing a Service Contract for a Custom Entity End to End", ["service contracts","repositories","SearchCriteria"], "Build data interface, repository, and search results for one entity so REST and internal code share one API."),
 (B2B, "Assigning Large SKU Sets to a Shared Catalog Without Admin Timeouts", ["shared catalog","REST","bulk"], "Move bulk shared catalog product assignment out of the admin UI into batched API calls."),
 (B2B, "Shared Catalog Prices vs Customer Group Prices on Big Catalogs", ["shared catalog","pricing","indexing"], "Choose between shared catalog custom prices and tier/group prices based on indexer and storage cost."),
 (B2B, "Carrying a Custom Field Through the Negotiable Quote Lifecycle", ["negotiable quote","quote","extension attributes"], "Keep a custom quote field intact from buyer request through seller edits to order placement."),
 (B2B, "Company Roles and a Custom Permission Resource for Buyers", ["company roles","permissions","ACL"], "Add a company-level permission and enforce it in a storefront controller."),
 (B2B, "Purchase Order Approval Rules: What to Configure and What to Build", ["purchase orders","approval rules","workflow"], "Decide when native approval rules cover a requirement and when a custom approval step is needed."),
 (B2B, "Syncing Companies and Company Users from an ERP via REST", ["company","REST","ERP"], "Create and update companies and their users from an ERP master without duplicating admins."),
 (B2B, "Order Visibility Across Company Hierarchies", ["company hierarchy","orders","B2B"], "Explain which orders parent and child company users can see and how to test it."),
 (B2B, "Payment on Account and Credit Limits Driven by an ERP", ["company credit","payment on account","integration"], "Keep company credit balances authoritative in the ERP while checkout still enforces limits."),
 (CLOUD, "Sending Order Events to App Builder with Commerce Eventing", ["App Builder","I/O Events","eventing"], "Subscribe to order events in Commerce and handle them in a Runtime action reliably."),
 (CLOUD, "Synchronous Webhooks for Cart Validation and Their Timeout Budget", ["webhooks","App Builder","checkout"], "Use Commerce webhooks to validate cart items externally without breaking checkout when the endpoint is slow."),
 (CLOUD, "Fast-Ack Runtime Actions for Async Processing", ["I/O Runtime","async","App Builder"], "Return quickly from a web action and do the heavy work asynchronously so callers do not retry duplicates."),
 (CLOUD, "Authenticating App Builder Actions Against Commerce APIs", ["OAuth","IMS","App Builder"], "Choose and implement the right credential type for a Runtime action calling Commerce REST."),
 (CLOUD, "Debugging Failed App Builder Deploys and Silent Activations", ["aio CLI","Runtime","troubleshooting"], "Trace an action that deploys fine but never runs, using activations and logs."),
 (CLOUD, "Filtering Event Payloads to Reduce Noise and Exposure", ["eventing","payload filtering","security"], "Send only needed fields and only relevant events to downstream consumers."),
 (CLOUD, "Static Content on Build vs Deploy in Commerce Cloud", ["ece-tools","SCD","Cloud"], "Decide where static content deployment runs to shorten downtime on Cloud deploys."),
 (CLOUD, "Per-Environment Settings with .magento.env.yaml and Env Variables", ["Cloud","configuration","env.php"], "Keep staging and production differences out of code and the database."),
 (CLOUD, "Reading a Failed Commerce Cloud Deployment from Its Logs", ["Cloud","deployment","logs"], "Locate the actual failing step of a Cloud deploy from activity and cloud logs."),
 (CACHE, "Why Category Pages Stay Stale After a Reindex on Fastly", ["Fastly","purge","cache tags"], "Explain how soft purge, tag selection, and indexer timing leave stale category pages, and how to fix it."),
 (CACHE, "A Custom VCL Snippet to Bypass Cache for One Query Parameter", ["Fastly","VCL","snippets"], "Bypass the cache for a single tracking or preview parameter without hurting the hit rate elsewhere."),
 (CACHE, "Custom Blocks That Never Invalidate: Cache Tags and Identities", ["FPC","cache tags","IdentityInterface"], "Make a custom block's output purge when its source entity changes."),
 (CACHE, "Diagnosing a Fastly MISS with Debug Headers", ["Fastly","debugging","headers"], "Read Fastly debug headers to see why a page that should hit keeps missing."),
 (CACHE, "Reproducing FPC Bugs Locally with Varnish in DDEV", ["Varnish","DDEV","FPC"], "Run Varnish locally so cache bugs reproduce before they reach Fastly."),
 (CACHE, "GraphQL Caching: GET Requests, Cache IDs, and Store Headers", ["GraphQL","caching","Fastly"], "Explain what makes GraphQL responses cacheable and why some never are."),
 (CACHE, "How One cacheable=\"false\" Block Disables Full-Page Cache", ["FPC","layout XML","private content"], "Find and replace layout blocks that silently make whole pages uncacheable."),
 (CACHE, "Fastly 503 First-Byte Timeouts on Long Admin Requests", ["Fastly","timeouts","admin"], "Stop long admin exports and imports from failing at the edge."),
 (CACHE, "How to Remove a Fastly VCL Snippet Using CLI", ["Fastly","VCL","CLI"], "KEEP AS-IS: manually written article, content untouched."),
 (PERF, "Reading a New Relic Trace for a Slow Category Page", ["New Relic","APM","catalog"], "Walk through a transaction trace to find the segment that actually costs time."),
 (PERF, "Naming Cron and Consumer Transactions in New Relic", ["New Relic","cron","queues"], "Make background work show up as distinct, named transactions instead of one blob."),
 (PERF, "NRQL Queries for Checkout Latency by Store and Step", ["NRQL","checkout","New Relic"], "Build NRQL queries that show which checkout calls slowed down and for which store."),
 (PERF, "From New Relic Slow Query to an Index That Helps", ["MySQL","EXPLAIN","New Relic"], "Take a slow query from APM, confirm it with EXPLAIN, and add an index through declarative schema."),
 (PERF, "Distributed Tracing Across Magento and External APIs", ["distributed tracing","New Relic","integrations"], "Follow one request from storefront through Magento to a downstream API."),
 (PERF, "Deployment Markers and Error-Rate Alerts After Releases", ["New Relic","alerts","deployments"], "Catch a bad release within minutes using deployment markers and alert conditions."),
 (PERF, "Investigating a Performance Regression Between Two Releases", ["regression","profiling","releases"], "Isolate which change in a release caused a latency jump."),
 (PERF, "Counting the Cost of Plugin Chains on Hot Methods", ["interceptors","plugins","profiling"], "Measure interceptor overhead on frequently called methods and decide what to remove."),
 (PERF, "Why Quote Totals Are Collected Many Times per Checkout Request", ["totals collectors","checkout","quote"], "Find repeated collectTotals calls and custom collectors that multiply checkout latency."),
 (MCP, "A Read-Only MCP Server Architecture for Magento Diagnostics", ["MCP","architecture","diagnostics"], "Design an MCP server that answers environment questions without the ability to change anything."),
 (MCP, "Exposing bin/magento Commands as Allowlisted MCP Tools", ["MCP","CLI","security"], "Wrap a fixed set of read-only Magento commands as MCP tools with argument validation."),
 (MCP, "Environment Discovery: DDEV, Docker, or Cloud from Project Files", ["MCP","DDEV","environment"], "Detect how to run commands in a project before running any."),
 (MCP, "Log Triage Tools with Redaction and Output Caps", ["MCP","logs","redaction"], "Return useful exception log summaries to an AI client without leaking secrets or flooding context."),
 (MCP, "Database Metadata Without Data: Schema Introspection for AI Tools", ["MCP","database","schema"], "Expose tables, columns, and indexes to an assistant while keeping row data out of reach."),
 (MCP, "A devtools:health CLI Command for Deployment Readiness", ["MaheshDave_DevTools","CLI","health checks"], "Build one CLI command that reports indexer, cron, cache, and queue readiness as JSON."),
 (MCP, "An Admin Page for Auditing Diagnostic Tool Calls", ["MaheshDave_DevTools","admin UI","audit"], "Record and review which diagnostics ran, by whom, and when, in a Magento admin grid."),
 (MCP, "Execution Boundaries for AI-Driven Magento CLI Workflows", ["MCP","timeouts","safety"], "Define timeouts, write-command denials, and confirmation steps for assistant-run commands."),
 (INT, "An Outbox Table for Reliable Order Export to an ERP", ["ERP","outbox","queues"], "Guarantee every placed order reaches the ERP exactly once despite crashes and retries."),
 (INT, "Stock Sync from Odoo over JSON-RPC Without Overselling", ["Odoo","inventory","MSI"], "Pull Odoo stock levels into MSI sources safely around reservations."),
 (INT, "Mapping SPS Commerce EDI 850, 856, and 810 to Magento Entities", ["EDI","SPS Commerce","orders"], "Map purchase order, ship notice, and invoice documents to orders, shipments, and invoices."),
 (INT, "Creating Shipments and Invoices from ERP Callbacks", ["ShipOrderInterface","InvoiceOrderInterface","ERP"], "Create shipments and invoices from ERP data through sales service contracts, idempotently."),
 (INT, "A Payment Method on the Gateway Command Pool Pattern", ["payment gateway","command pool","checkout"], "Implement authorize and capture for a third-party gateway using Magento's payment gateway framework."),
 (INT, "Bulk MSI Source Item Updates from an External Feed", ["MSI","SourceItemsSaveInterface","inventory"], "Update thousands of source items per run without per-SKU saves."),
 (INT, "Large Product Loads Through the Asynchronous Bulk REST API", ["bulk API","async","import"], "Push large product batches through async bulk endpoints and track per-item results."),
 (INT, "Price and Data Scope Pitfalls in Multi-Website Integrations", ["multi-website","scopes","pricing"], "Explain why integration writes land in the wrong scope and how to target the correct store."),
 (INT, "A Custom Checkout Step with Server-Side Validation", ["checkout","UI components","validation"], "Add a checkout step whose data is validated on the server, not only in Knockout."),
 (INT, "Two-Way CRM Customer Sync and Conflict Resolution", ["CRM","customers","sync"], "Decide which system wins per field and avoid update loops in a bidirectional customer sync."),
 (OPS, "A DDEV Setup for Magento 2.4.7 with OpenSearch and Redis", ["DDEV","OpenSearch","Redis"], "Build a reproducible local stack matching production service versions."),
 (OPS, "Moving a Magento Codebase from PHP 8.1 to 8.3", ["PHP 8.3","upgrade","static analysis"], "Find and fix PHP incompatibilities before an upgrade breaks production."),
 (OPS, "Migrating MySQL 5.7 to MySQL 8 or MariaDB Without Surprises", ["MySQL","MariaDB","migration"], "Avoid collation, SQL mode, and reserved-word failures during a database engine migration."),
 (OPS, "Elasticsearch 7 to OpenSearch 2 Cutover for Magento", ["OpenSearch","search","migration"], "Switch the search engine with a tested reindex and rollback path."),
 (OPS, "When a Deploy Actually Needs Maintenance Mode", ["zero downtime","deployment","setup:db:status"], "Use schema/data status checks to skip maintenance mode on releases without schema changes."),
 (OPS, "Composer Patches vs the Quality Patches Tool", ["Composer","patches","QPT"], "Choose how to apply core fixes so they survive upgrades and stay auditable."),
 (OPS, "A CI Pipeline That Compiles DI and Builds Static Content Once", ["CI/CD","GitHub Actions","build"], "Build an artifact once in CI so production never compiles code."),
 (OPS, "Diagnosing 502s from PHP-FPM Pool Exhaustion", ["PHP-FPM","Nginx","troubleshooting"], "Tell FPM exhaustion apart from slow upstreams and size the pool from evidence."),
 (OPS, "Sanitizing a Production Database Dump for Staging", ["database","staging","privacy"], "Produce a staging copy without customer PII or live integration credentials."),
]

assert len(T) == 74, len(T)
slug = lambda s: re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-")
rng = random.Random(20261112)
start, end = dt.date(2024, 1, 1), dt.date(2026, 9, 30)
days = (end - start).days
bin_size = days / 74
dates = [start + dt.timedelta(days=int(i * bin_size + rng.random() * bin_size)) for i in range(74)]
rng.shuffle(dates)

plan = []
for i, (cat, title, tags, purpose) in enumerate(T, 1):
    plan.append({"id": f"draft-{i:03d}", "title": title, "slug": slug(title), "category": cat,
                 "tags": tags, "published_at": dates[i - 1].isoformat(), "purpose": purpose})

assert len({p["slug"] for p in plan}) == 74 and len({p["title"] for p in plan}) == 74
months = collections.Counter(p["published_at"][:7] for p in plan)
assert max(months.values()) <= 6, months

out = pathlib.Path(__file__).parent
(out / "plan.json").write_text(json.dumps(plan, indent=2, ensure_ascii=False))
md = ["| ID | Date | Category | Title | Purpose |", "|---|---|---|---|---|"]
md += [f"| {p['id']} | {p['published_at']} | {p['category']} | {p['title']} | {p['purpose']} |" for p in plan]
(out / "plan.md").write_text("\n".join(md) + "\n")
print("ok", len(plan), "months used:", len(months), "max/month:", max(months.values()))
