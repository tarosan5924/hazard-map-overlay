// SUUMOのセレクタ
const SUUMO_INSERT_SELECTOR = ".mt9";

function normalizeAddress(raw) {
	return raw
		.replace(/付近|以下未定|\[.*?\]|（.*?）|\(.*?\)/g, "")
		.replace(/[\s　]+/g, " ")
		.trim();
}

function extractSuumoAddress() {
	const el = [...document.querySelectorAll(".fl.w296.bw *")].find(
		(e) => e.children.length === 0 && e.textContent.includes("／"),
	);
	if (!el) return null;
	return normalizeAddress(el.textContent.split("／")[0]);
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

async function main() {
	await waitForElement(".fl.w296.bw");

	const address = extractSuumoAddress();
	if (!address) return;

	const insertTarget = document.querySelector(SUUMO_INSERT_SELECTOR);
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
