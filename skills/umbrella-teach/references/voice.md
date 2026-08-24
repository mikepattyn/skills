# Learner voice (revise, then explain)

Umbrella teach reuses the **revise** pass from revise-and-resonate and replaces the **resonate** pass with explanation. The public reader is a learning programmer. They need the picture in their head, not a line that lands.

## Keep from revise-and-resonate

- One job per article. Cut or split a second job.
- Lead with why this matters, then the mechanism.
- Cut throat-clearing, hedges, and "as mentioned above."
- Sound like a person. No "in today's fast-paced world," no hedge stacks.
- Bold only a few words that carry the idea, never a whole sentence.

## Drop from resonate

Resonate is for copy that should stick after the tab closes: fragments, stacked asides, subtext, earned punch. That voice already lives on the Portfolio hero and in `#agent-skills`. It is the wrong load for someone still forming the mental model.

Do not:

- Stack em dashes or parenthetical asides in one sentence
- Land a point on a fragment ("Not overhead. A choice.")
- Trust the reader to infer the implication. Spell the implication once, in a full sentence
- Use exclamation marks, ellipsis trails, or bold walls to fake emphasis
- Write a "the line everything else amplifies" and then orbit it

Prefer periods. Use a comma when two clauses belong together. Use an em dash only when a single aside would otherwise need a new sentence, and not twice in the same paragraph.

## Explain how a learning programmer understands it

They often know the everyday version (a SQL table per entity, a pile of prompts, "just JOIN later") and not the workshop version. Build that bridge in order:

1. **Start from what they already do.** Name the familiar setup in words they would type into a search box.
2. **Show the picture, then the name.** "Every kind of row lives in one table. The partition key says which pile. The sort key says which row in that pile." Then you may say "single-table design."
3. **Define jargon on first use.** If the word appears in code, keep the English term in NL copy too (`partition key`, `SKILL.md`) and add a short gloss.
4. **One example they can re-draw.** A key pair, a tiny file tree, three numbered steps. Not a tour of the whole chat.
5. **How to recognize it** in a foreign codebase (what to look for).
6. **A first move** they can try without boiling the ocean.
7. **The catch** juniors hit when they copy the pattern too early.

## Length

Short enough to finish in one sitting. Long enough that a junior does not have to guess. Intro plus example plus three pillars is the default. Do not add a fourth pillar to look complete.

## Examples

**Resonate (too punchy for this skill):**

> The time you spend choosing that shelf is not overhead. It is how you keep the agent on your workflow instead of a generic one.

**Explain (this skill):**

> The agent only sees skill names and short descriptions at first. If the shelf is a long catalog, it may load the wrong file, or none. You keep a short list that matches how you actually work so the agent has a better chance of picking the same habit you would.

**Resonate:**

> Ad-hoc queries are harder. You can't just SELECT * and figure it out later.

**Explain:**

> You cannot ask the table a question you did not plan for. `SELECT * FROM orders WHERE …` is the SQL habit. Here you decide the lookups first, then you encode those lookups into the keys. New questions often mean a new key shape, not a new query string.

NL should teach the same steps, not echo English rhythm. Keep code terms in English when that is what the reader will see in the repo.
