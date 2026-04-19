export const DEFAULT_SELECTORS = [
	{
		domain: "suumo.jp",
		urlPattern: "/ichiran/",
		cardSelector: ".property_unit",
		addressSelector: "所在地",
		insertSelector: ".property_unit-body",
	},
	{
		domain: "suumo.jp",
		urlPattern: null,
		cardSelector: null,
		addressSelector: ".fl.w296.bw",
		insertSelector: ".mt9",
	},
	{
		domain: "www.homes.co.jp",
		urlPattern: null,
		cardSelector: null,
		addressSelector: ".mod-bukkenSpec .spec-table td",
		insertSelector: ".bukkenDetail",
	},
];
