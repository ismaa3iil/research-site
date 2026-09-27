const METHODS = ["interestingness", "compressibility", "modifiedCompression"];
const DEFAULT_ORIGINS = [
  "https://ismaa3iil.fyi",
  "http://127.0.0.1:8765",
  "http://localhost:8765"
];

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(","))
    .split(",")
    .map(value => value.trim())
    .filter(Boolean);
}

function corsHeaders(origin, env) {
  const allowed = allowedOrigins(env);
  const selected = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": selected,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin"
  };
}

function jsonResponse(body, status, origin, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin, env)
  });
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validatePayload(payload) {
  if (!isPlainObject(payload)) throw new Error("Payload must be an object");
  if (!["upsert", "retract", "retractAll"].includes(payload.action)) throw new Error("Invalid action");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/i.test(payload.studyVersion || "")) throw new Error("Invalid study version");
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/i.test(payload.atlasVersion || "")) throw new Error("Invalid atlas version");
  if (!/^[a-z0-9-]{20,80}$/i.test(payload.visitorId || "")) throw new Error("Invalid visitor ID");

  if (payload.action === "retractAll") return payload;
  if (!Number.isInteger(payload.comparisonRank) || payload.comparisonRank < 1 || payload.comparisonRank > 120) {
    throw new Error("Invalid comparison rank");
  }
  if (payload.action === "retract") return payload;
  if (payload.consent !== true) throw new Error("Consent is required");
  if (!Array.isArray(payload.ranking) || payload.ranking.length !== METHODS.length) throw new Error("Invalid ranking");
  if (new Set(payload.ranking).size !== METHODS.length || !METHODS.every(method => payload.ranking.includes(method))) {
    throw new Error("Ranking must contain every method exactly once");
  }
  if (!isPlainObject(payload.diagramIds) || !METHODS.every(method => /^X\d+_M[13]$/.test(payload.diagramIds[method] || ""))) {
    throw new Error("Invalid diagram identifiers");
  }
  if (!isPlainObject(payload.presentation)) throw new Error("Missing presentation metadata");
  if (typeof payload.clientTimestamp !== "string" || Number.isNaN(Date.parse(payload.clientTimestamp))) {
    throw new Error("Invalid client timestamp");
  }
  return payload;
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function handleSubmission(payload, env) {
  const visitorHash = await sha256(`${env.VISITOR_SALT}:${payload.visitorId}`);
  if (payload.action === "retractAll") {
    await env.DB.prepare(
      "DELETE FROM preferences WHERE study_version = ? AND atlas_version = ? AND visitor_hash = ?"
    ).bind(payload.studyVersion, payload.atlasVersion, visitorHash).run();
    return { status: "retracted-all" };
  }
  if (payload.action === "retract") {
    await env.DB.prepare(
      "DELETE FROM preferences WHERE study_version = ? AND atlas_version = ? AND visitor_hash = ? AND comparison_rank = ?"
    ).bind(payload.studyVersion, payload.atlasVersion, visitorHash, payload.comparisonRank).run();
    return { status: "retracted" };
  }

  await env.DB.prepare(`
    INSERT INTO preferences (
      study_version, atlas_version, visitor_hash, comparison_rank,
      first_choice, second_choice, third_choice,
      diagram_ids_json, presentation_json, client_timestamp, received_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(study_version, atlas_version, visitor_hash, comparison_rank)
    DO UPDATE SET
      first_choice = excluded.first_choice,
      second_choice = excluded.second_choice,
      third_choice = excluded.third_choice,
      diagram_ids_json = excluded.diagram_ids_json,
      presentation_json = excluded.presentation_json,
      client_timestamp = excluded.client_timestamp,
      received_at = datetime('now')
  `).bind(
    payload.studyVersion,
    payload.atlasVersion,
    visitorHash,
    payload.comparisonRank,
    payload.ranking[0],
    payload.ranking[1],
    payload.ranking[2],
    JSON.stringify(payload.diagramIds),
    JSON.stringify(payload.presentation),
    payload.clientTimestamp
  ).run();
  return { status: "accepted" };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (!allowedOrigins(env).includes(origin)) return jsonResponse({ error: "Origin not allowed" }, 403, origin, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, origin, env);
    if (!env.DB || !env.VISITOR_SALT) return jsonResponse({ error: "Collector is not configured" }, 503, origin, env);

    try {
      const text = await request.text();
      if (text.length > 8192) return jsonResponse({ error: "Payload too large" }, 413, origin, env);
      const payload = validatePayload(JSON.parse(text));
      const result = await handleSubmission(payload, env);
      return jsonResponse(result, 200, origin, env);
    } catch (error) {
      return jsonResponse({ error: error.message || "Invalid request" }, 400, origin, env);
    }
  }
};
