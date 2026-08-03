# EotoWebsie Agent Instructions

## Four-Role Delivery Cycle

Use one coordinated cycle for every substantial task:

- **Architect** protects boundaries, data flow, lifecycle, performance,
  maintainability, and test strategy.
- **Designer** protects user goal, hierarchy, interaction, accessibility, motion,
  responsive behavior, and visual coherence.
- **Coder** protects feasibility, focused execution, repository conventions,
  integration, and verification.
- **Manager** owns acceptance criteria and decides `ACCEPT` or `REVISE` from
  actual diff and evidence.

These are four lenses on the same artifact, not independent agents with separate
goals. Each role reviews the same requirement, current implementation, diff, and
evidence. No role may silently expand scope. Do not start the next task or commit
the current task until the manager returns `ACCEPT`.

## 1. Freeze Goal Contract

Before planning or editing, write a compact working contract:

```text
GOAL: One user-visible outcome.
IN SCOPE: Behaviors and surfaces allowed to change.
OUT OF SCOPE: Nearby work intentionally untouched.
DONE WHEN: Observable acceptance criteria.
CONSTRAINTS: Technical, visual, performance, accessibility, and process limits.
EVIDENCE: Tests, browser checks, screenshots, measurements, or build output.
```

Derive contract from newest user request plus still-active constraints. Inspect
repository before filling unknowns. Ask user only when missing information blocks
a safe decision.

Goal contract remains fixed during cycle. Change it only when:

- user changes requirement;
- discovered technical fact makes criterion impossible or unsafe;
- all four roles agree clarification is required.

State changed contract before continuing.

## 2. Run Joint Preflight

All four roles review goal before code:

```text
ARCHITECTURE: Boundaries, risks, failure modes, test strategy, performance budget.
DESIGN: Intended experience, hierarchy, states, edge cases, visual proof.
CODING: Smallest vertical slices, files involved, dependency order.
MANAGEMENT: Acceptance criteria, evidence required, scope and commit gate.
CONVERGENCE: Agreed approach, rejected options, first slice.
```

Resolve conflicts with this priority:

1. Explicit user instruction.
2. Frozen goal and acceptance criteria.
3. Safety, accessibility, and functional correctness.
4. User experience and visual coherence.
5. Performance and maintainability.
6. Optional polish.

Prefer smallest approach satisfying all higher-priority constraints. Record
important trade-offs; do not average incompatible ideas into a vague compromise.

## 3. Work in Vertical Slices

Each slice must deliver one observable part of goal end to end.

For every slice:

1. Restate acceptance criterion being advanced.
2. Architect names technical invariant and failure test.
3. Designer names visual or interaction invariant.
4. Coder changes smallest coherent code surface.
5. Add or update tests in same slice.
6. Run narrow tests immediately.
7. Inspect actual runtime when behavior is visual or interactive.
8. Run joint review gate before next slice.

Do not batch unrelated cleanup, speculative abstractions, content edits, or visual
experiments into slice. Refactor only when needed to satisfy criterion or make
change testable.

## 4. Joint Review Gate

After each slice, all roles review actual result:

```text
DESIGN REVIEW
- Does result improve stated user outcome?
- Does it work across required viewports, input modes, motion preferences, and
  visual states?
- Is hierarchy clearer without harming surrounding composition?

ARCHITECTURE REVIEW
- Any correctness, lifecycle, cleanup, race, performance, or integration defect?
- Does code follow existing boundaries and avoid unnecessary complexity?
- Would tests catch realistic regression, not only implementation detail?

CODING REVIEW
- Does runtime match code intent?
- Are tests, lint, types, build, assets, and fallback behavior healthy?
- Did diff touch only allowed scope?

DECISION
- ACCEPT: Slice satisfies criterion.
- REVISE: Fix named in-scope defect, then repeat gate.
- DEFER: Valid issue outside contract; report it without implementing.

Only manager issues decision after considering all role reviews and evidence.
```

Severity:

- **Blocker**: acceptance, safety, correctness, accessibility, or severe
  performance failure. Fix before continuing.
- **Should**: clear in-scope quality defect. Fix within current cycle.
- **Later**: useful but outside goal. Record only.

## 5. Drift Guard

At every plan update and before every edit, ask:

```text
Which DONE WHEN criterion does this change advance?
```

If answer is none, do not make change.

Additional guardrails:

- New ideas do not become requirements without user approval.
- Designer cannot redesign unrelated surfaces.
- Architect cannot start broad architecture cleanup.
- Coder cannot substitute easier behavior for acceptance criterion.
- Manager cannot accept without named evidence for every criterion.
- Tests may touch supporting infrastructure only as required for in-scope proof.
- Preserve user changes and unrelated dirty files.
- Latest user instruction overrides older plan; reconcile contract explicitly.

## 6. Verification Ladder

Use cheapest useful evidence first, then broaden:

1. Pure unit tests for math, mapping, state, shader/config invariants.
2. Component/integration tests for lifecycle and interaction.
3. Real-browser checks for 3D, assets, raycasts, depth, responsive layout, motion,
   and visibility.
4. Visual inspection at representative desktop and mobile viewports.
5. Full quality gate before final response.

Project commands:

- After each behavior/code slice: `npm run test:unit`.
- After 3D, visual, interaction, asset, raycast, depth, or responsive changes:
  `npm run test:browser`.
- Before final response when code changed: `npm run lint`, `npm test`,
  `npm run build`.

Screenshots support tests; they do not replace assertions. Strengthen tests when a
realistic break survives existing coverage. If proof is impossible, state exact
reason and residual risk.

For visual effects, verify both presence and restraint:

- effect exists above measurable visibility threshold;
- subject remains readable;
- animation changes over time when required;
- reduced-motion behavior remains valid;
- frame cost and resource use stay within current baseline.

## 7. Completion Gate

Task completes only when:

- every `DONE WHEN` criterion has evidence;
- all Blocker and Should findings are resolved;
- Architect confirms code boundaries and tests;
- Designer confirms intended experience;
- Coder confirms runtime and quality commands;
- Manager returns `ACCEPT`;
- remaining issues are explicitly deferred, not hidden.

Final report stays compact:

```text
RESULT: What changed.
PROOF: Tests and runtime checks.
DECISIONS: Important trade-offs.
DEFERRED: Out-of-scope or residual risks.
```
