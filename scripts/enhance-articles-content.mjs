/**
 * One-off enhancer for public/articles-content.json — run from repo root:
 * node scripts/enhance-articles-content.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'

const PATH = new URL('../public/articles-content.json', import.meta.url)

const BOILER_INTRO =
  /This guide takes a code-first approach: it identifies the relevant Magento \/ Adobe Commerce extension point, shows a focused example, and provides checks you can run before promoting the change\. The example uses <code>MaheshDave_DevTools<\/code> as the module name\./

const GENERIC_FAQ =
  /<h2>FAQs<\/h2><h3>Can I copy this directly into production\?<\/h3><p>No\. Complete supporting module files and test against your exact Commerce version and configuration\.<\/p><h3>How should I verify compatibility\?<\/h3><p>Check the official documentation for the deployed release, run the stated checks, and exercise the affected workflow in staging\.<\/p>/

const SUPPLEMENT_MARKER = '<h2>Supporting implementation</h2>'

const categorySupplements = {
  'Adobe Commerce Core': `<p>Wire the module into Composer autoloading and declare the module sequence when your code depends on other packages:</p><pre><code>{
  "name": "maheshdave/dev-tools",
  "type": "magento2-module",
  "version": "1.0.0",
  "autoload": {
    "files": ["registration.php"],
    "psr-4": {
      "MaheshDave\\\\DevTools\\\\": ""
    }
  }
}</code></pre><p>Expected result after <code>composer dump-autoload</code> and <code>bin/magento setup:upgrade</code>: the module appears in <code>bin/magento module:status</code> without registration errors.</p>`,
  Extensibility: `<p>Register preferences or virtual types only when interception is insufficient. Keep plugins narrow:</p><pre><code>&lt;config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:ObjectManager/etc/config.xsd"&gt;
    &lt;preference for="MaheshDave\\\\DevTools\\\\Api\\\\StockNoteManagementInterface"
                type="MaheshDave\\\\DevTools\\\\Model\\\\StockNoteManagement"/&gt;
&lt;/config&gt;</code></pre><p>Compile DI in CI before merge: <code>bin/magento setup:di:compile</code> should finish with exit code 0.</p>`,
  Security: `<p>Validate ACL and CSRF at the entry point. Example admin action check:</p><pre><code>if (!$this-&gt;_authorization-&gt;isAllowed('MaheshDave_DevTools::config')) {
    throw new LocalizedException(__('You are not allowed to change this setting.'));
}
$formKey = $this-&gt;formKeyValidator-&gt;validate($this-&gt;getRequest());
if (!$formKey) {
    throw new LocalizedException(__('Invalid form key. Please refresh the page.'));
}</code></pre><p>Never log raw session IDs, payment payloads, or API secrets.</p>`,
  DevOps: `<p>Capture build artifacts and environment in deployment logs:</p><pre><code>php -v | head -1
bin/magento --version
bin/magento maintenance:status
bin/magento setup:db:status --no-ansi</code></pre><p>Compare output across staging and production before promoting a release.</p>`,
  Frontend: `<p>Example ViewModel with escaped output for templates:</p><pre><code>&lt;?php
declare(strict_types=1);

namespace MaheshDave\\\\DevTools\\\\ViewModel;

use Magento\\\\Framework\\\\View\\\\Element\\\\Block\\\\ArgumentInterface;

class ProductNote implements ArgumentInterface
{
    public function getNoteHtml(int $productId): string
    {
        return $this-&gt;escaper-&gt;escapeHtml(
            (string) $this-&gt;noteProvider-&gt;getForProduct($productId)
        );
    }
}</code></pre><p>In PHTML: <code>&lt;?= $block-&gt;getViewModel()-&gt;getNoteHtml($productId) ?&gt;</code> — avoid <code>echo</code> of unescaped customer or CMS data.</p>`,
  'REST API': `<p>Declare a secure route with explicit ACL and HTTP verb:</p><pre><code>&lt;route url="/V1/maheshdave/dev-tools/stock-note/:productId" method="GET"&gt;
    &lt;service class="MaheshDave\\\\DevTools\\\\Api\\\\StockNoteManagementInterface" method="getNote"/&gt;
    &lt;resources&gt;
        &lt;resource ref="Magento_Catalog::products"/&gt;
    &lt;/resources&gt;
&lt;/route&gt;</code></pre><p>Test with an integration token in staging: <code>curl -H "Authorization: Bearer &lt;token&gt;" https://staging.example.com/rest/V1/maheshdave/dev-tools/stock-note/42</code></p>`,
  GraphQL: `<p>Resolver skeleton with store context and typed errors:</p><pre><code>public function resolve(Field $field, $context, ResolveInfo $info, array $value = null, array $args = null)
{
    $storeId = (int) $context-&gt;getExtensionAttributes()-&gt;getStore()-&gt;getId();
    if (!$this-&gt;config-&gt;isEnabled($storeId)) {
        return ['note' =&gt; ''];
    }
    return ['note' =&gt; $this-&gt;management-&gt;getNote((int) $args['product_id'])];
}</code></pre><p>Load related entities in batch inside the service layer to avoid N+1 queries per cart line.</p>`,
  B2B: `<p>Scope B2B checks to the active company context:</p><pre><code>$company = $this-&gt;companyManagement-&gt;getByCustomerId((int) $customerId);
if (!$company || !$company-&gt;getId()) {
    throw new LocalizedException(__('Company account required.'));
}</code></pre><p>Verify shared catalog and negotiable quote modules are enabled before relying on company APIs.</p>`,
  Performance: `<p>Profile a hot path with blackfire or built-in logging, then bound collection size:</p><pre><code>$collection-&gt;setPageSize(50)-&gt;setCurPage(1);
$collection-&gt;addFieldToSelect(['entity_id', 'sku', 'name']);</code></pre><p>Re-run the scenario under full-page cache and Varnish/Fastly to confirm cacheable blocks still hit edge cache.</p>`,
  'New Relic & Observability': `<p>Tag transactions for Commerce-specific work:</p><pre><code>if (extension_loaded('newrelic')) {
    newrelic_name_transaction('maheshdave_devtools/sync_inventory');
    newrelic_add_custom_parameter('store_id', (string) $storeId);
}</code></pre><p>Correlate APM traces with <code>var/log/exception.log</code> timestamps during incident review.</p>`,
  'Adobe Commerce on Cloud': `<p>Validate Cloud hooks locally with the same variables as production:</p><pre><code>echo "$MAGENTO_CLOUD_BRANCH $MAGENTO_CLOUD_ENV"
php ./vendor/bin/ece-tools scenario:deploy</code></pre><p>Never commit <code>env.php</code> secrets; use Cloud variables and <code>config:set</code> in the build hook only when documented for your project.</p>`,
  Testing: `<p>PHPUnit integration test bootstrap for a repository:</p><pre><code>public function testGetNoteReturnsStringForExistingProduct(): void
{
    $sku = 'simple-product';
    $product = $this-&gt;productRepository-&gt;get($sku);
    $note = $this-&gt;stockNoteManagement-&gt;getNote((int) $product-&gt;getId());
    $this-&gt;assertIsString($note);
}</code></pre><p>Run: <code>vendor/bin/phpunit -c dev/tests/integration/phpunit.xml.dist path/to/Test.php</code></p>`,
  Git: `<p>Keep generated and vendor paths out of custom module commits:</p><pre><code>/vendor/
/generated/
/pub/static/
/var/</code></pre><p>Use feature branches and require DI compile + static tests in CI before merging to <code>main</code>.</p>`,
  Integrations: `<p>Outbound HTTP client with timeouts and idempotency key:</p><pre><code>$this-&gt;client-&gt;post($endpoint, [
    'json' =&gt; $payload,
    'timeout' =&gt; 10,
    'connect_timeout' =&gt; 3,
    'headers' =&gt; ['Idempotency-Key' =&gt; $orderIncrementId],
]);</code></pre><p>On failure, queue retry with exponential backoff instead of blocking checkout.</p>`,
  'Quick Notes': `<p>Quick verification command sequence:</p><pre><code>bin/magento cache:status
bin/magento indexer:status
tail -n 50 var/log/system.log</code></pre><p>Document the expected healthy output in your runbook so on-call can compare quickly.</p>`,
  'Engineering notes': `<p>Store API tokens in environment variables only:</p><pre><code>export FASTLY_API_TOKEN="&lt;rotate-if-leaked&gt;"
curl -sS -H "Fastly-Key: $FASTLY_API_TOKEN" \\
  "https://api.fastly.com/service/$FASTLY_SERVICE_ID/version/active"</code></pre><p>Rotate tokens after incident response and purge edge cache after VCL changes.</p>`,
}

const slugExtraBlocks = {
  'create-a-magento-2-module-from-zero-registration-composer-and-cli-checks': `<p>Minimal <code>etc/module.xml</code> that matches the registration name:</p><pre><code>&lt;?xml version="1.0"?&gt;
&lt;config xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:noNamespaceSchemaLocation="urn:magento:framework:Module/etc/module.xsd"&gt;
    &lt;module name="MaheshDave_DevTools" setup_version="1.0.0"/&gt;
&lt;/config&gt;</code></pre>`,
  'use-dependency-injection-instead-of-object-manager-in-magento-2': `<p><strong>Avoid</strong> service locator usage in business code:</p><pre><code>// Anti-pattern — hard to test, hides dependencies
$products = \\Magento\\Framework\\App\\ObjectManager::getInstance()
    -&gt;get(\\Magento\\Catalog\\Api\\ProductRepositoryInterface::class);</code></pre><p><strong>Prefer</strong> constructor injection in a dedicated class:</p><pre><code>&lt;?php
declare(strict_types=1);

namespace MaheshDave\\DevTools\\Model;

use Magento\\Catalog\\Api\\ProductRepositoryInterface;

class Availability
{
    public function __construct(
        private readonly ProductRepositoryInterface $products
    ) {
    }

    public function isSalable(string $sku): bool
    {
        return (bool) $this-&gt;products-&gt;get($sku)-&gt;isSalable();
    }
}</code></pre>`,
  'add-a-plugin-safely-before-after-and-around-compared': `<p>Example plugin methods showing the three interception types:</p><pre><code>public function beforeGetName($subject, ...$args) { /* adjust args */ return $args; }
