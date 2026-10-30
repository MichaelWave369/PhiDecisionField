# Φ Decision Field

**A reproducible, offline-first engine for modeling choices and possibility spaces.**

A "decision portal" is a software metaphor. This project does not claim human decisions create physical quantum portals, predict real-world outcomes, or prove anything about quantum consciousness.

## v0.1.0-alpha.1: Decision Kernel

- Typed, serializable TypeScript scenario definitions
- Immutable transitions, explicit guards, effects, and invariants
- Optional weighted outcomes with seeded reproducible replay
- Finite-horizon choice tree that enumerates every possible outcome
- Within-model counterfactual comparison of two first decisions
- Strict node limits with explicit truncation reporting
- Zero runtime dependencies, no cloud or AI required

## Run locally

Requires Node.js 20+.

1. Clone this repository.
2. Run **npm install**.
3. Run **npm test** to compile and run the kernel tests.
4. Run **npm run demo** to explore a toy three-choice city scenario.

The library exports validateScenario, applyDecision, simulate, explore, compareFirstDecisions, seededRandom, and cityScenario. The executable example is at examples/city.mjs.

## Example

A fictional city starts with ten material units, two energy units and three trust units. It can restore its power grid, explore ruins, or open a marketplace. Each action changes which later states are reachable. Exploration has two weighted outcomes; these are fictional scenario assumptions, not calibrated real-world probabilities.

## Architecture

The decision kernel is deliberately independent of FieldAtlas, FieldStoryForge, PieceByPiece, PhiBots, Gen.E.Wrist, and PhiOS. Each can integrate through an adapter later; none is required to use the kernel.

- [Formal model and scientific limits](docs/FORMAL_MODEL.md)
- [Development roadmap](docs/ROADMAP.md)
- [City demo](examples/city.mjs)

## Credibility commitments

Every reported future is **simulated**, not observed. Probabilities are author-assigned until validated. Truncated searches cannot justify exhaustive claims. Branch count does not equal agency or controllability.

MIT licensed. Copyright 2026 Φ369 Labs.
