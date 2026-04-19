export function matchConfig(config, href, hostname) {
	if (!hostname.includes(config.domain)) return false;
	if (!config.urlPattern) return true;
	return new RegExp(config.urlPattern).test(href);
}

export function findConfig(selectors, href, hostname) {
	return selectors.find((c) => matchConfig(c, href, hostname)) ?? null;
}
