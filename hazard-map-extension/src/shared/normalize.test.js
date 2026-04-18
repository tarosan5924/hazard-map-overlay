import { describe, expect, it } from "vitest";
import { normalizeAddress } from "./normalize.js";

describe("normalizeAddress", () => {
	it("通常の住所はそのまま返す", () => {
		expect(normalizeAddress("東京都千代田区千代田1-1")).toBe(
			"東京都千代田区千代田1-1",
		);
	});

	it("「付近」を除去する", () => {
		expect(normalizeAddress("東京都新宿区西新宿2-8-1付近")).toBe(
			"東京都新宿区西新宿2-8-1",
		);
	});

	it("「以下未定」を除去する", () => {
		expect(normalizeAddress("東京都渋谷区以下未定")).toBe("東京都渋谷区");
	});

	it("角括弧内テキストを除去する", () => {
		expect(normalizeAddress("東京都千代田区[地図を表示]")).toBe(
			"東京都千代田区",
		);
	});

	it("全角括弧内テキストを除去する", () => {
		expect(normalizeAddress("東京都千代田区（東部エリア）")).toBe(
			"東京都千代田区",
		);
	});

	it("半角括弧内テキストを除去する", () => {
		expect(normalizeAddress("東京都千代田区(東部エリア)")).toBe(
			"東京都千代田区",
		);
	});

	it("連続する半角スペースを1つにまとめる", () => {
		expect(normalizeAddress("東京都  千代田区")).toBe("東京都 千代田区");
	});

	it("全角スペースを半角スペースに統一する", () => {
		expect(normalizeAddress("東京都　千代田区")).toBe("東京都 千代田区");
	});

	it("先頭・末尾の空白を除去する", () => {
		expect(normalizeAddress("  東京都千代田区  ")).toBe("東京都千代田区");
	});

	it("複数のパターンを同時に処理する", () => {
		expect(normalizeAddress("  東京都千代田区（付近）以下未定[地図]  ")).toBe(
			"東京都千代田区",
		);
	});

	it("空文字列は空文字列を返す", () => {
		expect(normalizeAddress("")).toBe("");
	});
});
