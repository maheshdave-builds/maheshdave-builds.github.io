| ID | Date | Category | Title | Purpose |
|---|---|---|---|---|
| draft-001 | 2026-05-13 | Magento Architecture | Hooking Product Saves So Admin, Import, and REST All Agree | Decide where to intercept product saves when admin, REST, and import take different code paths. |
| draft-002 | 2025-06-29 | Magento Architecture | Loading Extension Attributes in getList() Without N+1 Queries | Populate extension attributes for repository list calls with one batched query instead of one per item. |
| draft-003 | 2024-07-09 | Magento Architecture | Virtual Types for Per-Integration Loggers and HTTP Clients | Give each integration its own log file and client config through di.xml virtual types instead of subclasses. |
| draft-004 | 2024-02-20 | Magento Architecture | Declarative Schema: Renames, Drops, and the Whitelist File | Explain why column renames and drops in db_schema.xml lose data or do nothing without the whitelist and onCreate rules. |
| draft-005 | 2025-03-18 | Magento Architecture | A Custom Indexer with Mview Changelogs for Partial Reindex | Build an indexer that reindexes only changed rows through mview.xml subscriptions. |
| draft-006 | 2026-03-19 | Magento Architecture | One Queue Topic, Two Transports: MySQL and AMQP Consumers | Configure a topic that runs on the MySQL queue locally and on AMQP in production without code changes. |
| draft-007 | 2025-04-28 | Magento Architecture | Isolating Slow Jobs with a Dedicated Cron Group | Stop a long export from delaying indexer cron jobs by moving it to its own cron group and process. |
| draft-008 | 2024-02-27 | Magento Architecture | Cacheable Custom GraphQL Queries with Identity Classes | Make a custom GraphQL query cacheable and invalidated correctly via @cache and an identity class. |
| draft-009 | 2025-08-31 | Magento Architecture | Admin Mass Actions That Publish to a Queue Instead of Timing Out | Replace a synchronous grid mass action that times out on 5,000 rows with a queued, trackable job. |
| draft-010 | 2026-02-28 | Magento Architecture | Reading Website-Scoped Config Correctly from Store Context | Explain why a website-scoped setting reads the default value in cron, CLI, and API contexts, and how to fix it. |
| draft-011 | 2024-01-03 | Magento Architecture | What addAttributeToSelect('*') Costs on Large EAV Catalogs | Measure and cut the cost of broad EAV attribute selection on product collections. |
| draft-012 | 2025-04-06 | Magento Architecture | Designing a Service Contract for a Custom Entity End to End | Build data interface, repository, and search results for one entity so REST and internal code share one API. |
| draft-013 | 2025-01-06 | Adobe Commerce B2B | Assigning Large SKU Sets to a Shared Catalog Without Admin Timeouts | Move bulk shared catalog product assignment out of the admin UI into batched API calls. |
| draft-014 | 2024-08-27 | Adobe Commerce B2B | Shared Catalog Prices vs Customer Group Prices on Big Catalogs | Choose between shared catalog custom prices and tier/group prices based on indexer and storage cost. |
| draft-015 | 2025-10-07 | Adobe Commerce B2B | Carrying a Custom Field Through the Negotiable Quote Lifecycle | Keep a custom quote field intact from buyer request through seller edits to order placement. |
| draft-016 | 2024-10-23 | Adobe Commerce B2B | Company Roles and a Custom Permission Resource for Buyers | Add a company-level permission and enforce it in a storefront controller. |
| draft-017 | 2024-12-09 | Adobe Commerce B2B | Purchase Order Approval Rules: What to Configure and What to Build | Decide when native approval rules cover a requirement and when a custom approval step is needed. |
| draft-018 | 2026-06-25 | Adobe Commerce B2B | Syncing Companies and Company Users from an ERP via REST | Create and update companies and their users from an ERP master without duplicating admins. |
| draft-019 | 2024-04-24 | Adobe Commerce B2B | Order Visibility Across Company Hierarchies | Explain which orders parent and child company users can see and how to test it. |
| draft-020 | 2025-12-07 | Adobe Commerce B2B | Payment on Account and Credit Limits Driven by an ERP | Keep company credit balances authoritative in the ERP while checkout still enforces limits. |
| draft-021 | 2024-05-31 | App Builder & Cloud | Sending Order Events to App Builder with Commerce Eventing | Subscribe to order events in Commerce and handle them in a Runtime action reliably. |
| draft-022 | 2025-11-09 | App Builder & Cloud | Synchronous Webhooks for Cart Validation and Their Timeout Budget | Use Commerce webhooks to validate cart items externally without breaking checkout when the endpoint is slow. |
| draft-023 | 2026-01-23 | App Builder & Cloud | Fast-Ack Runtime Actions for Async Processing | Return quickly from a web action and do the heavy work asynchronously so callers do not retry duplicates. |
| draft-024 | 2025-09-22 | App Builder & Cloud | Authenticating App Builder Actions Against Commerce APIs | Choose and implement the right credential type for a Runtime action calling Commerce REST. |
| draft-025 | 2024-12-29 | App Builder & Cloud | Debugging Failed App Builder Deploys and Silent Activations | Trace an action that deploys fine but never runs, using activations and logs. |
| draft-026 | 2024-11-29 | App Builder & Cloud | Filtering Event Payloads to Reduce Noise and Exposure | Send only needed fields and only relevant events to downstream consumers. |
| draft-027 | 2025-05-27 | App Builder & Cloud | Static Content on Build vs Deploy in Commerce Cloud | Decide where static content deployment runs to shorten downtime on Cloud deploys. |
| draft-028 | 2025-01-18 | App Builder & Cloud | Per-Environment Settings with .magento.env.yaml and Env Variables | Keep staging and production differences out of code and the database. |
| draft-029 | 2026-07-20 | App Builder & Cloud | Reading a Failed Commerce Cloud Deployment from Its Logs | Locate the actual failing step of a Cloud deploy from activity and cloud logs. |
| draft-030 | 2025-06-03 | Fastly & Caching | Why Category Pages Stay Stale After a Reindex on Fastly | Explain how soft purge, tag selection, and indexer timing leave stale category pages, and how to fix it. |
| draft-031 | 2024-07-26 | Fastly & Caching | A Custom VCL Snippet to Bypass Cache for One Query Parameter | Bypass the cache for a single tracking or preview parameter without hurting the hit rate elsewhere. |
| draft-032 | 2025-01-28 | Fastly & Caching | Custom Blocks That Never Invalidate: Cache Tags and Identities | Make a custom block's output purge when its source entity changes. |
| draft-033 | 2024-06-14 | Fastly & Caching | Diagnosing a Fastly MISS with Debug Headers | Read Fastly debug headers to see why a page that should hit keeps missing. |
| draft-034 | 2024-11-07 | Fastly & Caching | Reproducing FPC Bugs Locally with Varnish in DDEV | Run Varnish locally so cache bugs reproduce before they reach Fastly. |
| draft-035 | 2025-12-01 | Fastly & Caching | GraphQL Caching: GET Requests, Cache IDs, and Store Headers | Explain what makes GraphQL responses cacheable and why some never are. |
| draft-036 | 2024-04-15 | Fastly & Caching | How One cacheable="false" Block Disables Full-Page Cache | Find and replace layout blocks that silently make whole pages uncacheable. |
| draft-037 | 2025-08-04 | Fastly & Caching | Fastly 503 First-Byte Timeouts on Long Admin Requests | Stop long admin exports and imports from failing at the edge. |
| draft-038 | 2026-08-08 | Fastly & Caching | How to Remove a Fastly VCL Snippet Using CLI | KEEP AS-IS: manually written article, content untouched. |
| draft-039 | 2025-09-03 | Performance & New Relic | Reading a New Relic Trace for a Slow Category Page | Walk through a transaction trace to find the segment that actually costs time. |
| draft-040 | 2024-09-23 | Performance & New Relic | Naming Cron and Consumer Transactions in New Relic | Make background work show up as distinct, named transactions instead of one blob. |
| draft-041 | 2026-05-18 | Performance & New Relic | NRQL Queries for Checkout Latency by Store and Step | Build NRQL queries that show which checkout calls slowed down and for which store. |
| draft-042 | 2025-05-10 | Performance & New Relic | From New Relic Slow Query to an Index That Helps | Take a slow query from APM, confirm it with EXPLAIN, and add an index through declarative schema. |
| draft-043 | 2024-02-02 | Performance & New Relic | Distributed Tracing Across Magento and External APIs | Follow one request from storefront through Magento to a downstream API. |
| draft-044 | 2026-09-28 | Performance & New Relic | Deployment Markers and Error-Rate Alerts After Releases | Catch a bad release within minutes using deployment markers and alert conditions. |
| draft-045 | 2024-10-02 | Performance & New Relic | Investigating a Performance Regression Between Two Releases | Isolate which change in a release caused a latency jump. |
| draft-046 | 2025-03-25 | Performance & New Relic | Counting the Cost of Plugin Chains on Hot Methods | Measure interceptor overhead on frequently called methods and decide what to remove. |
| draft-047 | 2025-10-18 | Performance & New Relic | Why Quote Totals Are Collected Many Times per Checkout Request | Find repeated collectTotals calls and custom collectors that multiply checkout latency. |
| draft-048 | 2026-03-30 | MCP & Developer Tooling | A Read-Only MCP Server Architecture for Magento Diagnostics | Design an MCP server that answers environment questions without the ability to change anything. |
| draft-049 | 2024-11-06 | MCP & Developer Tooling | Exposing bin/magento Commands as Allowlisted MCP Tools | Wrap a fixed set of read-only Magento commands as MCP tools with argument validation. |
| draft-050 | 2026-04-09 | MCP & Developer Tooling | Environment Discovery: DDEV, Docker, or Cloud from Project Files | Detect how to run commands in a project before running any. |
| draft-051 | 2024-09-12 | MCP & Developer Tooling | Log Triage Tools with Redaction and Output Caps | Return useful exception log summaries to an AI client without leaking secrets or flooding context. |
| draft-052 | 2025-03-04 | MCP & Developer Tooling | Database Metadata Without Data: Schema Introspection for AI Tools | Expose tables, columns, and indexes to an assistant while keeping row data out of reach. |
| draft-053 | 2026-08-20 | MCP & Developer Tooling | A devtools:health CLI Command for Deployment Readiness | Build one CLI command that reports indexer, cron, cache, and queue readiness as JSON. |
| draft-054 | 2024-07-01 | MCP & Developer Tooling | An Admin Page for Auditing Diagnostic Tool Calls | Record and review which diagnostics ran, by whom, and when, in a Magento admin grid. |
| draft-055 | 2024-01-21 | MCP & Developer Tooling | Execution Boundaries for AI-Driven Magento CLI Workflows | Define timeouts, write-command denials, and confirmation steps for assistant-run commands. |
| draft-056 | 2026-06-09 | Enterprise Integrations | An Outbox Table for Reliable Order Export to an ERP | Guarantee every placed order reaches the ERP exactly once despite crashes and retries. |
| draft-057 | 2024-05-04 | Enterprise Integrations | Stock Sync from Odoo over JSON-RPC Without Overselling | Pull Odoo stock levels into MSI sources safely around reservations. |
| draft-058 | 2025-02-20 | Enterprise Integrations | Mapping SPS Commerce EDI 850, 856, and 810 to Magento Entities | Map purchase order, ship notice, and invoice documents to orders, shipments, and invoices. |
| draft-059 | 2026-09-05 | Enterprise Integrations | Creating Shipments and Invoices from ERP Callbacks | Create shipments and invoices from ERP data through sales service contracts, idempotently. |
| draft-060 | 2026-01-10 | Enterprise Integrations | A Payment Method on the Gateway Command Pool Pattern | Implement authorize and capture for a third-party gateway using Magento's payment gateway framework. |
| draft-061 | 2025-11-07 | Enterprise Integrations | Bulk MSI Source Item Updates from an External Feed | Update thousands of source items per run without per-SKU saves. |
| draft-062 | 2025-07-12 | Enterprise Integrations | Large Product Loads Through the Asynchronous Bulk REST API | Push large product batches through async bulk endpoints and track per-item results. |
| draft-063 | 2026-04-27 | Enterprise Integrations | Price and Data Scope Pitfalls in Multi-Website Integrations | Explain why integration writes land in the wrong scope and how to target the correct store. |
| draft-064 | 2024-03-23 | Enterprise Integrations | A Custom Checkout Step with Server-Side Validation | Add a checkout step whose data is validated on the server, not only in Knockout. |
| draft-065 | 2026-02-17 | Enterprise Integrations | Two-Way CRM Customer Sync and Conflict Resolution | Decide which system wins per field and avoid update loops in a bidirectional customer sync. |
| draft-066 | 2026-07-30 | DevOps & Infrastructure | A DDEV Setup for Magento 2.4.7 with OpenSearch and Redis | Build a reproducible local stack matching production service versions. |
| draft-067 | 2025-06-18 | DevOps & Infrastructure | Moving a Magento Codebase from PHP 8.1 to 8.3 | Find and fix PHP incompatibilities before an upgrade breaks production. |
| draft-068 | 2026-02-03 | DevOps & Infrastructure | Migrating MySQL 5.7 to MySQL 8 or MariaDB Without Surprises | Avoid collation, SQL mode, and reserved-word failures during a database engine migration. |
| draft-069 | 2025-12-30 | DevOps & Infrastructure | Elasticsearch 7 to OpenSearch 2 Cutover for Magento | Switch the search engine with a tested reindex and rollback path. |
| draft-070 | 2025-08-07 | DevOps & Infrastructure | When a Deploy Actually Needs Maintenance Mode | Use schema/data status checks to skip maintenance mode on releases without schema changes. |
| draft-071 | 2024-05-21 | DevOps & Infrastructure | Composer Patches vs the Quality Patches Tool | Choose how to apply core fixes so they survive upgrades and stay auditable. |
| draft-072 | 2024-08-06 | DevOps & Infrastructure | A CI Pipeline That Compiles DI and Builds Static Content Once | Build an artifact once in CI so production never compiles code. |
| draft-073 | 2024-03-16 | DevOps & Infrastructure | Diagnosing 502s from PHP-FPM Pool Exhaustion | Tell FPM exhaustion apart from slow upstreams and size the pool from evidence. |
| draft-074 | 2026-06-30 | DevOps & Infrastructure | Sanitizing a Production Database Dump for Staging | Produce a staging copy without customer PII or live integration credentials. |
