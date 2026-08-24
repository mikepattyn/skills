---
name: scaffold-vanilla-frontend
description: >-
  Scaffolds a vanilla static frontend (plain HTML/CSS/vanilla JS, no bundler)
  under apps/, with EN/NL preference, browser-language auto-switch via
  navigator.language, and a Production entry on the mikepattyn.nl portfolio
  unless the app is private or another brand domain. Use whenever the user
  asks to create a new vanilla or static HTML/JS app under apps/, add EN/NL
  i18n to a static site, list a new app on the portfolio, or wants a locale
  toggle that follows the browser language. Do not use for Lumen product work,
  Angular 22 apps, or vanilla-to-Angular migration.
---

# Scaffold vanilla frontend (EN/NL + portfolio)

**Location:** this skill lives in the Platform skills folder at
`.cursor/skills/scaffold-vanilla-frontend/` (repo root). Sibling skills are under
`.cursor/skills/` (e.g. `add-frontend-deploy-workflow`).

Create (or retrofit) a **vanilla** static frontend: HTML/CSS/vanilla JS, no build
step — plus EN/NL preference with browser auto-detect — and add a Production
link on the mikepattyn portfolio (`apps/mikepattyn/index.html` → `#apps`) unless
the app is private or lives on another PlatformDomain.

Lumen (`apps/prompt-engineering`) was the first product that used this shape.
It is **not** the stack and **not** the template: Lumen is Angular 22 CSR;
leftover `js/` stays only until the observation gate closes. Locale **policy**
comes from Kapsalon’s `LocaleService`; implement it in plain JS, not
Angular/Transloco.

## Progress checklist

Copy and track:

```
Progress:
- [ ] 1. Gather inputs
- [ ] 2. Create or retrofit app shell under apps/<slug>/
- [ ] 3. Wire vanilla EN/NL locale (resolve → persist → toggle → re-render)
- [ ] 4. Add portfolio entry in apps/mikepattyn/index.html (unless private / other-brand)
- [ ] 5. Optional: platform hosting + deploy workflow
- [ ] 6. Sanity-check
- [ ] 7. Leave work on main for review — commit only when asked, never push
```

## 1. Gather inputs

Ask only for what you cannot infer:

| Input | Notes |
|-------|--------|
| App display name | e.g. `Pattynologies` |
| Folder slug | e.g. `pattynologies` → `apps/<slug>/` |
| AppSlug / hostname | Production URL `{appSlug}.mikepattyn.nl` (lowercase slug), or a PlatformDomain apex if this is another brand |
| CDK PascalCase name | e.g. `Pattynologies` — for Constants / SSM later |
| One-line portfolio blurb | Product description for `#apps` (skip if private / other-brand) |
| Stack line | e.g. `HTML · CSS · Vanilla JS` |
| Mode | **new** app vs **retrofit** existing static app |
| Listing | **public** on mikepattyn.nl, **private**, or **other-brand** (new PlatformDomain) |

Default stack for new vanilla apps: `HTML · CSS · Vanilla JS`.

## 2. App shell

Target layout:

```
apps/<slug>/
├── index.html
├── CONTEXT.md
├── README.md
├── css/styles.css
├── js/
│   ├── locale.js      # resolve / persist / toggle
│   ├── i18n/
│   │   ├── en.js
│   │   └── nl.js
│   └── app.js         # router + views using t('key')
└── (optional content module, e.g. js/content.js)
```

**Source of truth:** this skill’s `assets/` (`locale.js`, EN/NL dictionaries,
toggle snippet). Live vanilla example of locale + static hosting:
`apps/pattynologies/`.

Do **not** copy `apps/prompt-engineering/` (Lumen). That tree is Angular 22
plus leftover vanilla `js/` until the observation gate closes.

Shell conventions:

- `#app` mount + hash router (`#/`, `#/…`) when the app has multiple views
- `localStorage` helper for app state; locale uses its own key (see below)
- Google Fonts optional; keep CSS simple and branded for the product
- No `package.json` / bundler unless the user explicitly wants Vite later
- `CONTEXT.md` glossary for the app’s domain language

Copy starter locale files from this skill’s `assets/` into the app, then customize keys and chrome.

Script order in `index.html` (locale dictionaries before locale module before app):

```html
<script src="js/i18n/en.js"></script>
<script src="js/i18n/nl.js"></script>
<script src="js/locale.js"></script>
<script src="js/app.js"></script>
```

Header must include an EN/NL control (see `assets/locale-toggle.html` snippet). Footer/nav strings go through `t('…')`, not hardcoded English.

## 3. EN/NL locale (vanilla JS)

Read `assets/locale.js` and ship it (or an equivalent) into the app. Policy matches Kapsalon:

1. Locales: `'en' | 'nl'` only
2. Storage key: `locale` (or `<appSlug>.locale` if the app already namespaces storage)
3. Initial resolve:
   - stored value if `'en'` or `'nl'`
   - else `navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en'`
