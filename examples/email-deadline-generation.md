# Bakeoff — 8h/24h email-deadline generation path

> **Real run.** This is the actual report from the bakeoff shown in the README demo GIF — the
> decision, rubric, scores, and the adversarial flip are all as produced by a live `/bakeoff` run
> (default depth). Grounded against the Anthropic Message Batches API and the codebase.

**Decision:** For projects on the 8h or 24h send-deadline configs, which draft-generation approach — **Message Batches**, **keep synchronous per-cohort generation**, or **embedding-cosine cohort merging** (plus a hybrid)?

**Date:** 2026-07-06 · **Depth:** default (4 candidates · 2 judges + reconcile · 1 adversarial round) · **Cost:** ~4 scoring passes.

---

## Recommendation

**Keep synchronous per-cohort generation (Candidate B) — for now.** Then adopt **Message Batches (A), scoped to 24h-config projects only**, the moment verified monthly Anthropic spend on this path crosses **~$200/project-month**.

Why: the COGS pain that motivated this decision was raised against a *per-user-Sonnet* mental model. But `cohort_with_opener` already generates **one Sonnet body per cohort + a cheap Haiku opener per recipient** — it collapsed the cost before this decision was even framed. At current volume (20/hr throttle, a handful of cohort bodies per tick) the residual Anthropic spend on this path is small; a verified 50% Batches discount is a 50% cut of an already-small number. Against that saving, Batches adds an async polling loop, partial-failure/expired-batch handling, and — for the 8h path specifically — a fallback-to-synchronous guard (the Batches SLA is ≤24h, not ≤8h). That machinery is a standing failure surface that likely costs more in ops/debugging time than it saves in tokens today.

**This is not "never" — it's "not yet, and instrument the trigger."** The plumbing pays off once volume grows or the product moves toward higher per-recipient personalization (which would re-inflate generation cost). So:
1. **Now:** stay on B. **Instrument** the actual per-project Anthropic spend on the 8h/24h path (the COGS/metering data already exists).
2. **Trigger:** when a project's verified monthly spend on this path exceeds ~$200, route **that project's 24h-config generation** to Batches (A). 24h is inside the SLA, so no fallback guard and roughly half the complexity of the general case.
3. **Skip** the 8h-via-Batches and the embedding-merge/hybrid paths unless the numbers force them — the 8h SLA gap and the merge quality risk aren't worth it at this scale.

## Shortlist (reconciled)

| Rank | Candidate | Overall | Wins on | Loses on |
|---|---|---:|---|---|
| 1 | **B — Status quo (sync per-cohort)** | **73** | deadline-fit, simplicity, ops-maturity, reversibility | COGS reduction (11/100 — zero) |
| 2 | **A — Message Batches** | **70** | COGS (verified 50% off), personalization preserved | 8h SLA risk + async complexity; *absolute* saving small at current volume |
| 3 | **C — Embedding-cosine cohort merging** | **69** | fully sync (no deadline risk) | uncertain savings floor; blander merged bodies |
| 4 | **D — Hybrid (merge → Batches)** | **55** | largest theoretical COGS cut | highest blast radius; two compounding failure surfaces; 8h risk |

## Score matrix (reconciled — average of 2 judges; lower score used on >8-pt disagreements ⚠)

| Dim (weight) | B | A | C | D |
|---|---|---|---|---|
| Deadline-fit reliability (28) | 96 | 65 ⚠ | 93 | 50 ⚠ |
| COGS reduction (24) | 11 | 83 | 50 | 86 |
| Personalization / quality (16) | 85 ⚠ | 85 ⚠ | 58 ⚠ | 58 |
| Implementation complexity (16) | 96 | 50 | 59 | 25 |
| Operational reliability (12) | 94 | 61 | 79 | 39 |
| Reversibility (4) | 96 | 85 | 83 | 78 |
| **Overall** | **73** | **70** | **69** | **55** |

⚠ judges >8 apart on that dimension → the lower score was used (a lead resting on a contested dimension is a weaker lead).

## Judge agreement & the adversarial flip

- **Both judges independently *picked A*** despite B's 3-point raw lead, arguing B's edge sits entirely on dimensions where the status quo makes no improvement (it scores 11/100 on COGS — the decision's whole reason to exist) while A delivers a *verified* 50% cut with full personalization intact.
- **A's own lead was suspect:** its top dimension by weight (deadline-fit, 28) was the most contested (65 vs 80) — reconciled down to 65. Close top-two + a contested load-bearing dimension → one combined adversarial-pairwise round.
- **The adversarial round flipped the pick to B**, landing a load-bearing hit both judges missed: they scored COGS on "50% discount = large" but never estimated the *absolute* base. Once corrected for the cohort architecture (≈1 Sonnet body/cohort, ~$0.005–0.01/body, ~$30–150/mo across ~20 trial projects), the saving is real but sub-$200/mo — too small to justify the async + fallback machinery at current volume. "B improves nothing" is rhetorically strong but irrelevant when the absolute benefit is small; a low-cost correct default beats a fractionally cheaper complex one here.

## Synthesis

No merged candidate out-scored the field. The graft that *did* survive is the **scoping rule itself** — B as the default, A (24h-only) as a metered escalation past a spend threshold — which is the recommendation above. Blending B and A into a single always-on system would just re-import A's complexity without the volume to pay for it.

## Honest caveats

- The dollar magnitudes are the adversarial agent's reasoned estimate, **not measured**. The concrete next action is to pull the *actual* per-project Anthropic spend on this path from the COGS/metering data and confirm where each project sits relative to the ~$200 trigger.
- Judges are LLMs (~±8-pt variance); B's win over A is inside that band. The recommendation is therefore *"B now, with a measured trigger to A"* rather than a hard "A is wrong."
- If the product's cohort model is ever relaxed toward higher per-recipient personalization, generation cost re-inflates and the calculus tips toward A earlier — revisit then.

<details>
<summary>Full rubric</summary>

| Dimension | Weight | Meaning |
|---|---:|---|
| Deadline-fit reliability | 28 | Reliably delivers before BOTH the 8h and 24h deadlines (Batches SLA is ≤24h, not ≤8h) |
| COGS reduction | 24 | How much Anthropic spend it actually cuts vs the already-cheap `cohort_with_opener` baseline |
| Personalization / quality | 16 | Preserves per-recipient tailoring (cohort merging risks blander bodies) |
| Implementation complexity / blast radius | 16 | Async orchestration, polling, new clustering code, failure paths (lower = better) |
| Operational reliability / failure modes | 12 | Partial/expired batch results, deadline-miss recovery, fallbacks |
| Reversibility | 4 | Can back out cleanly (all per-project-gated like the existing strategy) |

**Grounded facts:** Message Batches = 50% token discount, ≤24h SLA (usually <1h), poll-until-`ended` then key results by `custom_id` (Anthropic API reference, current). vibefollow: generation runs at the hourly trigger tick; deadline is the send timer only; `cohort_with_opener` = 1 Sonnet body/cohort + Haiku opener/recipient; ada-002 embeddings already exist; sends throttled 20/hr/project.

</details>
