import type { Scenario } from "./types.js";

/** Fictional toy world. Values are illustrative, not calibrated predictions. */
export const cityScenario: Scenario = {
  schemaVersion: "phidecisionfield/v1",
  id: "three-path-city",
  initialState: {
    values: { energy: 2, materials: 10, trust: 3 },
    unlocked: []
  },
  invariants: [
    { key: "energy", operator: ">=", value: 0 },
    { key: "materials", operator: ">=", value: 0 },
    { key: "trust", operator: ">=", value: 0 }
  ],
  decisions: [
    {
      id: "restore-power", label: "Restore the power grid",
      requirements: [{ key: "materials", operator: ">=", value: 6 }],
      effects: [
        { kind: "add", key: "materials", value: -6 },
        { kind: "add", key: "energy", value: 5 },
        { kind: "unlock", id: "hospital" }
      ]
    },
    {
      id: "explore-ruins", label: "Explore the ruins",
      requirements: [{ key: "materials", operator: ">=", value: 2 }],
      effects: [{ kind: "add", key: "materials", value: -2 }],
      outcomes: [
        {
          id: "find-supplies", weight: 3,
          effects: [
            { kind: "add", key: "materials", value: 5 },
            { kind: "unlock", id: "ruins-map" }
          ]
        },
        {
          id: "empty-rooms", weight: 1,
          effects: [{ kind: "unlock", id: "ruins-map" }]
        }
      ]
    },
    {
      id: "market", label: "Build a marketplace",
      requirements: [{ key: "materials", operator: ">=", value: 5 }],
      effects: [
        { kind: "add", key: "materials", value: -5 },
        { kind: "add", key: "trust", value: 2 },
        { kind: "unlock", id: "trading" }
      ]
    }
  ]
};
