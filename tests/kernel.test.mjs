import test from "node:test";
import assert from "node:assert/strict";
import {
  applyDecision, canonicalState, cityScenario, compareFirstDecisions, explore,
  seededRandom, simulate, validateScenario, ModelError
} from "../dist/index.js";

const clone = (value) => structuredClone(value);

test("sample city validates and state keys canonicalize independently of order", () => {
  validateScenario(cityScenario);
  assert.equal(
    canonicalState({ values: { x: 1, y: true }, unlocked: ["b", "a"] }),
    canonicalState({ values: { y: true, x: 1 }, unlocked: ["a", "b"] })
  );
});

test("a transition creates a fresh state, preserves its input, and applies unlocks", () => {
  const state = clone(cityScenario.initialState);
  const result = applyDecision(cityScenario, state, "restore-power");
  assert.deepEqual(state, cityScenario.initialState);
  assert.equal(result.state.values.energy, 7);
  assert.equal(result.state.values.materials, 4);
  assert.deepEqual(result.state.unlocked, ["hospital"]);
});

test("requirements and invariants block unreachable transitions", () => {
  const once = applyDecision(cityScenario, cityScenario.initialState, "restore-power").state;
  assert.throws(() => applyDecision(cityScenario, once, "restore-power"), /Requirements not met/);
  const outOfBounds = clone(cityScenario);
  outOfBounds.decisions[0].requirements = [];
  assert.throws(() => applyDecision(outOfBounds, once, "restore-power"), /violates scenario invariants/);
});

test("stochastic choices must be explicit or seeded; weights select branches", () => {
  assert.throws(() => applyDecision(cityScenario, cityScenario.initialState, "explore-ruins"), /require/);
  assert.equal(
    applyDecision(cityScenario, cityScenario.initialState, "explore-ruins", { roll: 0.01 }).outcomeId,
    "find-supplies"
  );
  assert.equal(
    applyDecision(cityScenario, cityScenario.initialState, "explore-ruins", { roll: 0.99 }).outcomeId,
    "empty-rooms"
  );
  assert.throws(() => applyDecision(cityScenario, cityScenario.initialState, "explore-ruins", { roll: 1 }), /require/);
});

test("seeded replay is identical for repeated seeds, and never uses global RNG", () => {
  const choices = [{ decisionId: "explore-ruins" }, { decisionId: "market" }];
  const first = simulate(cityScenario, choices, 129);
  const second = simulate(cityScenario, choices, 129);
  assert.deepEqual(first, second);
  assert.equal(first.steps.length, 2);
  assert.equal(seededRandom(17)(), seededRandom(17)());
});

test("explicit recorded outcome can reproduce the same branch with a different seed", () => {
  const r = simulate(cityScenario, [{ decisionId: "explore-ruins" }], 22);
  const replay = simulate(
    cityScenario,
    r.steps.map(({ decisionId, outcomeId }) => ({ decisionId, outcomeId })),
    999
  );
  assert.deepEqual(r.finalState, replay.finalState);
});

test("finite-horizon exploration enumerates stochastic outcomes and stable paths", () => {
  const graph = explore(cityScenario, 1);
  assert.equal(graph.truncated, false);
  assert.equal(graph.nodes.length, 5);
  assert.equal(graph.edges.length, 4);
  assert.deepEqual(
    graph.nodes[2].path,
    [{ decisionId: "explore-ruins", outcomeId: "find-supplies" }]
  );
  assert.deepEqual(graph, explore(cityScenario, 1));
});

test("counterfactual comparison reports distinct reachable futures", () => {
  const comparison = compareFirstDecisions(cityScenario, "restore-power", "market", 1);
  assert.equal(comparison.reachableA.length, 1);
  assert.equal(comparison.reachableB.length, 1);
  assert.equal(comparison.onlyA.length, 1);
  assert.equal(comparison.onlyB.length, 1);
  assert.equal(comparison.shared.length, 0);
});

test("counterfactual comparison refuses incomplete exploration", () => {
  assert.throws(
    () => compareFirstDecisions(cityScenario, "restore-power", "explore-ruins", 2, 2),
    /complete exploration/
  );
});

test("search resource cap is explicit, never silently treated as exhaustive", () => {
  const graph = explore(cityScenario, 4, { maxNodes: 3 });
  assert.equal(graph.truncated, true);
  assert.equal(graph.nodes.length, 3);
});

test("runtime scenario validation catches malformed models", () => {
  const duplicate = clone(cityScenario);
  duplicate.decisions[1].id = "restore-power";
  assert.throws(() => validateScenario(duplicate), ModelError);
  const badWeight = clone(cityScenario);
  badWeight.decisions[1].outcomes[0].weight = -1;
  assert.throws(() => validateScenario(badWeight), /weights/);
  assert.throws(() => simulate(cityScenario, [], -1), /Seed/);
});
