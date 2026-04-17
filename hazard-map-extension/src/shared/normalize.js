export function normalizeAddress(raw) {
	return raw
		.replace(/付近|以下未定|\[.*?\]|（.*?）|\(.*?\)/g, "")
		.replace(/[\s　]+/g, " ")
		.trim();
}
