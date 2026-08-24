# Under the Hood topic anatomy

Match the articles already on the Portfolio home (`#single-table`, `#agent-skills`). Read those blocks in `apps/mikepattyn/index.html` before inventing structure.

Hash targets already have `scroll-margin-top` via `.underhood-topic[id]`. Reuse that. Do not add a second scroll-margin rule.

## i18n

- Nested keys: `underhood.<camelTopic>.*` (same shape as `underhood.skills`). Do not add more loose keys next to `underhood.intro` (those belong to the first topic).
- Every `data-i18n` path exists in **both** `en.js` and `nl.js`.
- Markup that contains links or `<code>` lives in the dictionary string. Locale apply uses `innerHTML`.
- English remains in the HTML as the no-JS fallback. Keep it in sync with `en.js`.

Suggested key set:

```
underhood.<camelTopic>.nav
underhood.<camelTopic>.title
underhood.<camelTopic>.intro
underhood.<camelTopic>.p1.title / .p1.body
underhood.<camelTopic>.p2.title / .p2.body
underhood.<camelTopic>.p3.title / .p3.body
underhood.<camelTopic>.usedBy          // where to look next in this workshop
underhood.<camelTopic>.source          // optional; public URL only
```

Optional figure keys (`figureCaption`, column headers) only when you include a table.

Update `underhood.lede` when the section no longer describes two topics. The nav `aria-label` stays `underhood.topicsAria`.

## HTML skeleton

Place the new `<article>` **before** the `underhood-topic__future` paragraph, after the last existing topic.

```html
<nav class="underhood-nav" …>
  <!-- existing links -->
  <a href="#your-slug" data-i18n="underhood.yourTopic.nav">Nav title</a>
</nav>

<article
  class="underhood-topic reveal"
  id="your-slug"
  aria-labelledby="your-slug-title"
>
  <h3 id="your-slug-title" class="underhood-topic__title" data-i18n="underhood.yourTopic.title">
    Title
  </h3>
  <p class="underhood-topic__intro" data-i18n="underhood.yourTopic.intro">
    Situation, then the picture, then the name.
  </p>

  <!-- optional: table.figure using key-example / key-example__table, or a short numbered list -->

  <ul class="pillar-list">
    <li class="pillar reveal">
      <h4 data-i18n="underhood.yourTopic.p1.title">How to see it</h4>
      <p data-i18n="underhood.yourTopic.p1.body">…</p>
    </li>
    <li class="pillar reveal">
      <h4 data-i18n="underhood.yourTopic.p2.title">How to try it</h4>
      <p data-i18n="underhood.yourTopic.p2.body">…</p>
    </li>
    <li class="pillar reveal">
      <h4 data-i18n="underhood.yourTopic.p3.title">The honest catch</h4>
      <p data-i18n="underhood.yourTopic.p3.body">…</p>
    </li>
  </ul>

  <p class="underhood-topic__used reveal" data-i18n="underhood.yourTopic.usedBy">
    Where this lives in the workshop (paths, hashes). No chat UUIDs.
  </p>
  <p class="underhood-topic__source reveal" data-i18n="underhood.yourTopic.source">
    Primary source: <a href="…" target="_blank" rel="noopener noreferrer">…</a>
  </p>
</article>
```

Skip `.source` when there is no honest public citation. Do not invent one. Skip `.underhood-topic__footnote` unless a named person is already public on this page and actually taught the idea.

## Example block

Prefer:

- `figure.key-example` + `table.key-example__table` for key shapes and side-by-side facts
- A short `<ol>` for a three-step walk-through
- `<code>` inline for names the reader will see in the repo

Do not paste transcripts, stack traces, or wide unwrapped lines. Tables already scroll on the x-axis via `.key-example { overflow-x: auto }`. New CSS only when those patterns cannot hold the example. If you must add CSS, stay mobile-first and reuse `640px` / `800px`.

## Pillars for this skill

Default mapping (rename to fit the thesis, keep the jobs):

1. **How to see it** — what a junior looks for in a foreign repo
2. **How to try it** — the smallest next move
3. **The honest catch** — when not to copy it yet

Three pillars, not five. `.pillar-list` becomes three columns from 800px.

## Glossary and nav

- `id`, `aria-labelledby`, and the `h3` id must match.
- Nav href is `#` + slug.
- **UnderTheHoodTopic** in `apps/mikepattyn/CONTEXT.md` lists current hashes. Add the new one on the same line as the others.
- `AGENTS.md` **Portfolio teaching** lists the same hashes.

Do not treat the section heading as a topic. Do not duplicate the full explanation on app cards; link to the hash if a product actually uses the idea.