public function afterGetName($subject, $result) { return $result . ' (promo)'; }
public function aroundGetName($subject, callable $proceed, ...$args) {
    $result = $proceed(...$args);
    return $this-&gt;sanitize($result);
}</code></pre>`,
  'safely-update-order-data-through-sales-service-contracts': `<p>Never set <code>state</code>/<code>status</code> on the order model directly in integrations. Use service APIs and capture payment state first:</p><pre><code>// Diagnostic read — confirm payment before fulfillment actions
$order = $this-&gt;orderRepository-&gt;get($orderId);
$paid = (float) $order-&gt;getTotalPaid();
$canceled = (float) $order-&gt;getTotalCanceled();
// If paid &gt; 0 and canceled &gt; 0, reconcile via admin or documented support runbook — not raw SQL in production.</code></pre>`,
}

function fixSeoTitle(article) {
  const title = String(article.title || '').trim()
  const current = String(article.seo_title || '').trim()
  const looksTruncated =
    !current ||
    current.endsWith(',') ||
    (current.length >= 55 && current.length < title.length - 3) ||
    title.startsWith(current.replace(/\.\.\.$/, ''))
  if (looksTruncated) {
    article.seo_title = title.length <= 60 ? title : `${title.slice(0, 57).replace(/\s+\S*$/, '')}...`
  }
}

