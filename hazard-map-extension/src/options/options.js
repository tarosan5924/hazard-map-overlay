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
		urlPattern: "",
		cardSelector: "",
		addressSelector: ".fl.w296.bw",
		insertSelector: ".mt9",
	},
	{
		domain: "www.homes.co.jp",
		urlPattern: "",
		cardSelector: "",
		addressSelector: ".mod-bukkenSpec .spec-table td",
		insertSelector: ".bukkenDetail",
	},
];

const tbody = document.getElementById("selectors-body");
const status = document.getElementById("status");

function showStatus(msg, isError = false) {
	status.textContent = msg;
	status.className = isError ? "error" : "";
	setTimeout(() => {
		status.textContent = "";
	}, 2500);
}

function createRow(
	entry = {
		domain: "",
		urlPattern: "",
		cardSelector: "",
		addressSelector: "",
		insertSelector: "",
	},
) {
	const tr = document.createElement("tr");
	tr.innerHTML = `
		<td><input type="text" name="domain" value="${escapeHtml(entry.domain)}"></td>
		<td><input type="text" name="urlPattern" value="${escapeHtml(entry.urlPattern ?? "")}"></td>
		<td><input type="text" name="cardSelector" value="${escapeHtml(entry.cardSelector ?? "")}"></td>
		<td><input type="text" name="addressSelector" value="${escapeHtml(entry.addressSelector)}"></td>
		<td><input type="text" name="insertSelector" value="${escapeHtml(entry.insertSelector)}"></td>
		<td><button class="btn-delete">削除</button></td>
	`;
	tr.querySelector(".btn-delete").addEventListener("click", () => tr.remove());
	return tr;
}

function escapeHtml(str) {
	return str
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;");
}

function readRows() {
	return [...tbody.querySelectorAll("tr")]
		.map((tr) => ({
			domain: tr.querySelector('[name="domain"]').value.trim(),
			urlPattern: tr.querySelector('[name="urlPattern"]').value.trim() || null,
			cardSelector:
				tr.querySelector('[name="cardSelector"]').value.trim() || null,
			addressSelector: tr
				.querySelector('[name="addressSelector"]')
				.value.trim(),
			insertSelector: tr.querySelector('[name="insertSelector"]').value.trim(),
		}))
		.filter((r) => r.domain);
}

function renderTable(selectors) {
	tbody.innerHTML = "";
	for (const s of selectors) tbody.appendChild(createRow(s));
}

async function load() {
	const data = await chrome.storage.sync.get("selectors");
	renderTable(data.selectors ?? DEFAULT_SELECTORS);
}

document.getElementById("btn-add").addEventListener("click", () => {
	tbody.appendChild(createRow());
});

document.getElementById("btn-save").addEventListener("click", async () => {
	const selectors = readRows();
	await chrome.storage.sync.set({ selectors });
	showStatus("保存しました");
});

document.getElementById("btn-export").addEventListener("click", async () => {
	const selectors = readRows();
	const blob = new Blob([JSON.stringify(selectors, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "hazard-map-selectors.json";
	a.click();
	URL.revokeObjectURL(url);
});

document.getElementById("import-input").addEventListener("change", (e) => {
	const file = e.target.files[0];
	if (!file) return;
	const reader = new FileReader();
	reader.onload = async (ev) => {
		try {
			const selectors = JSON.parse(ev.target.result);
			if (!Array.isArray(selectors)) throw new Error("配列形式が必要です");
			renderTable(selectors);
			await chrome.storage.sync.set({ selectors });
			showStatus("インポートして保存しました");
		} catch (err) {
			showStatus(`インポート失敗: ${err.message}`, true);
		}
		e.target.value = "";
	};
	reader.readAsText(file);
});

document.getElementById("btn-reset").addEventListener("click", async () => {
	renderTable(DEFAULT_SELECTORS);
	await chrome.storage.sync.set({ selectors: DEFAULT_SELECTORS });
	showStatus("デフォルトに戻しました");
});

load();
