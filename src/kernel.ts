import { applyEffects, checkAll, copyState, getDecision, ModelError, validateScenario } from "./model.js";
import type { Scenario, TransitionResult, WorldState, WeightedOutcome } from "./types.js";

export interface TransitionSelection {
  /** Select the named branch during replay or search. */
  outcomeId?: string;
  /** Sample in [0,1). No implicit global randomness is allowed. */
  roll?: number;
}

function chooseOutcome(outcomes: WeightedOutcome[], selection: TransitionSelection): WeightedOutcome {
  if (selection.outcomeId !== undefined) {
    const outcome = outcomes.find((item) => item.id === selection.outcomeId);
    if (!outcome) throw new ModelError("Unknown outcome: " + selection.outcomeId);
    return outcome;
  }
  const roll = selection.roll;
  if (roll === undefined || !Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new ModelError("Stochastic decisions require a valid [0,1) roll or explicit outcomeId");
  }
  const total = outcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
  const target = roll * total;
  let cumulative = 0;
  for (const outcome of outcomes) {
    cumulative += outcome.weight;
    if (target < cumulative) return outcome;
  }
  return outcomes[outcomes.length - 1]!;
}

export function applyDecision(
  scenario: Scenario, state: WorldState, decisionId: string, selection: TransitionSelection = {}
): TransitionResult {
  validateScenario(scenario);
  const decision = getDecision(scenario, decisionId);
  if (!checkAll(state, scenario.invariants)) throw new ModelError("Current state violates scenario invariants");
  if (!checkAll(state, decision.requirements)) throw new ModelError("Requirements not met: " + decisionId);
  if (!decision.outcomes && (selection.outcomeId !== undefined || selection.roll !== undefined)) {
    throw new ModelError("Decision " + decisionId + " has no stochastic outcomes");
  }
  const outcome = decision.outcomes ? chooseOutcome(decision.outcomes, selection) : undefined;
  const next = applyEffects(state, [...decision.effects, ...(outcome?.effects ?? [])]);
  if (!checkAll(next, scenario.invariants)) {
    throw new ModelError("Transition violates scenario invariants: " + decisionId);
  }
  return { decisionId, ...(outcome ? { outcomeId: outcome.id } : {}), state: copyState(next) };
}
