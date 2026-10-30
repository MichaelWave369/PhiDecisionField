import { applyDecision } from "./kernel.js";
import { copyState, ModelError, validateScenario } from "./model.js";
import type { Choice, ReplayResult, Scenario } from "./types.js";

/** A deterministic PRNG. Seed belongs to the replay record; not cryptographic. */
export function seededRandom(seed: number): () => number {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new ModelError("Seed must be a uint32 integer");
  }
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Replay explicitly selected branches or sample them with a reproducible seed. */
export function simulate(scenario: Scenario, choices: readonly Choice[], seed = 0): ReplayResult {
  validateScenario(scenario);
  const random = seededRandom(seed);
  let state = copyState(scenario.initialState);
  const steps: ReplayResult["steps"] = [];
  choices.forEach((choice, index) => {
    const decision = scenario.decisions.find((candidate) => candidate.id === choice.decisionId);
    if (!decision) throw new ModelError("Unknown decision: " + choice.decisionId);
    const selection = decision.outcomes
      ? (choice.outcomeId === undefined ? { roll: random() } : { outcomeId: choice.outcomeId })
      : {};
    if (!decision.outcomes && choice.outcomeId !== undefined) {
      throw new ModelError("Unexpected outcome for " + choice.decisionId);
    }
    const result = applyDecision(scenario, state, choice.decisionId, selection);
    state = result.state;
    steps.push({ ...result, index });
  });
  return { seed, initialState: copyState(scenario.initialState), steps, finalState: copyState(state) };
}
