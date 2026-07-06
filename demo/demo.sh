#!/usr/bin/env bash
# Paced replay of a REAL bakeoff run, for the README demo GIF.
# Numbers/verdict are from the saved report:
#   ai-followups/docs/bakeoffs/2026-07-06-8h-24h-deadline-generation-path.md
# This re-renders that run's terminal summary at a readable pace (not a live capture).
set -euo pipefail

DIM=$'\033[2m'; B=$'\033[1m'; R=$'\033[0m'
CYAN=$'\033[36m'; GRN=$'\033[32m'; YEL=$'\033[33m'; MAG=$'\033[35m'

p() { printf '%b\n' "$1"; }

p ""
p "${DIM}grounding · deriving candidate roles…${R}"
sleep 0.9
p "${CYAN}Roles${R} → status-quo · cost-first (Batches) · dedup (merge) · max-savings (hybrid)"
sleep 0.8
p ""
p "${CYAN}Rubric${R} (auto, 6 dims):"
p "  Deadline-fit 28 · COGS reduction 24 · Personalization 16 ·"
p "  Impl. complexity 16 · Ops reliability 12 · Reversibility 4"
sleep 0.9
p "  ${DIM}Proceed to judging?${R} ${GRN}yes${R}"
sleep 0.7
p ""
p "${DIM}judging ×2 · randomized order · reconciling…${R}"
sleep 1.3
p ""
p "${YEL}Both judges picked A (Batches)${R} — leader is suspect, refuting…"
sleep 1.1
p "${DIM}Refute:${R} 50% off an already cohort-collapsed bill ≈ \$30–150/mo —"
p "${DIM}       too small for the async + 8h-fallback machinery${R} ${MAG}→ flips to B${R}"
sleep 1.3
p ""
p "${B}${GRN}Winner: B · Keep synchronous per-cohort generation — 73/100${R}"
sleep 0.4
p "  ${B}B${R}  status-quo         ${GRN}███████████████░░░░░${R}  73"
sleep 0.25
p "  A  Message Batches    ${GRN}██████████████░░░░░░${R}  70"
sleep 0.25
p "  C  embedding-merge    ${GRN}██████████████░░░░░░${R}  69"
sleep 0.25
p "  D  hybrid             ${GRN}███████████░░░░░░░░░${R}  55"
sleep 0.7
p ""
p "${YEL}Runner-up:${R} A (70) — real 50% COGS cut; past ~\$200/mo it wins"
p "${DIM}Report: docs/bakeoffs/2026-07-06-8h-24h-deadline-generation-path.md${R}"
sleep 0.6
