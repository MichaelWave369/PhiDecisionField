# Roadmap

## Rung 1: Decision Kernel (this PR)
- [x] Typed serializable scenario model, transition guards, and invariants
- [x] Seeded stochastic replay and explicit named outcomes
- [x] Finite-horizon choice explorer with node cap
- [x] Within-model counterfactual comparison; no incomplete-search claims
- [x] Automated tests, executable city example, offline-first documentation

## Rung 2: Possibility Explorer
- [ ] Accessible interactive graph viewer, built as a separate UI package
- [ ] Validated JSON import/export
- [ ] State merging, branch filters, and visualization of uncertainty
- [ ] Browser-based story/game integration adapter

## Rung 3: Scientific Laboratory
- [ ] Calibration and proper scoring rules for probabilistic forecasts
- [ ] Explicit causal assumptions and intervention models
- [ ] Information-theoretic empowerment metrics (not raw branch counts)
- [ ] Quantum-cognition probability models compared against classical baselines on held-out data

## Integration contract
FieldAtlas, FieldStoryForge, PieceByPiece, PhiBots, PhiOS, and Gen.E.Wrist should depend on the kernel's public API through adapters, never the reverse. No network or hosted service is required.
