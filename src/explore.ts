import { applyDecision } from "./kernel.js";
import { canonicalState, copyState, getDecision, ModelError, validateScenario } from "./model.js";
import type { CounterfactualComparison, ExploreOptions, Exploration, Scenario, WorldState } from "./types.js";

/** Enumerate a finite-horizon choice tree, including every stochastic outcome. */
export function explore(scenario: Scenario, horizon: number, options: ExploreOptions = {}): Exploration {
  validateScenario(scenario);
  if (!Number.isInteger(horizon) || horizon < 0) {
    throw new ModelError("Horizon must be a nonnegative integer");
  }
  const maxNodes = options.maxNodes ?? 10000;
  if (!Number.isInteger(maxNodes) || maxNodes < 1) {
    throw new ModelError("maxNodes must be a positive integer");
  }
  if (options.firstDecisionId !== undefined) getDecision(scenario, options.firstDecisionId);
  const nodes: Exploration["nodes"] = [
    { id: "n0", depth: 0, state: copyState(scenario.initialState), path: [] }
  ];
  const edges: Exploration["edges"] = [];
  for (let cursor = 0; cursor < nodes.length; cursor++) {
    const parent = nodes[cursor]!;
    if (parent.depth >= horizon) continue;
    for (const decision of scenario.decisions) {
      if (parent.depth === 0 && options.firstDecisionId &&
          decision.id !== options.firstDecisionId) continue;
      const outcomes = decision.outcomes?.map((outcome) => outcome.id) ?? [undefined];
      for (const outcomeId of outcomes) {
        let next;
        try {
          next = applyDecision(scenario, parent.state, decision.id,
            outcomeId === undefined ? {} : { outcomeId });
        } catch (error) {
          // Unavailable actions and invariant-breaking outcomes are unreachable.
          if (error instanceof ModelError) continue;
          throw error;
        }
        if (nodes.length >= maxNodes) return { nodes, edges, truncated: true };
        const id = "n" + nodes.length;
        const choice = {
          decisionId: decision.id,
          ...(next.outcomeId ? { outcomeId: next.outcomeId } : {})
        };
        nodes.push({
          id,
          depth: parent.depth + 1,
          state: next.state,
          path: [...parent.path, choice]
        });
        edges.push({ from: parent.id, to: id, ...choice });
      }
    }
  }
  return { nodes, edges, truncated: false };
}

function uniqueStates(graph: Exploration): Map<string, WorldState> {
  const seen = new Map<string, WorldState>();
  for (const node of graph.nodes) {
    if (node.depth > 0) seen.set(canonicalState(node.state), copyState(node.state));
  }
  return seen;
}

/** Compare all reachable states through horizon after two different first decisions. */
export function compareFirstDecisions(
  scenario: Scenario, firstDecisionA: string, firstDecisionB: string,
  horizon: number, maxNodes = 10000
): CounterfactualComparison {
  if (!Number.isInteger(horizon) || horizon < 1) {
    throw new ModelError("Comparison horizon must be a positive integer");
  }
  if (firstDecisionA === firstDecisionB) throw new ModelError("Compare two distinct decisions");
  const a = explore(scenario, horizon, { firstDecisionId: firstDecisionA, maxNodes });
  const b = explore(scenario, horizon, { firstDecisionId: firstDecisionB, maxNodes });
  if (a.truncated || b.truncated) {
    throw new ModelError("Counterfactual comparison requires complete exploration; increase maxNodes or decrease horizon");
  }
  const as = uniqueStates(a);
  const bs = uniqueStates(b);
  const ordered = (map: Map<string, WorldState>): WorldState[] =>
    [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, state]) => state);
  return {
    firstDecisionA, firstDecisionB, horizon,
    reachableA: ordered(as),
    reachableB: ordered(bs),
    onlyA: ordered(new Map([...as].filter(([key]) => !bs.has(key)))),
    onlyB: ordered(new Map([...bs].filter(([key]) => !as.has(key)))),
    shared: ordered(new Map([...as].filter(([key]) => bs.has(key))))
  };
}
