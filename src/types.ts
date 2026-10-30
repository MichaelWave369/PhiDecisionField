/** Domain-neutral, serializable model. v1 supports flat scalar-valued states. */
export type Scalar = string | number | boolean | null;
export type Comparator = "==" | "!=" | ">" | ">=" | "<" | "<=";

export interface WorldState {
  values: Record<string, Scalar>;
  unlocked: string[];
}

export interface Condition {
  key: string;
  operator: Comparator;
  value: Scalar;
}

export type Effect =
  | { kind: "set"; key: string; value: Scalar }
  | { kind: "add"; key: string; value: number }
  | { kind: "unlock"; id: string };

export interface WeightedOutcome {
  id: string;
  /** Relative positive weight, not a calibrated real-world probability. */
  weight: number;
  effects: Effect[];
}

export interface Decision {
  id: string;
  label: string;
  requirements?: Condition[];
  effects: Effect[];
  /** When present, each possible outcome represents a distinct branch. */
  outcomes?: WeightedOutcome[];
}

export interface Scenario {
  schemaVersion: "phidecisionfield/v1";
  id: string;
  initialState: WorldState;
  decisions: Decision[];
  /** Conditions that must hold initially and after each transition. */
  invariants?: Condition[];
}

export interface Choice {
  decisionId: string;
  /** Explicit selection for replay, or a seed chooses the branch. */
  outcomeId?: string;
}

export interface TransitionResult extends Choice {
  state: WorldState;
}

export interface ReplayStep extends TransitionResult {
  index: number;
}

export interface ReplayResult {
  seed: number;
  initialState: WorldState;
  steps: ReplayStep[];
  finalState: WorldState;
}

export interface GraphNode {
  id: string;
  depth: number;
  state: WorldState;
  path: Choice[];
}

export interface GraphEdge extends Choice {
  from: string;
  to: string;
}

export interface Exploration {
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** True when exploration hit maxNodes before all branches were visited. */
  truncated: boolean;
}

export interface ExploreOptions {
  maxNodes?: number;
  /** Filter the first transition to this decision, for counterfactual comparison. */
  firstDecisionId?: string;
}

export interface CounterfactualComparison {
  firstDecisionA: string;
  firstDecisionB: string;
  horizon: number;
  reachableA: WorldState[];
  reachableB: WorldState[];
  onlyA: WorldState[];
  onlyB: WorldState[];
  shared: WorldState[];
}
