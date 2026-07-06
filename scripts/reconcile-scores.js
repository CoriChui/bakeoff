#!/usr/bin/env node
'use strict';

// Mechanical dual-anchor reconciliation for the Evaluate Anything skill.
// Reads two scoring YAML files (from agents A and B), finds dimensions
// scored by both (anchor dimensions), applies the lower-score rule with
// CALIBRATION_DISCREPANCY flag when delta > 8, and outputs a merged
// summary to stdout as JSON.
//
// Usage:
//   node reconcile-scores.js <agent-a.yaml> <agent-b.yaml>
//
// The schema assumed for each input file: a top-level list keyed by
// `dimension_scores:` (also accepts the aliases `dimensions:` / `scores:`)
// where each entry has `name:` (or `dimension:`), `score:` (integer 0-100),
// and `band:` fields. Anchor dimensions are detected by name overlap.
//
// The extractor is indentation-aware: it reads `score:`/`band:` ONLY at the
// dimension entry's own key indent and treats a more-deeply-indented
// `- name:`/`score:` (e.g. nested comparison-target scores) as belonging to
// the entry, NOT as a new dimension. A nesting-blind parser silently let a
// nested comparison `score:` overwrite the dimension's real score.

const fs = require('fs');

function die(msg, code = 1) {
  process.stderr.write(`reconcile-scores: ${msg}\n`);
  process.exit(code);
}

// Minimal YAML extractor — we only need dimension name/score/band.
// Avoids an external yaml dependency for portability. Indentation-aware so
// nested sub-lists (e.g. per-dimension comparison-target scores) cannot leak
// into the dimension's own score.
function leadingIndent(line) {
  const m = line.match(/^([ \t]*)/);
  // Treat a tab as two columns so mixed indentation still compares sanely.
  return m[1].replace(/\t/g, '  ').length;
}

