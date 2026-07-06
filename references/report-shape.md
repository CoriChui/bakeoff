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
