---
name: umbrella-teach
description: >-
  Turn a summarized workshop chat into a public Under the Hood teaching on the
  mikepattyn portfolio, written so a learning programmer can follow it. Use
  whenever the user asks for umbrella-teach, a public teach, an Under the Hood
  article from a chat, to publish a lesson on the portfolio, or to teach a
  wider audience from a conversation instead of the personal teach workspace.
  Do not use for the private teach workspace (MISSION.md / lessons HTML), for
  generic copy editing (revise-and-resonate), or for research notes under docs/.
argument-hint: "Which chat should become a public Under the Hood topic?"
---

# Umbrella teach

Write a public **UnderTheHoodTopic** on the Portfolio (`apps/mikepattyn`, `/#under-the-hood`) from one summarized chat. The reader is a learning programmer on the public site, not Mike in a private teaching workspace.

This is not the `teach` skill. Do not create `MISSION.md`, `lessons/*.html`, learning records, or a course folder. Those files are for teaching the user over sessions. This skill publishes one idea the workshop already worked through.

Copy craft is close to revise-and-resonate on the **revise** pass only: one job, a clear reader path, cut weight. Spend the second pass on **explanation**, not punch. Read [references/voice.md](references/voice.md) before drafting. Markup checklist: [references/topic-anatomy.md](references/topic-anatomy.md).

## Progress checklist

```
Progress:
- [ ] 1. Identify the chat
- [ ] 2. Summarize internally (one idea, learner gap, example, catch)
- [ ] 3. Confirm title, hash slug, thesis, privacy
- [ ] 4. Draft EN then NL in learner voice
- [ ] 5. Add the topic in the Portfolio (HTML + i18n + glossary)
- [ ] 6. Accessibility + responsive check
- [ ] 7. Leave work on main — commit only when asked, never push
```

## 1. Identify the chat

Need one source conversation. Infer it in this order:

1. **This chat** — the user said "this chat", "this conversation", or the request sits in the chat that holds the teaching.
2. **Named chat** — they named a topic or title. Use `SearchConversations` with one or two keywords (every unquoted word must match the same conversation). If several hits, list titles and ask which one.
3. **UUID** — they pasted an id. Read the transcript JSONL for that id. Do not search the whole transcripts folder.
4. **Pasted summary** — they already condensed it. Treat that text as the source. Still strip secrets.

Do not invent a second topic from a long chat. Pick the one idea a learning programmer can take home. If the chat really holds two unrelated ideas, say so and ask which article to write first.

## 2. Summarize internally

Do not dump the transcript onto the site. Extract:

| Beat | What to capture |
|------|-----------------|
| Situation | What someone was trying to do, in words a junior would use |
| Idea | The mechanism or choice, in plain language first, then the name |
| Example | One concrete slice from the chat (keys, a file path, a small before/after) |
| Catch | The trade-off or mistake juniors hit when they copy it |
| Source | A **public** primary source if the chat used one (docs URL, ADR, CONTEXT term) |

Cite chats in the agent thread as `[short title](uuid)` if you need to point at them. Never put transcript paths, chat UUIDs, or "in our conversation" on the public page.

### Privacy gate

The Portfolio is public. Before drafting HTML, drop or rewrite:

- Secrets, tokens, keys, connection strings, customer data
- Private names, emails, or unpublished product plans the user did not mark as public
- Internal agent traces (tool dumps, file lists, eval harness output)

If a beat is useful but sensitive, ask whether to generalize it. Do not publish a guess.

## 3. Confirm once

If the prompt did not already give these four, send **one** message, then wait:

- **Title** — searchable in junior language (`One table, many shapes`, not `PK/SK composite access`)
- **Slug** — kebab-case hash, unique among existing `#` ids (`single-table`, `agent-skills`)
- **Thesis** — one sentence the article must make unmistakable
- **Private** — anything from the chat that must stay off the page

Recommend each. Do not grill. This is not `grill-me`.

## 4. Draft for a learning programmer

Read [references/voice.md](references/voice.md). Then write English first, Dutch as a real translation for the same learner (not a calque of punchy English). Keep jargon that appears in code (`partition key`, `SKILL.md`) and define it on first use.

Reader path:

1. A situation they recognize
2. The picture in their head, then the name for it
3. One worked example
4. How to spot it, how to try it, the honest catch
5. Where it lives in this workshop, or a public source to open next

The article teaches **how to understand** the idea, not how clever the prose is.

## 5. Add it on the Portfolio

Read `apps/mikepattyn/CONTEXT.md` and match glossary terms (**Portfolio**, **UnderTheHoodSection**, **UnderTheHoodTopic**). Follow [references/topic-anatomy.md](references/topic-anatomy.md) for markup.

Minimum files:

| File | Change |
|------|--------|
| `apps/mikepattyn/index.html` | Nav link in `.underhood-nav`; `<article class="underhood-topic">` before `.underhood-topic__future` |
| `apps/mikepattyn/src/i18n/en.js` | Nested keys under `underhood.<camelTopic>`; update `underhood.lede` when the section is no longer "two things" |
| `apps/mikepattyn/src/i18n/nl.js` | Same keys, same structure |
| `apps/mikepattyn/CONTEXT.md` | Add the topic to **UnderTheHoodTopic** |
| `AGENTS.md` | Add the hash under **Portfolio teaching** |

Reuse existing classes (`underhood-topic`, `pillar-list`, `key-example`, `underhood-topic__used`, `underhood-topic__source`). Do not invent a lesson layout or a new page (`rabbithole.html` is the mentorship essay, not a teach slot).

Link from app stack chips only when those products actually use the idea (same pattern as `#single-table`). Do not add a skill-shelf card unless this run also adds a skill.

If the new article covers something `underhood.futureTopics` still promises, trim that promise.

Work on `main`. Do not commit unless asked. Never push.

## 6. Check the page

After markup exists, follow [page-accessibility](../page-accessibility/SKILL.md) for this section (one `h3` per topic, `aria-labelledby`, nav name, focus/skip to the hash) and [responsive-frontend](../responsive-frontend/SKILL.md) (nav wrap, table overflow, pillars collapsing below 800px). Do not start a full-app accessibility fan-out.

## Anti-patterns

- Following `teach` (private workspace, HTML lessons, quizzes)
- Running a full revise-and-resonate **resonate** pass (punch lines, stacked dashes, fragment landings)
- Recapping the chat instead of teaching the idea
- A second topic "while we are here"
- Publishing secrets or transcript ids
- New CSS or a new route when the existing topic anatomy fits
- Committing or pushing without being asked