function extractDimensionScores(text) {
  const lines = text.split('\n');
  const results = [];
  let current = null;
  let inBlock = false;
  let listDashIndent = null; // indent of the `-` for top-level dimension entries
  let entryKeyIndent = null; // indent of keys belonging to the current entry

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Block start — accept `dimension_scores:` and the `dimensions:`/`scores:`
    // aliases, at column 0 (a real top-level key).
    if (/^(?:dimension_scores|dimensions|scores):\s*$/.test(line)) {
      if (current) { results.push(current); current = null; } // flush before re-entering
      inBlock = true; listDashIndent = null; entryKeyIndent = null;
      continue;
    }
    if (!inBlock) continue;
    // Comments and blank lines never end the block.
    if (/^\s*#/.test(line)) continue;
    if (/^\s*$/.test(line)) continue;
    const indent = leadingIndent(line);
    // Any real top-level key (column 0, not a list item) ends the block.
    // Flush the in-progress entry FIRST — the last dimension is often followed
    // immediately by a sibling top-level key (e.g. `comparisons:`).
    if (indent === 0 && !/^\s*-\s/.test(line)) {
      if (current) { results.push(current); current = null; }
      inBlock = false; continue;
    }

    // Capture the leading whitespace (1), the dash-and-spaces prefix (2), and
    // the name (3) separately so the entry's key column is MEASURED, not assumed.
    const mItem = line.match(/^([ \t]*)(-[ \t]*)(?:name|dimension):\s*["']?(.+?)["']?\s*$/);
    if (mItem) {
      const dashIndent = mItem[1].replace(/\t/g, '  ').length; // columns before the `-`
      if (listDashIndent === null) listDashIndent = dashIndent;
      if (dashIndent === listDashIndent) {
        // A new dimension entry at the established list level.
        if (current) results.push(current);
        current = { name: mItem[3].trim(), score: null, band: null };
        // Continuation keys align with the FIRST key after the dash, whose
        // column = leading + "- " width. Derive it (handles `- name` and the
        // non-standard `-   name` alike) rather than assuming dash + 2.
        entryKeyIndent = (mItem[1] + mItem[2]).replace(/\t/g, '  ').length;
        continue;
      }
      // A more-deeply-indented `- name:` is nested content (e.g. a comparison
      // target) — it belongs to the current entry, not a new dimension.
      continue;
    }
    if (!current) continue;
    // Only read score/band at THIS entry's own key indent — a deeper `score:`
    // (a nested comparison score) must not overwrite the dimension score.
    if (entryKeyIndent !== null && indent !== entryKeyIndent) continue;
    const mScore = line.match(/^\s*score:\s*(\d+)\b/);
    if (mScore) { current.score = parseInt(mScore[1], 10); continue; }
    const mBand = line.match(/^\s*band:\s*["']?([a-z]+)["']?/);
    if (mBand) { current.band = mBand[1]; continue; }
  }
  if (current) results.push(current);
  return results.filter(d => d.score !== null);
}

// Normalize a dimension name for fuzzy matching: lowercase, strip punctuation,
// collapse whitespace. Catches variants like "Rubric Quality & Calibration"
// vs "Rubric Quality and Calibration" vs "rubric-quality-calibration".
function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Token-subset match: returns true if all tokens of the shorter name appear
// in the longer name. Catches "Evidence Rigor" vs "Evidence Rigor & Diagnostic Depth".
// Only the first 2 content tokens (skipping stop words) need to match — catches
// intentional abbreviation without collapsing different dimensions that happen
// to share one word.
function tokenSubsetMatch(a, b) {
  const STOP = new Set(['and', 'the', 'of', 'a', 'for', 'to', 'in', 'with']);
  const toks = s => normalizeName(s).split(' ').filter(t => t && !STOP.has(t));
  const ta = toks(a);
  const tb = toks(b);
  const [shorter, longer] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shorter.length < 2) return false; // Too weak a signal — would match everything
  const longerSet = new Set(longer);
  const head = shorter.slice(0, 2);
  return head.every(t => longerSet.has(t));
}

// Cohen's kappa for inter-rater agreement, computed on the anchor
// dimensions that both agents scored. Scores are discretized to their
// 5 bands (failing/weak/adequate/strong/exceptional) and kappa is
// computed over the band-assignments. This mirrors the rubric's
// intent — inter-rater agreement on band, not on raw score.
function scoreBand(s) {
  if (s >= 90) return 'exceptional';
  if (s >= 75) return 'strong';
  if (s >= 60) return 'adequate';
  if (s >= 40) return 'weak';
  return 'failing';
}

// Map a kappa value to a label. Bands aligned to the skill's enforced kappa
// gates (evaluate.md): almost-perfect is ≥ 0.85 (NOT the Landis-Koch 0.80)
// because the rubric's exceptional criterion mandates kappa > 0.85 — the label
// must match the gate, or 0.82 reads as "almost_perfect" here while the spec
// treats it as "substantial".
function interpretKappa(kappa) {
  return kappa >= 0.85 ? 'almost_perfect' :
         kappa >= 0.60 ? 'substantial' :
         kappa >= 0.40 ? 'moderate' :
         kappa >= 0.20 ? 'fair' :
         kappa > 0.00  ? 'slight' : 'poor';
}

function cohenKappa(pairs) {
  if (pairs.length < 2) return { value: null, reason: 'need ≥2 anchor pairs' };
  const categories = ['exceptional', 'strong', 'adequate', 'weak', 'failing'];
  const N = pairs.length;
  let observed = 0;
  const aCounts = {};
  const bCounts = {};
  for (const c of categories) { aCounts[c] = 0; bCounts[c] = 0; }
  for (const { a, b } of pairs) {
    if (a === b) observed++;
    aCounts[a] = (aCounts[a] || 0) + 1;
    bCounts[b] = (bCounts[b] || 0) + 1;
  }
  const Po = observed / N;
  let Pe = 0;
  for (const c of categories) Pe += (aCounts[c] / N) * (bCounts[c] / N);
  if (Pe >= 1) return { value: null, reason: 'Pe = 1 — all scores in same band, kappa undefined' };
  const kappa = (Po - Pe) / (1 - Pe);
  const interpretation = interpretKappa(kappa);
  return { value: Math.round(kappa * 100) / 100, Po: Math.round(Po * 100) / 100, Pe: Math.round(Pe * 100) / 100, n: N, interpretation };
}

function reconcile(aScores, bScores) {
  // First pass: exact-name buckets keyed by normalized form.
  const byNormalized = {};
  for (const d of aScores) {
    const key = normalizeName(d.name);
    byNormalized[key] = byNormalized[key] || { displayName: d.name };
    byNormalized[key].a = d;
  }
  for (const d of bScores) {
    const key = normalizeName(d.name);
    if (!byNormalized[key]) {
      byNormalized[key] = { displayName: d.name };
    }
    byNormalized[key].b = d;
  }

  // Second pass: token-subset merge for buckets that only have one agent's
  // score. If we can match an A-only bucket with a B-only bucket via token
  // subset (catches abbreviations), merge them under A's display name.
  const entries = Object.entries(byNormalized);
  const matched = new Set();
  for (let i = 0; i < entries.length; i++) {
    const [ki, ei] = entries[i];
    if (matched.has(ki)) continue;
    if (ei.a && ei.b) continue;
    for (let j = i + 1; j < entries.length; j++) {
      const [kj, ej] = entries[j];
      if (matched.has(kj)) continue;
      if (ej.a && ej.b) continue;
      // Only merge if one has "a" and the other has "b"
      if ((ei.a && ej.b && !ei.b && !ej.a) || (ei.b && ej.a && !ei.a && !ej.b)) {
        if (tokenSubsetMatch(ei.displayName, ej.displayName)) {
          // Merge ej into ei
          if (ej.a) ei.a = ej.a;
          if (ej.b) ei.b = ej.b;
          ei.fuzzy_merged_from = ej.displayName;
          matched.add(kj);
        }
      }
    }
  }

  // Rebuild with display names so anchors use a consistent label,
  // dropping the entries that were merged away.
  const byName = {};
  for (const [k, entry] of entries) {
    if (matched.has(k)) continue;
    byName[entry.displayName] = entry;
  }

  const merged = [];
  const anchors = [];
  const discrepancies = [];

  for (const [name, entry] of Object.entries(byName)) {
    if (entry.a && entry.b) {
      // Dimension scored by both — anchor
      const delta = Math.abs(entry.a.score - entry.b.score);
      const lower = entry.a.score <= entry.b.score ? entry.a.score : entry.b.score;
      const avg = Math.round((entry.a.score + entry.b.score) / 2);
      const finalScore = delta <= 3 ? avg : lower;
      const record = {
        name,
        agent_a: entry.a.score,
        agent_b: entry.b.score,
        delta,
        final_score: finalScore,
        rule: delta <= 3 ? 'average (high agreement)' :
              delta <= 8 ? 'lower (weight weaker evidence)' :
              'lower + CALIBRATION_DISCREPANCY',
        flag: delta > 8 ? 'CALIBRATION_DISCREPANCY' : null,
      };
      anchors.push(record);
      if (delta > 8) discrepancies.push(record);
      merged.push({ name, score: finalScore, source: 'anchor', ...record });
    } else {
      const only = entry.a || entry.b;
      const source = entry.a ? 'agent_a' : 'agent_b';
      merged.push({ name, score: only.score, band: only.band, source });
    }
  }

  // Compute Cohen's kappa over anchor band pairs (not raw scores — band
  // agreement is what the rubric optimizes for).
  const kappaPairs = anchors.map(a => ({
    a: scoreBand(a.agent_a),
    b: scoreBand(a.agent_b),
  }));
  const kappa = cohenKappa(kappaPairs);

  // Kappa is unstable below 3 anchor pairs — at n=2 a single band-boundary
  // straddle (e.g. 91 vs 83: both within 8 raw points but exceptional-vs-strong)
  // drives kappa to ~0 even though the raters AGREE on the score. Flag that so a
  // gate does not block on a degenerate statistic. The robust fallback signal is
  // the raw anchor score delta: agreement the rubric actually cares about.
  kappa.degenerate = kappa.value === null || anchors.length < 3;
  if (kappa.degenerate) {
    kappa.note = anchors.length < 3
      ? `n=${anchors.length} anchor pair(s) — too few for a stable kappa; use score_agreement (raw deltas) instead`
      : (kappa.reason || 'kappa undefined; use score_agreement (raw deltas) instead');
  }

  // Raw-score agreement — the reliable inter-rater signal when kappa is
  // degenerate. all_within_tolerance mirrors the dual-anchor rule (delta <= 8
  // is "agreement, use lower"; delta > 8 is a genuine CALIBRATION_DISCREPANCY).
  const deltas = anchors.map(a => a.delta);
  const maxAnchorDelta = deltas.length ? Math.max(...deltas) : null;
  const score_agreement = {
    max_anchor_delta: maxAnchorDelta,
    mean_anchor_delta: deltas.length
      ? Math.round((deltas.reduce((s, d) => s + d, 0) / deltas.length) * 10) / 10
      : null,
    all_within_tolerance: deltas.length > 0 && deltas.every(d => d <= 8),
    basis: 'raw anchor score deltas — authoritative when kappa.degenerate is true',
  };

  return { merged, anchors, discrepancies, kappa, score_agreement };
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 2) {
    die('usage: reconcile-scores.js <agent-a.yaml> <agent-b.yaml>');
  }
  const [aPath, bPath] = argv;
  if (!fs.existsSync(aPath)) die(`file not found: ${aPath}`);
  if (!fs.existsSync(bPath)) die(`file not found: ${bPath}`);

  const aScores = extractDimensionScores(fs.readFileSync(aPath, 'utf8'));
  const bScores = extractDimensionScores(fs.readFileSync(bPath, 'utf8'));

  if (aScores.length === 0) die(`no dimension_scores found in ${aPath}`);
  if (bScores.length === 0) die(`no dimension_scores found in ${bPath}`);

  const result = reconcile(aScores, bScores);
  result.agent_a_count = aScores.length;
  result.agent_b_count = bScores.length;
  result.anchor_count = result.anchors.length;
  result.has_discrepancies = result.discrepancies.length > 0;
  console.log(JSON.stringify(result, null, 2));
  // Non-zero exit only if discrepancies were found — orchestrator can branch on this.
  process.exit(result.discrepancies.length > 0 ? 3 : 0);
}

if (require.main === module) main();
// Exported for unit tests (test-eval-scripts.js).
module.exports = { extractDimensionScores, cohenKappa, scoreBand, interpretKappa, reconcile };
