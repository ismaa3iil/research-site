import assert from "node:assert/strict";
import test from "node:test";

import { validatePayload } from "./src/worker.mjs";

const valid = {
  action: "upsert",
  studyVersion: "three-way-v1",
  atlasVersion: "three-way-2026-09-27",
  visitorId: "7b0b104e-f3a5-4eaa-904a-50b98a6719b0",
  consent: true,
  comparisonRank: 7,
  ranking: ["interestingness", "compressibility", "modifiedCompression"],
  diagramIds: {
    interestingness: "X1_M1",
    compressibility: "X2_M3",
    modifiedCompression: "X3_M1"
  },
  presentation: { positions: { left: "interestingness" } },
  clientTimestamp: "2026-09-27T12:00:00.000Z"
};

test("accepts a complete consented ordering", () => {
  assert.equal(validatePayload(structuredClone(valid)).action, valid.action);
});

test("rejects a ranking with duplicate methods", () => {
  const payload = structuredClone(valid);
  payload.ranking[2] = "interestingness";
  assert.throws(() => validatePayload(payload), /every method exactly once/);
});

test("rejects an unconsented contribution", () => {
  const payload = structuredClone(valid);
  payload.consent = false;
  assert.throws(() => validatePayload(payload), /Consent/);
});

test("accepts minimal retraction payloads", () => {
  const payload = {
    action: "retract",
    studyVersion: valid.studyVersion,
    atlasVersion: valid.atlasVersion,
    visitorId: valid.visitorId,
    comparisonRank: 7
  };
  assert.equal(validatePayload(payload).action, "retract");
});
