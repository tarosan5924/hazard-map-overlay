import { DEFAULT_SELECTORS } from "../shared/selectors.js";

const CACHE_KEY = "geocode_cache";
const CACHE_MAX = 100;

async function getCache() {
	const result = await chrome.storage.session.get(CACHE_KEY);
	return result[CACHE_KEY] ?? {};
}

async function setCache(cache) {
	await chrome.storage.session.set({ [CACHE_KEY]: cache });
}

async function geocode(address) {
	const cache = await getCache();
	if (cache[address]) return cache[address];

	const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(address)}`;
	let data;
	try {
		const res = await fetch(url);
		data = await res.json();
	} catch {
		return { error: "NETWORK" };
	}

	if (!data.length) return { error: "NOT_FOUND" };

	const [lng, lat] = data[0].geometry.coordinates;
	const result = { lat, lng };

	const keys = Object.keys(cache);
	if (keys.length >= CACHE_MAX) delete cache[keys[0]];
	cache[address] = result;
	await setCache(cache);

	return result;
}

chrome.runtime.onInstalled.addListener(async () => {
	const data = await chrome.storage.sync.get("selectors");
	if (!data.selectors) {
		await chrome.storage.sync.set({ selectors: DEFAULT_SELECTORS });
	}
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
	if (message.type !== "GEOCODE") return false;
	geocode(message.address).then(sendResponse);
	return true;
});
