# Decision Field v1: formal model and epistemic boundaries

This kernel is a **finite, user-authored state-transition simulator**, not a theory of quantum portals or a real-world predictive oracle.

## Formal model

A scenario defines an initial world state S0, a finite decision set A, preconditions C(a), ordered effects E(a), optional weighted outcomes O(a), and invariants I.

A transition T(s,a,o) = s' exists only if the current state satisfies invariants, the action satisfies preconditions, the selected outcome belongs to the action (if stochastic), and the resulting state satisfies invariants. Effects apply left-to-right. Common action effects precede outcome effects. Unlocks are persistent and idempotent.

Simulation records an action and outcome history. A stochastic decision without an explicit outcome uses a locally seeded deterministic pseudorandom generator. Weights are relative within an action and are **authored assumptions, not measured real-world probabilities**.

Exploration enumerates a finite **choice tree** up to the requested horizon, including stochastic outcomes. It does not merge equivalent intermediate states. A branch that violates an invariant is excluded. A maximum node count bounds work; when reached, the tree is flagged as truncated and must not be described as exhaustive.

Counterfactual comparison fixes one of two first decisions, enumerates states reachable at depths 1 through H, deduplicates resulting state snapshots by canonical serialization, and identifies shared and exclusive states. It refuses truncated searches. This is a **within-model counterfactual**, not an identified outside-world causal effect.

## Intentional limits

- Flat scalar-valued state only, no nested objects or arbitrary code in scenarios.
- Ordered numeric comparisons, exact scalar equality, set/add/unlock effects.
- No IO, networking, LLM calls, databases, or runtime plugins.
- No claims of quantum consciousness, literal portals, multiverses, or human free will.
- Branch counts are **not** empowerment. Reachability does not imply probability or control.
- Choice-tree size is exponential in horizon. Keep horizons small and respect truncation.

## Future experiments, not yet implemented

- Bounded state abstraction and graph deduplication.
- Partial observability, calibrated probabilistic forecasting, and causal interventions.
- Empowerment calculations grounded in information theory.
- Quantum-probability cognition models evaluated against classical baselines using held-out data.

Clearly label **simulated**, **estimated**, and **observed** statements in every integration.
