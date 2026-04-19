export function createQueue(maxConcurrency) {
	const queue = [];
	let running = 0;

	function drain() {
		while (running < maxConcurrency && queue.length) {
			const { fn, resolve, reject } = queue.shift();
			running++;
			fn()
				.then(resolve, reject)
				.finally(() => {
					running--;
					drain();
				});
		}
	}

	return function enqueue(fn) {
		return new Promise((resolve, reject) => {
			queue.push({ fn, resolve, reject });
			drain();
		});
	};
}
