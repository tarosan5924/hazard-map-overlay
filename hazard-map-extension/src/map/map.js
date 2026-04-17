const params = new URLSearchParams(location.search);
const lat = parseFloat(params.get("lat") ?? "35.68");
const lng = parseFloat(params.get("lng") ?? "139.76");

const map = L.map("map").setView([lat, lng], 14);

const baseTile = L.tileLayer(
	"https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
	{
		attribution:
			'<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>',
		maxZoom: 18,
	},
).addTo(map);

const floodLayer = L.tileLayer(
	"https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png",
	{ opacity: 0.6, maxZoom: 17 },
);

const sedimentLayer = L.tileLayer(
	"https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png",
	{ opacity: 0.6, maxZoom: 17 },
);

floodLayer.addTo(map);
sedimentLayer.addTo(map);

L.control
	.layers(
		{ 地理院標準地図: baseTile },
		{ 洪水浸水想定区域: floodLayer, 土砂災害警戒区域: sedimentLayer },
	)
	.addTo(map);

L.marker([lat, lng]).addTo(map);
