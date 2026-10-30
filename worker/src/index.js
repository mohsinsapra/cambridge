import { ACQ_COLUMNS, sanitizeAcq } from "./attribution.js";

const ALLOWED_ORIGINS = new Set([
	"https://mohsin.se",
	"http://mohsin.se",
	"https://mohsinsapra.github.io",
	"http://localhost:8000",
]);

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
// Hostnames the widget is allowed to be solved on; a token minted elsewhere
// is rejected even if Cloudflare says it is otherwise valid.
const ALLOWED_TURNSTILE_HOSTNAMES = new Set(["mohsin.se", "localhost", "127.0.0.1"]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_CHANNELS = new Set(["beta", "production", "both"]);
const VALID_PLATFORMS = new Set(["iphone", "mac", "both"]);

function corsHeaders(origin) {
	if (!origin || !ALLOWED_ORIGINS.has(origin)) {
		return {};
	}
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
	};
}

function jsonResponse(body, status, origin) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json",
			...corsHeaders(origin),
		},
	});
}

function validatePayload(data) {
	if (typeof data.email !== "string" || data.email.length === 0 || data.email.length > 254 || !EMAIL_RE.test(data.email)) {
		return "Invalid email address.";
	}
	if (typeof data.channel !== "string" || !VALID_CHANNELS.has(data.channel)) {
		return 'Invalid channel. Must be one of "beta", "production", "both".';
	}
	if (typeof data.platform !== "string" || !VALID_PLATFORMS.has(data.platform)) {
		return 'Invalid platform. Must be one of "iphone", "mac", "both".';
	}
	return null;
}

// Server-side Turnstile check. Tokens are single-use, so this is the only
// place the token is verified -- the browser never calls siteverify itself.
// Returns true only for a fresh token solved on one of our own hostnames.
async function verifyTurnstile(token, request, env) {
	if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
		return false;
	}
	if (!env.TURNSTILE_SECRET_KEY) {
		// Fail closed: a missing secret must not silently disable protection.
		return false;
	}
	const form = new FormData();
	form.append("secret", env.TURNSTILE_SECRET_KEY);
	form.append("response", token);
	const ip = request.headers.get("CF-Connecting-IP");
	if (ip) form.append("remoteip", ip);
	try {
		const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
		const outcome = await res.json();
		return outcome.success === true && ALLOWED_TURNSTILE_HOSTNAMES.has(outcome.hostname);
	} catch {
		return false;
	}
}

async function handlePost(request, env, origin) {
	let data;
	try {
		data = await request.json();
	} catch {
		return jsonResponse({ ok: false, error: "Request body must be valid JSON." }, 400, origin);
	}

	if (data === null || typeof data !== "object") {
		return jsonResponse({ ok: false, error: "Request body must be a JSON object." }, 400, origin);
	}

	// Honeypot: if filled in, silently pretend success without storing anything.
	if (typeof data.website === "string" && data.website.trim().length > 0) {
		return jsonResponse({ ok: true }, 200, origin);
	}

	const validationError = validatePayload(data);
	if (validationError) {
		return jsonResponse({ ok: false, error: validationError }, 400, origin);
	}

	if (!(await verifyTurnstile(data.turnstile_token, request, env))) {
		return jsonResponse({ ok: false, error: "Bot check failed. Please complete the check and try again." }, 403, origin);
	}

	const email = data.email.trim().toLowerCase();

	let useCase = null;
	if (typeof data.use_case === "string" && data.use_case.length > 0) {
		useCase = data.use_case.length > 1000 ? data.use_case.slice(0, 1000) : data.use_case;
	}

	const userAgent = request.headers.get("User-Agent") || null;
	const referer = request.headers.get("Referer") || null;

	// Acquisition attribution is stored on INSERT only; INSERT OR IGNORE means a repeat
	// signup for the same email never overwrites the original first touch.
	const acq = sanitizeAcq(data.acq);

	try {
		await env.DB.prepare(
			`INSERT OR IGNORE INTO signups (email, channel, platform, use_case, user_agent, referer, ${ACQ_COLUMNS.join(", ")}) VALUES (?, ?, ?, ?, ?, ?, ${ACQ_COLUMNS.map(() => "?").join(", ")})`
		)
			.bind(email, data.channel, data.platform, useCase, userAgent, referer, ...ACQ_COLUMNS.map((k) => acq[k]))
			.run();
	} catch {
		return jsonResponse({ ok: false, error: "Something went wrong storing your signup. Please try again." }, 500, origin);
	}

	return jsonResponse({ ok: true }, 200, origin);
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url);
		const origin = request.headers.get("Origin");

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders(origin) });
		}

		if (url.pathname === "/" && request.method === "GET") {
			return new Response("cambridge-signup ok", {
				status: 200,
				headers: { "Content-Type": "text/plain" },
			});
		}

		if (url.pathname === "/" && request.method === "POST") {
			return handlePost(request, env, origin);
		}

		return jsonResponse({ ok: false, error: "Method not allowed." }, 405, origin);
	},
};
