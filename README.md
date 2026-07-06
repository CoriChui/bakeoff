# bakeoff

**Turn one hard "which should I do?" into a judged tournament — and get back a defensible winner.**

<p align="center">
  <img src="demo/bakeoff.gif" alt="bakeoff deriving roles, auto-building a rubric, judging candidates, and ranking a winner" width="820">
</p>
<p align="center">
  <sub>Terminal summary from a real run — verdict and scores are from the saved <a href="examples/email-deadline-generation.md">report</a>, re-rendered at a readable pace.</sub>
</p>

`bakeoff` is a [Claude Code](https://docs.claude.com/en/docs/claude-code) skill. Hand it a decision and it **generates diverse candidate solutions**, **auto-derives the criteria that matter for _that_ specific problem** (so you don't have to know what to score on), **judges every candidate with independent scorers**, and returns the **winner plus a ranked shortlist** — with the reason each one won or lost.

The hard part of any comparison isn't the scoring — it's knowing *what to evaluate*. bakeoff derives the rubric for you. Here's the run shown in the GIF above:

```
/bakeoff "8h/24h email deadline: Batches vs keep-sync vs merge?"

Roles  → status-quo · cost-first · dedup · max-savings
Rubric → Deadline-fit 28 · COGS 24 · Personalization 16 ·
         Complexity 16 · Ops 12 · Reversibility 4  [approve? yes]
Judges ×2 → reconcile → shortlist
   B  keep sync per-cohort   73   wins deadline-fit; 0 on COGS
   A  Message Batches        70   50% off, tiny in absolute $
   C  embedding merge        69
   D  hybrid                 55
Refute → both judges picked A, but the 50% cut is half of an
         already-tiny bill (~$30–150/mo) → flips to B
Winner → B: keep sync now; escalate 24h projects past ~$200/mo
```

You never supplied the six dimensions or their weights — and the adversarial pass caught that the judges' pick rested on a saving too small to matter. That's the point.

---

## Why it's built this way

- **Select, don't blend.** Diverse candidates + judge-based *selection* beats averaging them into mush. Synthesis is offered only as an optional final graft — and only kept if it *re-scores above* the best single candidate.
- **Diversity is the biggest lever.** Each candidate generator gets a distinct, problem-specific role (e.g. `scalability-first` vs `migration-safety-first`), so the field genuinely spans the space.
- **Independent judges, mechanically reconciled** — not a debate (debate amplifies bias). Two judges score independently; a deterministic script merges them with a lower-score rule on disagreements.
- **Position-bias controlled.** Each judge sees the candidates in a different shuffled order, referenced by stable IDs.
- **The leader gets stress-tested.** Before committing, an adversarial pass actively tries to *refute* the top candidate. A plausible-but-wrong winner shouldn't survive.
- **Grounded when it matters.** For decisions that hinge on real facts (a library version, your actual codebase), it reads/searches before judging — and flags any part it couldn't verify as "training-knowledge only."

## Install

Pick one — all three install the same self-contained skill.

**Agent Skills CLI** (works with Claude Code, Codex, Cursor):

```bash
npx skills add YOUR_USERNAME/bakeoff
```

**Claude Code plugin** (marketplace install, auto-updates):

```
/plugin marketplace add YOUR_USERNAME/bakeoff
/plugin install bakeoff@bakeoff
```

**Manual** — clone straight into your skills directory:

```bash
git clone https://github.com/YOUR_USERNAME/bakeoff.git ~/.claude/skills/bakeoff
```

Then in Claude Code:

```
/bakeoff "which caching strategy should we use for the API layer?"
```

That's it. The skill is **self-contained** — the rubric-builder, scorer, and reconciliation script are bundled (adapted from the `evaluate` skill). No other skills required.

### Requirements

- **[Claude Code](https://docs.claude.com/en/docs/claude-code)** (skills support).
- **Node.js** on your `PATH` — the score reconciler (`scripts/reconcile-scores.js`) runs under Node.

## When to use it

Reach for bakeoff when **all three** hold:

1. **Wide solution space** — several genuinely defensible approaches, not one obvious answer.
2. **Costly to reverse** — a wrong call is expensive to unwind.
3. **Unclear criteria** — you can't easily say *why* one option should beat another.

Good fits: architecture choices, library/database/tool selection, refactor strategies, migration approaches, "is the AI's suggestion actually good, or is there something better?"

**Don't** use it when a test, type-check, or lint settles the question, or when you're scoring a single artifact with no alternatives — that's a job for a plain evaluation, not a tournament.

## Modes & depth

| Entry point | What it does |
|---|---|
| `/bakeoff "<problem>"` | **Generate** — invents the candidates (default). |
| `/bakeoff --seed <path\|"text"> "<problem>"` | **Seed** — keeps your existing plan as Candidate A and generates rivals around it. |
| `/bakeoff --compare` (+ 2–4 pasted candidates) | **Compare** — pure judging over what you bring. |

Depth auto-scales to the stakes (override with `--lean` / `--thorough`):

| Depth | Candidates | Judges | Refute | Synthesis | Auto-picked when… |
|-------|-----------|--------|--------|-----------|-------------------|
| `--lean` | 3 | 1 | no | no | narrow · low blast radius · reversible |
| *default* | 4 | 2 + reconcile | yes | offered | several defensible options · costly-but-recoverable |
| `--thorough` | 5–6 | 2 + reconcile | yes | yes | irreversible · prod · data-model / public-API / migration / security |

See [`SKILL.md`](SKILL.md) for the full flag list and pipeline.

## How it works

```
FRAME → { GENERATE K candidates  ∥  BUILD RUBRIC } → [rubric gate] →
   JUDGE (2 scorers ∥, randomized order, reconciled) →
   RANK → ADVERSARIAL CHECK (only if the top-two are close or the leader is suspect) →
   winner + top-N shortlist (+ optional synthesis) → REPORT
```

The rubric is built **in parallel** with candidate generation and **blind to the candidates** — so it describes the *decision*, not whichever option it might otherwise favor. Every run ends with a saved report (`docs/bakeoffs/YYYY-MM-DD-<slug>.md`) containing the recommendation, the shortlist, the full score matrix, judge agreement, and the rubric — so the decision is auditable and reusable later.

See full saved reports — a real run and an illustrative one — in [`examples/`](examples/).

## License

[MIT](LICENSE)