4. On init and on switch: set `document.documentElement.lang`, update `document.title` from translations, persist choice
5. Strings live in parallel dictionaries (`I18N.en` / `I18N.nl`); views call `t('dotted.key')`
6. Locale change re-renders the UI the same way a `hashchange` does (call the existing `render()` / paint function)

Do **not** pull Transloco, i18next, or a framework into a vanilla static app. Keep it browser-native so `navigator.language` is the only detection API needed.

### Retrofit

Hard stop: if the app already has Angular `src/app/`, or is on the
observation-gate list (Lumen, Dashboard, Viewports, Theming — see
`docs/migration/cutover-status.md`), do **not** retrofit leftover `js/`.
That is `migrate-vanilla-to-angular` / cutover work, not this skill.

When retrofitting a real vanilla app: extract user-visible strings into
`en.js` / `nl.js`, replace literals with `t('…')`, add the toggle, keep
behavior identical otherwise.

## 4. Portfolio entry

Every new (or newly public) vanilla app on **mikepattyn.nl** must get a link
on the portfolio. Skip this step only when the user marks the app **private**
(e.g. Ondernemingsplan) or **other-brand** (a new PlatformDomain, not a
`*.mikepattyn.nl` product).

Edit `apps/mikepattyn/index.html`:

1. In `#apps` → `<ul class="app-list">`, append an `<li class="app-item reveal">` using the shape in `references/portfolio-entry.md`
2. Link the **Production** hostname: `https://{appSlug}.mikepattyn.nl` (not `-dev` / `-acc`)
3. Optionally update `<meta name="description">` so SEO copy mentions the new app

Portfolio list is hardcoded HTML — no JSON/CMS. Do not invent image cards; the design is text-only list items.

For a public mikepattyn.nl app, skipping the portfolio link is a failed scaffold.

## 5. Optional platform wiring

If the user wants hosting/CI in the same change (or the app is new and must go live):

| Piece | Where / how |
|-------|-------------|
| CDK app constant + FrontendStack | `infra/cdk/` — follow a simple static brand stack (Pattynologies or Mikepattyn brand frontend) |
| Make sync/deploy targets | Root `Makefile` — mirror `sync-pattynologies` / `sync-mikepattyn`, not `sync-lumen` |
| GitHub content workflow | Use project skill `.cursor/skills/add-frontend-deploy-workflow`. That file is also how `frontend-page-accessibility` discovers the new app on the next run. |

Do **not** copy `Lumen-Frontend-Stack`, `sync-lumen`, Authress, signed cookies,
the Gate, or `/auth/*`. Those are Lumen product infra (ADR 0015 / 0021), not
the vanilla default.

Hostname scheme: `{appSlug}.mikepattyn.nl` (see platform `CONTEXT.md` / ADR on DNS), unless this is another PlatformDomain. Agents must not run `cdk deploy` unless the user explicitly asks; create the code and tell them how to deploy.

If hosting already exists, still do steps 2–4; skip CDK.

## 6. Sanity-check

- [ ] `index.html` loads `en.js` → `nl.js` → `locale.js` → `app.js`
- [ ] Fresh profile (no `localStorage.locale`): Dutch browser → NL UI; otherwise EN
- [ ] Toggle persists across reload; `document.documentElement.lang` matches
- [ ] All chrome strings use `t('…')` (no stray English in header/nav/footer)
- [ ] Portfolio `#apps` list includes the new item with correct Production URL (unless private / other-brand)
- [ ] `CONTEXT.md` exists for the app

## 7. Ship it

Follow platform [AGENTS.md](../../../AGENTS.md): work on `master`, commit only
when asked, never push. The user reviews in Fork. New apps are owned folders,
not submodules. Remaining gitlinks are Authress, Mapbox, Canvas, and
Ondernemingsplan — do not add application gitlinks. Do not open a PR or
create a feature branch unless the user explicitly asks.

## References

| When | Read |
|------|------|
| Portfolio `<li>` markup | `references/portfolio-entry.md` (this skill folder; Lumen row is markup only, not the stack) |
| Locale module to copy | `assets/locale.js` |
| Toggle markup | `assets/locale-toggle.html` |
| Starter dictionaries | `assets/i18n/en.js`, `assets/i18n/nl.js` |
| Live vanilla example | `apps/pattynologies/` |
| Do not copy | `apps/prompt-engineering/` (Lumen — Angular 22) |
| Locale policy origin | `apps/kapsalon/apps/web/src/app/core/locale/locale.service.ts` |
| Observation-gate list | `docs/migration/cutover-status.md` |
| Deploy workflow skill | `.cursor/skills/add-frontend-deploy-workflow` |
| Frontend a11y fleet | `.cursor/skills/frontend-page-accessibility` (auto-enrolls from the deploy workflow file) |
| Skills folder | `.cursor/skills/` at Platform repo root |