function fixSeoDescription(article) {
  if (!String(article.seo_description || '').trim() && String(article.excerpt || '').trim()) {
    article.seo_description = article.excerpt
  }
}

function buildIntro(article) {
  const excerpt = String(article.excerpt || article.title).trim()
  return `<p><strong>Problem:</strong> ${excerpt} Teams often ship a quick patch that passes in developer mode but fails DI compilation, cache invalidation, or store-scoped configuration in staging.</p><p><strong>Outcome:</strong> You will implement and verify this pattern on Adobe Commerce / Magento Open Source 2.4.x using the <code>MaheshDave_DevTools</code> module (<code>app/code/MaheshDave/DevTools</code>, Composer package <code>maheshdave/dev-tools</code>).</p>`
}

function buildFaqs(article) {
  const topic = article.title.split(':')[0].trim()
  return `<h2>FAQs</h2><h3>Can I deploy this without running the checks?</h3><p>No. Run the verification commands in staging on the same Commerce patch level as production, then promote through your normal release process.</p><h3>What if ${topic} behaves differently on Cloud?</h3><p>Compare enabled modules, environment variables, and build hooks. Cloud restricts some filesystem writes—keep customizations in <code>app/code</code> or shared mounts documented for your project.</p><h3>Where should I look when something fails?</h3><p>Start with <code>var/log/exception.log</code> and the first stack trace line, then confirm module sequence, cache type, and store scope.</p>`
}

