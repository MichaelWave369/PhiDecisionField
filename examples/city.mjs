import {
  cityScenario, compareFirstDecisions, explore, simulate
} from "../dist/index.js";

const choices = [
  { decisionId: "explore-ruins" },
  { decisionId: "market" }
];
const replay = simulate(cityScenario, choices, 369);
const graph = explore(cityScenario, 2);
const comparison = compareFirstDecisions(
  cityScenario, "restore-power", "market", 2
);
console.log(JSON.stringify({
  scenario: cityScenario.id,
  replay: {
    seed: replay.seed,
    steps: replay.steps.map(({ decisionId, outcomeId }) =>
      ({ decisionId, outcomeId })),
    finalState: replay.finalState
  },
  exploration: {
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    truncated: graph.truncated
  },
  counterfactual: {
    onlyA: comparison.onlyA.length,
    onlyB: comparison.onlyB.length,
    shared: comparison.shared.length
  }
}, null, 2));
