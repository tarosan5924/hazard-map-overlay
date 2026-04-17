export const storage = {
	get(keys) {
		return new Promise((resolve) => chrome.storage.sync.get(keys, resolve));
	},
	set(items) {
		return new Promise((resolve) => chrome.storage.sync.set(items, resolve));
	},
};
