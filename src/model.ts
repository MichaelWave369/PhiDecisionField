import type { Condition, Decision, Effect, Scenario, Scalar, WorldState } from "./types.js";

export class ModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelError";
  }
}

export function copyState(state: WorldState): WorldState {
  return { values: { ...state.values }, unlocked: [...state.unlocked] };
}

export function canonicalState(state: WorldState): string {
  const keys = Object.keys(state.values).sort();
  return JSON.stringify({
    values: Object.fromEntries(keys.map((key) => [key, state.values[key]])),
    unlocked: [...new Set(state.unlocked)].sort()
  });
}

function isScalar(value: unknown): value is Scalar {
  return value === null || typeof value === "string" || typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ModelError(message);
}

function validateCondition(condition: Condition, state: WorldState, context: string): void {
  assert(condition && typeof condition.key === "string" && Object.hasOwn(state.values, condition.key),
    context + ": unknown state key");
  assert(["==", "!=", ">", ">=", "<", "<="].includes(condition.operator),
    context + ": invalid comparator");
  assert(isScalar(condition.value), context + ": invalid comparison value");
  if (!["==", "!="].includes(condition.operator)) {
    assert(typeof state.values[condition.key] === "number" && typeof condition.value === "number",
      context + ": ordered comparisons require numbers");
  }
  assert(typeof state.values[condition.key] === typeof condition.value,
    context + ": comparison type mismatch");
}

function validateEffect(effect: Effect, state: WorldState, context: string): void {
  assert(effect && typeof effect === "object", context + ": effect must be an object");
  if (effect.kind === "unlock") {
    assert(typeof effect.id === "string" && effect.id.length > 0, context + ": invalid unlock id");
    return;
  }
  assert((effect.kind === "set" || effect.kind === "add") &&
    typeof effect.key === "string" && Object.hasOwn(state.values, effect.key),
    context + ": unknown key or effect kind");
  if (effect.kind === "set") {
    assert(isScalar(effect.value) && typeof state.values[effect.key] === typeof effect.value,
      context + ": set type mismatch");
  } else {
    assert(typeof state.values[effect.key] === "number" &&
      typeof effect.value === "number" && Number.isFinite(effect.value),
      context + ": add requires finite numbers");
  }
}

export function checkCondition(state: WorldState, condition: Condition): boolean {
  const actual = state.values[condition.key];
  switch (condition.operator) {
    case "==": return actual === condition.value;
    case "!=": return actual !== condition.value;
    case ">": return (actual as number) > (condition.value as number);
    case ">=": return (actual as number) >= (condition.value as number);
    case "<": return (actual as number) < (condition.value as number);
    case "<=": return (actual as number) <= (condition.value as number);
  }
}

export function checkAll(state: WorldState, conditions: readonly Condition[] = []): boolean {
  return conditions.every((condition) => checkCondition(state, condition));
}

export function validateScenario(scenario: Scenario): void {
  assert(scenario && scenario.schemaVersion === "phidecisionfield/v1",
    "Unsupported scenario schemaVersion");
  assert(typeof scenario.id === "string" && scenario.id.length > 0, "Scenario id is required");
  const state = scenario.initialState;
  assert(state && state.values && typeof state.values === "object" &&
    !Array.isArray(state.values), "initialState.values must be an object");
  for (const [key, value] of Object.entries(state.values)) {
    assert(key.length > 0 && isScalar(value), "Invalid initial value: " + key);
  }
  assert(Array.isArray(state.unlocked) &&
    state.unlocked.every((id) => typeof id === "string" && id.length > 0),
    "initialState.unlocked must be a string array");
  assert(new Set(state.unlocked).size === state.unlocked.length, "Duplicate initial unlock ids");
  assert(Array.isArray(scenario.decisions) && scenario.decisions.length > 0,
    "At least one decision is required");
  const ids = new Set<string>();
  for (const decision of scenario.decisions) {
    assert(decision && typeof decision.id === "string" &&
      decision.id.length > 0 && !ids.has(decision.id),
      "Decision ids must be unique and nonempty");
    ids.add(decision.id);
    assert(typeof decision.label === "string" && decision.label.length > 0,
      "Decision " + decision.id + " needs a label");
    assert(Array.isArray(decision.effects), "Decision " + decision.id + " needs an effects array");
    for (const effect of decision.effects) validateEffect(effect, state, decision.id);
    assert(decision.requirements === undefined || Array.isArray(decision.requirements),
      "Decision " + decision.id + ": invalid requirements");
    for (const condition of decision.requirements ?? []) validateCondition(condition, state, decision.id);
    if (decision.outcomes !== undefined) {
      assert(Array.isArray(decision.outcomes) && decision.outcomes.length > 0,
        "Decision " + decision.id + ": outcomes must be nonempty");
      const outcomes = new Set<string>();
      for (const outcome of decision.outcomes) {
        assert(outcome && typeof outcome.id === "string" &&
          outcome.id.length > 0 && !outcomes.has(outcome.id),
          "Decision " + decision.id + ": duplicate/invalid outcome id");
        outcomes.add(outcome.id);
        assert(typeof outcome.weight === "number" &&
          outcome.weight > 0 && Number.isFinite(outcome.weight),
          "Decision " + decision.id + ": weights must be positive and finite");
        assert(Array.isArray(outcome.effects), "Decision " + decision.id + ": outcome effects required");
        for (const effect of outcome.effects) validateEffect(effect, state, decision.id + "/" + outcome.id);
      }
      assert(Number.isFinite(decision.outcomes.reduce((sum, outcome) => sum + outcome.weight, 0)),
        "Decision " + decision.id + ": total weight overflow");
    }
  }
  assert(scenario.invariants === undefined || Array.isArray(scenario.invariants),
    "Invalid invariants");
  for (const invariant of scenario.invariants ?? []) validateCondition(invariant, state, "Invariant");
  assert(checkAll(state, scenario.invariants), "Initial state violates invariants");
}

export function getDecision(scenario: Scenario, id: string): Decision {
  const decision = scenario.decisions.find((item) => item.id === id);
  if (!decision) throw new ModelError("Unknown decision: " + id);
  return decision;
}

export function applyEffects(state: WorldState, effects: readonly Effect[]): WorldState {
  const next = copyState(state);
  for (const effect of effects) {
    if (effect.kind === "unlock") {
      if (!next.unlocked.includes(effect.id)) next.unlocked.push(effect.id);
    } else if (effect.kind === "set") {
      next.values[effect.key] = effect.value;
    } else {
      const current = next.values[effect.key];
      if (typeof current !== "number") throw new ModelError("Non-numeric add target: " + effect.key);
      const updated = current + effect.value;
      if (!Number.isFinite(updated)) throw new ModelError("Non-finite arithmetic result: " + effect.key);
      next.values[effect.key] = updated;
    }
  }
  return next;
}
