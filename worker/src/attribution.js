// Sanitises the browser-supplied `acq` object ({ft, lt}) into signups columns.
// Untrusted input: only known keys survive, values must be strings within a length cap,
// anything malformed becomes null (attribution must never be able to fail a signup).

export const ACQ_COLUMNS = [
	"acq_source",
	"acq_medium",
	"acq_campaign",
	"acq_content",
	"acq_term",
	"acq_referrer_host",
	"acq_landing_path",
	"acq_click_id_type",
	"acq_captured_at",
	"acq_lt_source",
	"acq_lt_medium",
	"acq_lt_campaign",
	"acq_lt_content",
];

const CLICK_ID_TYPES = new Set(["fbclid", "gclid", "ttclid"]);
const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/;

function isRecord(v) {
	return typeof v === "object" && v !== null && !Array.isArray(v);
}

function text(v, max) {
	if (typeof v !== "string") return null;
	const t = v.trim().toLowerCase().slice(0, max).trim();
	return t === "" ? null : t;
}

function host(v) {
	const t = text(v, 100);
	const bare = t ? t.replace(/^www\./, "") : null;
	return bare && HOST_RE.test(bare) ? bare : null; // a bare hostname, never a URL
}

function path(v) {
	if (typeof v !== "string") return null;
	const t = v.trim().split(/[?#]/)[0].slice(0, 200);
	return t.startsWith("/") ? t : null; // path only, no query string
}

function timestamp(v) {
	if (typeof v !== "string") return null;
	const ms = Date.parse(v);
	return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export function sanitizeAcq(input) {
	const out = Object.fromEntries(ACQ_COLUMNS.map((k) => [k, null]));
	if (!isRecord(input)) return out;
	const { ft, lt } = input;
	if (isRecord(ft)) {
		out.acq_source = text(ft.utm_source, 100);
		out.acq_medium = text(ft.utm_medium, 100);
		out.acq_campaign = text(ft.utm_campaign, 100);
		out.acq_content = text(ft.utm_content, 100);
		out.acq_term = text(ft.utm_term, 100);
		out.acq_referrer_host = host(ft.referrer_host);
		out.acq_landing_path = path(ft.landing_path);
		const click = text(ft.click_id_type, 10);
		out.acq_click_id_type = click && CLICK_ID_TYPES.has(click) ? click : null;
		out.acq_captured_at = timestamp(ft.ts);
	}
	if (isRecord(lt)) {
		out.acq_lt_source = text(lt.utm_source, 100);
		out.acq_lt_medium = text(lt.utm_medium, 100);
		out.acq_lt_campaign = text(lt.utm_campaign, 100);
		out.acq_lt_content = text(lt.utm_content, 100);
	}
	return out;
}
