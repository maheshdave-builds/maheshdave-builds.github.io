/**
 * Replace Acme_StoreTools placeholders with MaheshDave_DevTools across articles JSON.
 */
import { readFile, writeFile } from 'node:fs/promises'

const PATH = new URL('../public/articles-content.json', import.meta.url)

/** @param {string} text */
function renameModulePlaceholders(text) {
  if (!text || typeof text !== 'string') return text
  let s = text

  const pairs = [
    ['Acme\\\\StoreTools\\\\', 'MaheshDave\\\\DevTools\\\\'],
    ['Acme\\StoreTools\\', 'MaheshDave\\DevTools\\'],
    ['Acme/StoreTools/', 'MaheshDave/DevTools/'],
    ['Acme/StoreTools', 'MaheshDave/DevTools'],
    ['Acme_StoreTools', 'MaheshDave_DevTools'],
    ['acme/module-store-tools', 'maheshdave/dev-tools'],
    ['acme_storetools_note', 'maheshdave_devtools_note'],
    ['acme_storetools_cleanup', 'maheshdave_devtools_cleanup'],
    ['acme_storetools/sync_inventory', 'maheshdave_devtools/sync_inventory'],
    ['acme_storetools/general/enabled', 'maheshdave_devtools/general/enabled'],
    ['acme_storetools', 'maheshdave_devtools'],
    ['acme_note_listing.acme_note_listing_data_source', 'maheshdave_devtools_note_listing.maheshdave_devtools_note_listing_data_source'],
    ['acme_note_listing.xml', 'maheshdave_devtools_note_listing.xml'],
    ['acme_note_listing', 'maheshdave_devtools_note_listing'],
    ['acme_product_label', 'maheshdave_devtools_product_label'],
    ['acme_order_audit', 'maheshdave_devtools_order_audit'],
    ['acme_webhook_event', 'maheshdave_devtools_webhook_event'],
    ['acme_badge_text', 'maheshdave_devtools_badge_text'],
    ['acme.note.consumer', 'maheshdave.devtools.note.consumer'],
    ['acme.note.queue', 'maheshdave.devtools.note.queue'],
    ['acme.note.topic', 'maheshdave.devtools.note.topic'],
    ['acme.store.note', 'maheshdave.store.note'],
    ['acme/stock-note/:productId', 'maheshdave/dev-tools/stock-note/:productId'],
    ['acme/stock-note/42', 'maheshdave/dev-tools/stock-note/42'],
    ['acme/notes/:noteId', 'maheshdave/dev-tools/notes/:noteId'],
    ['acme/notes/1', 'maheshdave/dev-tools/notes/1'],
    ['acme:catalog:import', 'maheshdave:devtools:catalog:import'],
    ['acme:notes:report', 'maheshdave:devtools:notes:report'],
    ['AcmeNote', 'DevToolsNote'],
    ['acmeNote', 'devToolsNote'],
    [
      'using the placeholder module <code>MaheshDave_DevTools</code>—replace the vendor name with your namespace.',
      'using the <code>MaheshDave_DevTools</code> module (<code>app/code/MaheshDave/DevTools</code>, Composer package <code>maheshdave/dev-tools</code>).',
    ],
    [
      '<code>MaheshDave_DevTools</code>—replace the vendor name with your namespace.',
      '<code>MaheshDave_DevTools</code> (<code>maheshdave/dev-tools</code>).',
    ],
  ]

  for (const [from, to] of pairs) {
    s = s.split(from).join(to)
  }

  // Standalone "acme" in REST paths already handled; avoid breaking words.
  return s
}

const payload = JSON.parse(await readFile(PATH, 'utf8'))
for (const article of payload.articles) {
  for (const key of ['content', 'excerpt', 'seo_title', 'seo_description', 'title']) {
    if (article[key]) article[key] = renameModulePlaceholders(article[key])
  }
}

await writeFile(PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

const check = JSON.parse(await readFile(PATH, 'utf8'))
const blob = check.articles.map((a) => a.content).join('\n')
const leftovers = [...new Set(blob.match(/[Aa]cme[_a-zA-Z0-9\\/.:-]*/g) || [])]
console.log('Renamed module references. Leftover Acme tokens:', leftovers.length ? leftovers : 'none')
