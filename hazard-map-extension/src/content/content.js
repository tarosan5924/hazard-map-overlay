// normalize.js より inline
function normalizeAddress(raw) {
	return raw
		.replace(/付近|以下未定|\[.*?\]|（.*?）|\(.*?\)/g, "")
		.replace(/[\s　]+/g, " ")
		.trim();
}

// selectors.js より inline
const DEFAULT_SELECTORS = [
	{
		domain: "suumo.jp",
		urlPattern: "/ichiran/",
		cardSelector: ".property_unit",
		addressSelector: "所在地",
		insertSelector: ".property_unit-body",
	},
	{
		domain: "suumo.jp",
		urlPattern: null,
		cardSelector: null,
		addressSelector: ".fl.w296.bw",
		insertSelector: ".mt9",
	},
	{
		domain: "www.homes.co.jp",
		urlPattern: null,
		cardSelector: null,
		addressSelector: ".mod-bukkenSpec .spec-table td",
		insertSelector: ".bukkenDetail",
	},
];

// url-matcher.js より inline
function matchConfig(config, href, hostname) {
	if (!hostname.includes(config.domain)) return false;
	if (!config.urlPattern) return true;
	return new RegExp(config.urlPattern).test(href);
}

function findConfig(selectors, href, hostname) {
	return selectors.find((c) => matchConfig(c, href, hostname)) ?? null;
}

async function getSiteConfig() {
	const data = await chrome.storage.sync.get("selectors");
	const selectors = data.selectors ?? DEFAULT_SELECTORS;
	return findConfig(selectors, location.href, location.hostname);
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

function insertMap(target, lat, lng, isList = false) {
	const iframe = document.createElement("iframe");
	iframe.className = isList
		? "hazard-map-iframe hazard-map-iframe--list"
		: "hazard-map-iframe";
	iframe.src = buildMapUrl(lat, lng);
	iframe.loading = "lazy";
	iframe.title = "ハザードマップ";
	target.insertAdjacentElement("afterend", iframe);
}

function extractAddressByLabel(card, label) {
	const dt = [...card.querySelectorAll("dt")].find(
		(el) => el.textContent.trim() === label,
	);
	if (!dt) return null;
	return normalizeAddress(dt.nextElementSibling?.textContent ?? "");
}

function extractAddress(root, addressSelector) {
	// CSS セレクタ記号を含まない場合は dt ラベルマッチ（一覧モード）
	if (!/[.#[\s>~+]/.test(addressSelector)) {
		return extractAddressByLabel(root, addressSelector);
	}
	// CSS セレクタ（詳細モード）: 「／」含むリーフノード優先
	const leaf = [...root.querySelectorAll(`${addressSelector} *`)].find(
		(e) => e.children.length === 0 && e.textContent.includes("／"),
	);
	if (leaf) return normalizeAddress(leaf.textContent.split("／")[0]);
	const el = root.querySelector(addressSelector);
	return el ? normalizeAddress(el.textContent) : null;
}

async function geocodeAndInsert(address, insertTarget, isList) {
	const result = await chrome.runtime.sendMessage({ type: "GEOCODE", address });
	if (result.error === "NOT_FOUND") {
		insertError(insertTarget, "住所から座標を取得できませんでした");
	} else if (result.error === "NETWORK") {
		insertError(insertTarget, "ネットワークエラーが発生しました");
	} else {
		insertMap(insertTarget, result.lat, result.lng, isList);
	}
}

async function runDetailMode(config) {
	await waitForElement(config.addressSelector);
	const address = extractAddress(document, config.addressSelector);
	if (!address) return;
	const insertTarget = document.querySelector(config.insertSelector);
	if (!insertTarget) return;
	await geocodeAndInsert(address, insertTarget, false);
}

async function runListMode(config) {
	await waitForElement(config.cardSelector);
	const cards = document.querySelectorAll(config.cardSelector);
	for (const card of cards) {
		const address = extractAddress(card, config.addressSelector);
		const insertTarget = card.querySelector(config.insertSelector);
		if (!address || !insertTarget) continue;
		geocodeAndInsert(address, insertTarget, true); // fire-and-forget（SW側でconcurrency制御）
	}
}

async function main() {
	const config = await getSiteConfig();
	if (!config) return;
	if (config.cardSelector) {
		await runListMode(config);
	} else {
		await runDetailMode(config);
	}
}

main().catch(console.error);