function enhanceDraftArticle(article) {
  let content = article.content
  if (BOILER_INTRO.test(content)) {
    content = content.replace(BOILER_INTRO, buildIntro(article))
  }
  const slugBlock = slugExtraBlocks[article.slug] || ''
  const categoryBlock = categorySupplements[article.category] || categorySupplements['Adobe Commerce Core']
  const supplement = slugBlock || categoryBlock
  if (supplement && !content.includes(SUPPLEMENT_MARKER)) {
    content = content.replace(
      '<h2>Run the checks</h2>',
      `${SUPPLEMENT_MARKER}${supplement}<h2>Run the checks</h2>`,
    )
  }
  if (GENERIC_FAQ.test(content)) {
    content = content.replace(GENERIC_FAQ, buildFaqs(article))
  }
  article.content = content
  fixSeoTitle(article)
  fixSeoDescription(article)
}

function enhanceFastlyArticle(article) {
  if (!String(article.excerpt || '').trim()) {
    article.excerpt =
      'Remove a blocking Fastly VCL snippet via the Fastly API or CLI when Magento admin is unreachable—backup, clone, delete, validate, activate, and purge safely.'
  }
  fixSeoTitle(article)
  fixSeoDescription(article)
  if (!article.seo_title) {
    article.seo_title =
      article.title.length <= 60 ? article.title : 'Remove Fastly VCL Snippet Using CLI — Safe Rollback'
  }
  let content = article.content
  if (!content.includes('<h2>Key takeaways</h2>')) {
    content += `<h2>Key takeaways</h2><ul><li>Active Fastly versions are immutable—always clone before deleting snippets.</li><li>Validate VCL before activation; keep JSON backups until admin access is confirmed.</li><li>Pair CDN changes with Magento maintenance checks (<code>var/maintenance.flag</code>) when admin stays blocked.</li></ul>`
  }
  article.content = content
}

