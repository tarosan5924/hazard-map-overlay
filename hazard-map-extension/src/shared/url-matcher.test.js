import { describe, expect, it } from "vitest";
import { DEFAULT_SELECTORS } from "./selectors.js";
import { findConfig, matchConfig } from "./url-matcher.js";

describe("matchConfig", () => {
	it("urlPattern なしはすべてのパスにマッチ", () => {
		const c = { domain: "suumo.jp", urlPattern: null };
		expect(
			matchConfig(c, "https://suumo.jp/ikkodate/__JJ.html", "suumo.jp"),
		).toBe(true);
	});

	it("urlPattern ありはパスを含む場合のみマッチ", () => {
		const c = { domain: "suumo.jp", urlPattern: "/ichiran/" };
		expect(
			matchConfig(
				c,
				"https://suumo.jp/jj/bukken/ichiran/JJ012FC002/",
				"suumo.jp",
			),
		).toBe(true);
		expect(
			matchConfig(c, "https://suumo.jp/ikkodate/__JJ.html", "suumo.jp"),
		).toBe(false);
	});

	it("ドメイン不一致はマッチしない", () => {
		const c = { domain: "suumo.jp", urlPattern: null };
		expect(
			matchConfig(c, "https://www.homes.co.jp/foo/", "www.homes.co.jp"),
		).toBe(false);
	});
});

describe("findConfig", () => {
	it("SUUMO ichiran URL → ichiran 設定を返す", () => {
		const config = findConfig(
			DEFAULT_SELECTORS,
			"https://suumo.jp/jj/bukken/ichiran/JJ012FC002/?ar=030",
			"suumo.jp",
		);
		expect(config?.cardSelector).toBe(".property_unit");
	});

	it("SUUMO 詳細 URL → 詳細設定を返す", () => {
		const config = findConfig(
			DEFAULT_SELECTORS,
			"https://suumo.jp/ikkodate/__JJ_JJ010FJ100_arz1030.html",
			"suumo.jp",
		);
		expect(config?.cardSelector).toBeNull();
		expect(config?.addressSelector).toBe(".fl.w296.bw");
	});

	it("HOME'S URL → HOME'S 設定を返す", () => {
		const config = findConfig(
			DEFAULT_SELECTORS,
			"https://www.homes.co.jp/mansion/b-12345/",
			"www.homes.co.jp",
		);
		expect(config?.domain).toBe("www.homes.co.jp");
	});

	it("未対応ドメインは null を返す", () => {
		expect(
			findConfig(DEFAULT_SELECTORS, "https://example.com/", "example.com"),
		).toBeNull();
	});
});
