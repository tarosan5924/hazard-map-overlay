const FALLBACK_SELECTORS = [
	{
		domain: "suumo.jp",
		addressSelector: ".fl.w296.bw",
		insertSelector: ".mt9",
	},
];

function normalizeAddress(raw) {
	return raw
		.replace(/付近|以下未定|\[.*?\]|（.*?）|\(.*?\)/g, "")
		.replace(/[\s　]+/g, " ")
		.trim();
}

function extractAddress(addressSelector) {
	// リーフノードで「／」含む要素 → SUUMOの住所フォーマット対応
	const leaf = [...document.querySelectorAll(`${addressSelector} *`)].find(
		(e) => e.children.length === 0 && e.textContent.includes("／"),
	);
	if (leaf) return normalizeAddress(leaf.textContent.split("／")[0]);

	const el = document.querySelector(addressSelector);
	return el ? normalizeAddress(el.textContent) : null;
}

function waitForElement(selector, timeout = 8000) {
	return new Promise((resolve) => {
		if (document.querySelector(selector)) {
			resolve(document.querySelector(selector));
			return;
		}
		const observer = new MutationObserver(() => {
			const el = document.querySelector(selector);
			if (el) {
				observer.disconnect();
				resolve(el);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
		setTimeout(() => {
			observer.disconnect();
			resolve(null);
		}, timeout);
	});
}

function buildMapUrl(lat, lng) {
	const base = chrome.runtime.getURL("src/map/map.html");
	return `${base}?lat=${lat}&lng=${lng}`;
}

function insertError(target, message) {
	const div = document.createElement("div");
	div.className = "hazard-ext-error";
	div.textContent = `ハザードマップ: ${message}`;
	target.insertAdjacentElement("afterend", div);
}

function insertMap(target, lat, lng) {
	const iframe = document.createElement("iframe");
	iframe.className = "hazard-map-iframe";
	iframe.src = buildMapUrl(lat, lng);
	iframe.loading = "lazy";
	iframe.title = "ハザードマップ";
	target.insertAdjacentElement("afterend", iframe);
}

async function getSiteConfig() {
	const hostname = location.hostname;
	const data = await chrome.storage.sync.get("selectors");
	const selectors = data.selectors ?? FALLBACK_SELECTORS;
	return selectors.find((s) => hostname.includes(s.domain)) ?? null;
}

async function main() {
	const config = await getSiteConfig();
	if (!config) return;

	await waitForElement(config.addressSelector);

	const address = extractAddress(config.addressSelector);
	if (!address) return;

	const insertTarget = document.querySelector(config.insertSelector);
	if (!insertTarget) return;

	const result = await chrome.runtime.sendMessage({ type: "GEOCODE", address });

	if (result.error === "NOT_FOUND") {
		insertError(insertTarget, "住所から座標を取得できませんでした");
	} else if (result.error === "NETWORK") {
		insertError(insertTarget, "ネットワークエラーが発生しました");
	} else {
		insertMap(insertTarget, result.lat, result.lng);
	}
}

main().catch(console.error);
