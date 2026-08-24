# Portfolio entry markup

Hardcoded in `apps/mikepattyn/index.html` under `#apps` → `<ul class="app-list">`.

Replace placeholders:

- `{hostname}` — e.g. `lumen.mikepattyn.nl` (no scheme)
- `{url}` — e.g. `https://lumen.mikepattyn.nl` (Production only)
- `{Name}` — display name
- `{description}` — one short product paragraph
- `{stack}` — `·`-separated tech (e.g. `HTML · CSS · Vanilla JS`)

```html
<li class="app-item reveal">
  <div class="app-item__meta">
    <a class="app-item__host" href="{url}" target="_blank" rel="noopener noreferrer">{hostname}</a>
    <h3><a href="{url}" target="_blank" rel="noopener noreferrer">{Name}</a></h3>
  </div>
  <p>
    {description}
  </p>
  <p class="app-item__stack">{stack}</p>
</li>
```

## Rules

- Append inside the existing `#apps` list (do not invent a new section unless the user asks).
- No images, cards, or badges — match sibling list items.
- Use Production hostnames only (`{appSlug}.mikepattyn.nl`), never `-dev` / `-acc`.
- Optionally update the page `<meta name="description">` to mention the new app.

## Example (Lumen)

```html
<li class="app-item reveal">
  <div class="app-item__meta">
    <a class="app-item__host" href="https://lumen.mikepattyn.nl" target="_blank" rel="noopener noreferrer">lumen.mikepattyn.nl</a>
    <h3><a href="https://lumen.mikepattyn.nl" target="_blank" rel="noopener noreferrer">Lumen</a></h3>
  </div>
  <p>
    A gentle prompt-engineering course for INFPs — short lessons on context,
    tone, role, and voice, plus a practice garden that lights up as your craft
    grows. Static site, no accounts.
  </p>
  <p class="app-item__stack">HTML · CSS · Vanilla JS</p>
</li>
```