const newArticles = [
  {
    id: 'draft-066',
    title: 'Design GraphQL Resolvers That Avoid N+1 Catalog Loads',
    slug: 'design-graphql-resolvers-that-avoid-n-plus-one-catalog-loads',
    category: 'GraphQL',
    excerpt:
      'Batch product and attribute loads inside service classes so Storefront GraphQL queries stay within latency budgets under load.',
    content: `<p><strong>Problem:</strong> A resolver that calls <code>ProductRepositoryInterface::get()</code> for every cart line or category tile multiplies database and Elasticsearch work—GraphQL looks convenient but can amplify N+1 patterns.</p><p><strong>Outcome:</strong> You will structure resolvers and services so related entities load in bounded batches with explicit field selection.</p><h2>Before you start</h2><ul><li>Capture a baseline query with Blackfire, New Relic, or Magento profiler on a representative category or cart query.</li><li>Confirm whether catalog reads hit Elasticsearch or MySQL in your index configuration.</li></ul><h2>Anti-pattern vs batching service</h2><pre><code>// Anti-pattern inside a field resolver
foreach ($items as $item) {
    $product = $this-&gt;productRepository-&gt;getById((int) $item['product_id']);
}</code></pre><pre><code>// Batch in a dedicated service used by the resolver
$ids = array_column($items, 'product_id');
$products = $this-&gt;productCollectionFactory-&gt;create()
    -&gt;addFieldToFilter('entity_id', ['in' =&gt; $ids])
    -&gt;addAttributeToSelect(['name', 'sku', 'price']);
$map = [];
foreach ($products as $product) {
    $map[(int) $product-&gt;getId()] = $product;
}</code></pre><h2>Supporting implementation</h2><p>Expose only the fields you need in GraphQL schema to prevent accidental deep trees:</p><pre><code>type StoreProductNote {
    product_id: Int!
    note: String
}</code></pre><h2>Run the checks</h2><pre><code>bin/magento cache:clean graphql
# Run the same GraphQL query twice; compare query count in profiler</code></pre><h2>Common mistakes</h2><ul><li>Loading full product models when a lightweight DTO suffices.</li><li>Calling repositories from nested resolvers without a DataLoader-style batch.</li><li>Ignoring store view and customer group when building collection filters.</li></ul><h2>Conclusion</h2><p>GraphQL performance is a service-layer design problem. Batch early, select fields explicitly, and measure under realistic catalog size.</p><h2>FAQs</h2><h3>Should I disable GraphQL fields instead?</h3><p>Remove unused fields from schema and resolvers before micro-optimizing SQL—clients cannot over-fetch fields you do not expose.</p>`,
    cover_image_url: '',
    status: 'published',
    published_at: '2026-06-12',
    created_at: null,
    updated_at: null,
    author: 'Mahesh Dave',
    tags: ['Magento 2', 'Adobe Commerce', 'GraphQL', 'Performance', 'Code Examples'],
    seo_title: 'GraphQL Resolvers Without N+1 Catalog Loads',
    seo_description:
      'Batch catalog loads in GraphQL resolver services to keep Storefront queries fast at scale.',
    canonical_url: '',
  },
  {
    id: 'draft-067',
    title: 'Verify Payment Webhooks with Idempotency and Signature Checks',
    slug: 'verify-payment-webhooks-with-idempotency-and-signature-checks',
    category: 'Integrations',
    excerpt:
      'Accept gateway webhooks only after signature verification, persist idempotency keys, and avoid double invoice or cancel races.',
    content: `<p><strong>Problem:</strong> Payment gateways may deliver success, failure, and retry events out of order. Without verification and idempotency, Adobe Commerce can cancel an order after capture or create duplicate invoices.</p><p><strong>Outcome:</strong> A webhook controller pattern that validates signatures, deduplicates events, and delegates order state changes to sales services.</p><h2>Implementation example</h2><p><strong>File or area:</strong> webhook front controller + service</p><pre><code>public function execute(): ResultInterface
{
    $raw = (string) $this-&gt;request-&gt;getContent();
    if (!$this-&gt;signatureValidator-&gt;isValid($raw, $this-&gt;request-&gt;getHeaders())) {
        return $this-&gt;json(['message' =&gt; 'invalid signature'], 401);
    }
    $event = $this-&gt;json-&gt;unserialize($raw);
    $key = (string) ($event['id'] ?? $event['transaction_id'] ?? '');
    if ($key === '' || $this-&gt;idempotency-&gt;isProcessed($key)) {
        return $this-&gt;json(['status' =&gt; 'ignored']);
    }
    $this-&gt;paymentHandler-&gt;apply($event);
    $this-&gt;idempotency-&gt;markProcessed($key);
    return $this-&gt;json(['status' =&gt; 'ok']);
}</code></pre><h2>Supporting implementation</h2><p>Persist idempotency keys in a small declarative table or cache with TTL longer than gateway retry windows:</p><pre><code>&lt;table name="maheshdave_devtools_webhook_event" resource="default" engine="innodb"&gt;
    &lt;column xsi:type="varchar" name="event_key" length="128" nullable="false"/&gt;
    &lt;constraint xsi:type="primary" referenceId="PRIMARY"&gt;
        &lt;column name="event_key"/&gt;
    &lt;/constraint&gt;
&lt;/table&gt;</code></pre><h2>Security considerations</h2><ul><li>Reject unsigned payloads; rotate webhook secrets through config—not code commits.</li><li>Return generic 401/403 without leaking internal order IDs.</li><li>Log correlation IDs, not full card or wallet payloads.</li></ul><h2>Run the checks</h2><pre><code>bin/magento setup:upgrade
# Replay the same webhook payload twice — second call must not change order state</code></pre><h2>Conclusion</h2><p>Treat webhooks like untrusted input until verified. Combine signature checks, idempotency storage, and sales service APIs to stay aligned with payment reality.</p><h2>FAQs</h2><h3>Can I fix a canceled-but-paid order with SQL?</h3><p>Only as a last-resort support runbook after confirming capture in the gateway; prefer admin or service APIs and document audit comments.</p>`,
    cover_image_url: '',
    status: 'published',
    published_at: '2026-08-03',
    created_at: null,
    updated_at: null,
    author: 'Mahesh Dave',
    tags: ['Magento 2', 'Adobe Commerce', 'Integrations', 'Security', 'Payments'],
    seo_title: 'Payment Webhooks: Signatures and Idempotency',
    seo_description:
      'Verify gateway webhooks, dedupe events, and prevent cancel/capture race conditions in Commerce.',
    canonical_url: '',
  },
  {
    id: 'draft-068',
    title: 'Use React Server Components Patterns in Modern Storefront SPAs',
    slug: 'use-react-server-components-patterns-in-modern-storefront-spas',
    category: 'Frontend',
    excerpt:
      'Apply React 19 / RSC-inspired boundaries in headless storefronts: keep data fetching on the server, stream UI, and hydrate only interactive islands.',
    content: `<p><strong>Problem:</strong> Shipping the entire catalog API surface to the browser increases bundle size and exposes integration details. Teams need a clear split between server-fetched data and client interactivity.</p><p><strong>Outcome:</strong> A practical pattern for Adobe Commerce headless or custom React storefronts using server loaders and client islands—without assuming a specific vendor starter kit.</p><h2>Prerequisites</h2><ul><li>Node.js LTS and a React 18+ or 19 project with a server runtime (Next.js App Router, Remix, or custom SSR).</li><li>Storefront GraphQL or REST credentials scoped read-only where possible.</li></ul><h2>Server loader example</h2><pre><code>// app/product/[urlKey]/page.tsx — server component
export default async function ProductPage({ params }: { params: { urlKey: string } }) {
  const product = await getProductByUrlKey(params.urlKey);
  if (!product) notFound();
  return (
    &lt;main&gt;
      &lt;h1&gt;{product.name}&lt;/h1&gt;
      &lt;AddToCartButton sku={product.sku} /&gt;
    &lt;/main&gt;
  );
}</code></pre><h2>Client island with explicit boundary</h2><pre><code>'use client';

import { useState } from 'react';

export function AddToCartButton({ sku }: { sku: string }) {
  const [pending, setPending] = useState(false);
  async function add() {
    setPending(true);
    try {
      await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, qty: 1 }),
      });
    } finally {
      setPending(false);
    }
  }
  return &lt;button disabled={pending} onClick={add}&gt;Add to cart&lt;/button&gt;;
}</code></pre><h2>Performance and security</h2><ul><li>Keep customer tokens and admin URLs off the client bundle; proxy cart mutations through your BFF.</li><li>Cache product queries at the edge with keys that include store code and customer group when pricing differs.</li></ul><h2>Run the checks</h2><pre><code>npm run build
npm run start
# Lighthouse: confirm reduced JS on product route vs fully client-rendered baseline</code></pre><h2>Conclusion</h2><p>Adopt server-first data loading for catalog pages, hydrate only interactive widgets, and measure bundle and TTFB after each change.</p><h2>FAQs</h2><h3>Does Adobe Commerce ship RSC out of the box?</h3><p>PaaS storefronts vary (Luma, Hyvä, headless). This article describes patterns you apply in your chosen React framework, not a core Commerce feature flag.</p>`,
    cover_image_url: '',
    status: 'published',
    published_at: '2026-05-22',
    created_at: null,
    updated_at: null,
    author: 'Mahesh Dave',
    tags: ['React', 'Frontend', 'Headless', 'Performance', 'JavaScript'],
    seo_title: 'React Server Patterns for Headless Storefronts',
    seo_description:
      'Server loaders, client islands, and BFF security for React storefronts integrated with Commerce.',
    canonical_url: '',
  },
]

const payload = JSON.parse(await readFile(PATH, 'utf8'))
if (!Array.isArray(payload.articles)) throw new Error('Missing articles array')

let enhanced = 0
for (const article of payload.articles) {
  if (String(article.id).startsWith('draft-')) {
    enhanceDraftArticle(article)
    enhanced += 1
  } else if (article.id === 'local-1792929011110-sti6wg') {
    enhanceFastlyArticle(article)
    enhanced += 1
  }
}

const existingIds = new Set(payload.articles.map((a) => a.id))
const existingSlugs = new Set(payload.articles.map((a) => a.slug))
let added = 0
for (const article of newArticles) {
  if (existingIds.has(article.id) || existingSlugs.has(article.slug)) continue
  payload.articles.push(article)
  added += 1
}

await writeFile(PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
console.log(`Enhanced ${enhanced} articles, added ${added} new articles.`)
