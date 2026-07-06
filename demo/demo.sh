#!/usr/bin/env bash
# Scripted reproduction of a bakeoff terminal summary, for the README demo GIF.
# Output shape matches references/report-shape.md — this is a paced replay, not a live run.
set -euo pipefail

DIM=$'\033[2m'; B=$'\033[1m'; R=$'\033[0m'
CYAN=$'\033[36m'; GRN=$'\033[32m'; YEL=$'\033[33m'; MAG=$'\033[35m'

p() { printf '%b\n' "$1"; }

p ""
p "${DIM}deriving candidate roles…${R}"
sleep 0.9
p "${CYAN}Roles${R} → scalability-first · simplicity-first · migration-safety-first · cost-first"
sleep 0.8
p ""
p "${CYAN}Rubric${R} (auto, 6 dims):"
p "  Operational simplicity 25 · Scale headroom 20 · Migration risk 20 ·"
p "  Cognitive load 15 · Cost 12 · Evolvability 8"
sleep 0.9
p "  ${DIM}Proceed to judging?${R} ${GRN}yes${R}"
sleep 0.7
p ""
p "${DIM}judging ×2 · randomized order · reconciling…${R}"
sleep 1.4
p ""
p "${B}${GRN}Winner: B · Modular monolith — 87/100${R}"
sleep 0.4
p "  ${B}B${R}  simplicity-first        ${GRN}██████████████████░░${R}  87"
sleep 0.25
p "  A  migration-safety-first  ${GRN}████████████████░░░░${R}  79"
sleep 0.25
p "  D  scalability-first       ${GRN}███████████████░░░░░${R}  74"
sleep 0.25
p "  C  cost-first              ${GRN}██████████████░░░░░░${R}  71"
sleep 0.7
p ""
p "${YEL}Runner-up:${R} A (79) — stronger on migration risk"
p "${DIM}Report: docs/bakeoffs/2026-07-06-ingestion-architecture.md${R}"
sleep 0.6
