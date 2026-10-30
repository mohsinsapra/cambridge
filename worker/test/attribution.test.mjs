import assert from "node:assert/strict";
import { test } from "node:test";
import { ACQ_COLUMNS, sanitizeAcq } from "../src/attribution.js";

const ft = {
	utm_source: "  ChatGPT.com ",
	utm_medium: "Referral",
	utm_campaign: "Guides",
	utm_content: "a",
	utm_term: "b",
	referrer_host: "chatgpt.com",
	landing_path: "/cambridge/guides/control-iphone-camera-from-mac.html",
	click_id_type: "gclid",
	ts: "2030-05-01T09:00:00.000Z",
};

test("maps first and last touch to columns", () => {
	const out = sanitizeAcq({ ft, lt: { utm_source: "TikTok", utm_medium: "organic", utm_campaign: "c", utm_content: "x" } });
	assert.equal(out.acq_source, "chatgpt.com");
	assert.equal(out.acq_medium, "referral");
	assert.equal(out.acq_referrer_host, "chatgpt.com");
	assert.equal(out.acq_landing_path, ft.landing_path);
	assert.equal(out.acq_click_id_type, "gclid");
	assert.equal(out.acq_captured_at, "2030-05-01T09:00:00.000Z");
	assert.equal(out.acq_lt_source, "tiktok");
	assert.equal(out.acq_lt_content, "x");
});

test("absent or non-object input gives all nulls and every column", () => {
	for (const input of [undefined, null, "x", 5, [], {}, { ft: null, lt: null }]) {
		const out = sanitizeAcq(input);
		assert.deepEqual(Object.keys(out), ACQ_COLUMNS);
		assert.ok(Object.values(out).every((v) => v === null));
	}
});

test("caps lengths, drops non-strings and unknown keys", () => {
	const out = sanitizeAcq({ ft: { utm_source: "a".repeat(500), utm_medium: 42, utm_campaign: { x: 1 }, landing_path: `/${"p".repeat(500)}`, ip: "1.2.3.4" } });
	assert.equal(out.acq_source.length, 100);
	assert.equal(out.acq_medium, null);
	assert.equal(out.acq_campaign, null);
	assert.equal(out.acq_landing_path.length, 200);
	assert.ok(!("ip" in out));
});

test("never keeps URLs, query strings, bad click-id types or bad timestamps", () => {
	const out = sanitizeAcq({ ft: { referrer_host: "https://evil.com/x?y=1", landing_path: "/p?fbclid=SECRET#h", click_id_type: "fbclid=abc", ts: "nope" } });
	assert.equal(out.acq_referrer_host, null);
	assert.equal(out.acq_landing_path, "/p");
	assert.equal(out.acq_click_id_type, null);
	assert.equal(out.acq_captured_at, null);
	assert.equal(sanitizeAcq({ ft: { landing_path: "https://x.com/a" } }).acq_landing_path, null);
	assert.equal(sanitizeAcq({ ft: { referrer_host: "WWW.Chatgpt.com" } }).acq_referrer_host, "chatgpt.com");
});
