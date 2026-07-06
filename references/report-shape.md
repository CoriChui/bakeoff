# Bakeoff report shape

Read this at report time (Step 6). Save the full report to
`docs/bakeoffs/YYYY-MM-DD-<slug>.md` (or `--output`), then print the terminal summary.

## Full report template

```markdown
# Bakeoff: <decision>
**Date · Mode (generate/seed/compare) · Candidates K · Winner: <ID> (<score>/100)**

## Recommendation
<winner ID + one-paragraph why it won, citing its top dimensions and the refute result. If the top
two tied, say so and name the factor that broke it (or present both as co-winners).>

## Shortlist
| Rank | ID | Role | Overall | Wins on | Loses on |
|------|----|------|---------|---------|----------|

## Score Matrix
| Dimension (weight) | A | B | C | D |
|--------------------|---|---|---|---|
<reconciled per-cell scores — this is the auditable core of the decision>

## Candidates
### A — <role> — <overall>
<the candidate: approach, key decisions, tradeoffs it accepts; evidence / file:line for code>
**Judge agreement:** <anchor deltas; any CALIBRATION_DISCREPANCY on this candidate>
<repeat for each candidate>

## Refute-the-leader
<the adversarial challenge to #1 and how it resolved — did it survive, or did it demote the leader?>

## Dissents & risks
<where the two judges disagreed; what the runner-up does better; conditions that should reopen this>

## Synthesis (only if it beat the field)
<merged candidate + its re-scored overall; omit entirely if synthesis wasn't kept>

## Rubric
<details>
<summary>Full framework (auditable & reusable)</summary>
<the complete framework YAML — dimensions, weights, rubrics, scoring guide>
</details>

## Metadata
- Roles chosen: <list>
- Sources for the rubric: <count / list>
- Estimated cost: ~$X.XX
- Per-candidate judge agreement: <deltas>
```

## Terminal summary

Keep it compact:

```
Bakeoff: <decision>
Winner: <ID> — <score>/100   (<one-line why>)

  <ID> <role>   ██████████████████░░  <score>
  <ID> <role>   ████████████████░░░░  <score>
  ...

Runner-up: <ID> (<score>) — stronger on <dimension>
Report: <path>
```

Map score→bar over 10 blocks (`█` filled, `░` empty). Lead with the winner; show the shortlist
bars so the human can see how close the field was at a glance.

## HTML report (`--html`)

When `--html` is passed, write a self-contained HTML twin next to the markdown report
(`docs/bakeoffs/YYYY-MM-DD-<slug>.html`). It carries the **same content and numbers** as the
markdown — just presentation-ready to drop into Slack, email, Notion, or a wiki. Hard requirements:

- **Self-contained** — a single `.html` file: inline `<style>`, no external CSS/JS/fonts/CDN/images.
  It must render identically offline.
- **No JavaScript** — a static document only.
- **Dark-mode default**, light via `@media (prefers-color-scheme: light)`; a system-font stack (no
  web-font fetch); print-friendly.
- **Lead with the verdict** — winner + overall score as the hero, then the shortlist and score matrix
  as real `<table>`s (the auditable core), then per-candidate detail and the full rubric in a
  `<details>` block — mirroring the markdown's order.
- **Score bars** — render shortlist overalls as plain inline-CSS bars (a filled `<div>` whose width
  is the score %); no scripts.
- **Never invent** — the markdown is the source of truth; the HTML reformats it and must not add,
  drop, or change a single number or verdict.
