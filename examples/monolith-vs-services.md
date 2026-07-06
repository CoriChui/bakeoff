# Bakeoff: should our new ingestion service be a monolith, a modular monolith, or split services?
**2026-07-06 · Mode: generate · Candidates: 4 · Winner: B (87/100)**

> **Illustrative example** — numbers are hand-authored to show report shape, not a live run.

## Recommendation
**B — Modular monolith (87/100).** It wins the two highest-weight dimensions outright — Operational
simplicity and Migration risk — while staying competitive on scale. It concedes raw scale headroom to
the split-services candidate, but the rubric weights migration risk and operational simplicity higher
for a *new* service where the access patterns aren't yet proven. The adversarial pass ("a modular
monolith rots into a big ball of mud") did not land: the candidate's explicit module boundaries and
the rubric's Evolvability dimension already account for it, and it survived re-scoring.

## Shortlist
| Rank | ID | Role | Overall | Wins on | Loses on |
|------|----|------|---------|---------|----------|
| 1 | B | simplicity-first | 87 | Operational simplicity, Migration risk | Scale headroom |
| 2 | A | migration-safety-first | 79 | Migration risk | Evolvability, Cost |
| 3 | D | scalability-first | 74 | Scale headroom | Migration risk, Cost |
| 4 | C | cost-first | 71 | Cost | Scale headroom |

## Score Matrix
| Dimension (weight) | A (monolith) | B (modular monolith) | C (cost-lean) | D (services) |
|--------------------|:---:|:---:|:---:|:---:|
| Operational simplicity (25) | 78 | 90 | 80 | 55 |
| Scale headroom (20) | 60 | 72 | 58 | 92 |
| Migration risk (20) | 85 | 88 | 70 | 60 |
| Cognitive load (15) | 82 | 84 | 78 | 58 |
| Cost (12) | 80 | 82 | 90 | 62 |
| Evolvability (8) | 62 | 88 | 60 | 90 |
| **Overall** | **79** | **87** | **71** | **74** |

## Candidates
### A — migration-safety-first — 79
A single deployable that mirrors the existing service's shape to minimize migration steps. Lowest
migration risk of the four, but couples the ingestion domain to legacy code and scores worst of the
top three on Evolvability.
**Judge agreement:** anchor deltas ≤ 5; no CALIBRATION_DISCREPANCY.

### B — simplicity-first — 87
One deployable, hard module boundaries (`ingest/`, `normalize/`, `store/`) with enforced internal
interfaces, so a later split to services is mechanical if scale demands it. Accepts a lower ceiling on
independent scaling in exchange for the lowest operational and cognitive overhead.
**Judge agreement:** anchor deltas ≤ 4; no CALIBRATION_DISCREPANCY.

### C — cost-first — 71
Minimal footprint, shared infra, no per-component scaling. Cheapest to run today; pays for it on scale
headroom and evolvability.
**Judge agreement:** anchor deltas ≤ 6.

### D — scalability-first — 74
Split services from day one — best scale headroom and evolvability, worst migration risk, cognitive
load, and cost for a service whose load profile is still unknown.
**Judge agreement:** anchor deltas ≤ 7; one near-discrepancy on Scale headroom (resolved to lower).

## Refute-the-leader
Challenge to B: *"a modular monolith inevitably rots into a big ball of mud — the boundaries won't
hold."* Resolution: the Evolvability dimension (weight 8) already prices this in, and B scored 88 there
precisely because the boundaries are enforced at the interface level, not by convention. **B survived**
— no re-score triggered.

## Dissents & risks
Judges diverged most on D's Scale headroom (85 vs 92); the lower anchor was used. Reopen this decision
if measured ingest volume approaches the point where independent scaling of the `store/` component
becomes the bottleneck — at which point B's enforced boundaries make the split to D cheap.

## Rubric
<details>
<summary>Full framework (auditable & reusable)</summary>

```yaml
dimensions:
  - name: Operational simplicity
    weight: 25
  - name: Scale headroom
    weight: 20
  - name: Migration risk
    weight: 20
  - name: Cognitive load
    weight: 15
  - name: Cost
    weight: 12
  - name: Evolvability
    weight: 8
# (band definitions and scoring_guide omitted from this illustrative sample)
```
</details>

## Metadata
- Roles chosen: scalability-first · simplicity-first · migration-safety-first · cost-first
- Estimated cost: ~$2.80 (default depth)
