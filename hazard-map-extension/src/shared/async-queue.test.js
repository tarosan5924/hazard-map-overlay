import { describe, expect, it } from "vitest";
import { createQueue } from "./async-queue.js";

describe("createQueue", () => {
	it("最大同時実行数を超えない", async () => {
		let concurrent = 0;
		let maxConcurrent = 0;
		const enqueue = createQueue(3);

		const task = () =>
			new Promise((resolve) => {
				concurrent++;
				maxConcurrent = Math.max(maxConcurrent, concurrent);
				setTimeout(() => {
					concurrent--;
					resolve();
				}, 10);
			});

		await Promise.all([...Array(6)].map(() => enqueue(task)));
		expect(maxConcurrent).toBeLessThanOrEqual(3);
	});

	it("全タスクが完了する", async () => {
		const results = [];
		const enqueue = createQueue(2);

		await Promise.all(
			[1, 2, 3, 4, 5].map((i) =>
				enqueue(() => Promise.resolve().then(() => results.push(i))),
			),
		);
		expect(results.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
	});

	it("タスクのエラーが呼び出し元に伝播する", async () => {
		const enqueue = createQueue(2);
		await expect(
			enqueue(() => Promise.reject(new Error("fail"))),
		).rejects.toThrow("fail");
	});

	it("エラー後も後続タスクが実行される", async () => {
		const enqueue = createQueue(1);
		const results = [];

		await Promise.allSettled([
			enqueue(() => Promise.reject(new Error("err"))),
			enqueue(() => Promise.resolve().then(() => results.push(1))),
		]);
		expect(results).toEqual([1]);
	});
});
