# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

不動産ポータルサイト（SUUMO / HOME'S）の物件詳細ページにハザードマップを重畳表示する Chrome 拡張機能（Manifest V3）。

## アーキテクチャ

CSP 制限を回避するため 3 層分離アーキテクチャを採用：

```
Content Script (content.js)
  → chrome.runtime.sendMessage({ type: 'GEOCODE', address })
  → Service Worker (service-worker.js)
      → 国土地理院ジオコーディング API (msearch.gsi.go.jp)
      ← { lat, lng }
  → iframe src="map.html?lat=..&lng=.."
      → Leaflet + 地理院タイル + ハザードタイル (cyberjapandata.gsi.go.jp / disaportaldata.gsi.go.jp)
```

- **Content Script**: DOM から住所を抽出し iframe を挿入。外部スクリプト読み込み不可（CSP 制限）
- **Service Worker**: ジオコーディング API の fetch 担当。MV3 のため休止あり → キャッシュは `chrome.storage.session` に永続化
- **map.html**: 拡張内リソースなので CSP 制限なし。Leaflet は CDN ではなく `vendor/leaflet/` に同梱

## 主要ファイル構成

```
manifest.json                          # MV3 マニフェスト（権限・CSW・web_accessible_resources）
src/content/content.js                 # 住所抽出 → sendMessage → iframe 挿入
src/background/service-worker.js       # GEOCODE メッセージ受信 → GSI API → キャッシュ
src/map/map.html + map.js             # Leaflet 地図描画・レイヤー制御
src/options/options.html + options.js  # セレクタ設定 UI（chrome.storage.sync）
src/shared/normalize.js                # 住所正規化ユーティリティ（テスト対象）
src/shared/selectors.js                # SUUMO / HOME'S デフォルトセレクタ定義
src/shared/storage.js                  # chrome.storage.sync の Promise ラッパー
vendor/leaflet/                        # Leaflet.js 同梱（CSP 回避）
```

## 開発・動作確認

ビルドステップ不要（バニラ JS）。以下の手順で確認：

1. `chrome://extensions/` でデベロッパーモード有効化
2. 「パッケージ化されていない拡張機能を読み込む」で `hazard-map-extension/` を指定
3. 地図単体確認: `chrome-extension://<id>/src/map/map.html?lat=35.68&lng=139.76` を直接開く
4. ジオコーディング確認: DevTools の Service Worker コンソールで `chrome.runtime.sendMessage({type:'GEOCODE', address:'東京都千代田区千代田1-1'})` を実行

## テスト

`normalize.js` のユニットテストは Node + Vitest で実施：

```bash
npx vitest run src/shared/normalize.test.js
```

## 重要な設計制約

- **`web_accessible_resources`** に `map.html` を含めないと Content Script から iframe で読めない
- **`host_permissions`** にジオコーディング API ドメイン (`msearch.gsi.go.jp`) を含めないと Service Worker からの fetch がブロックされる
- Leaflet は必ずローカル同梱。CDN 参照は不動産サイトの CSP に弾かれる
- ジオコーディング失敗時は `{ error: 'NOT_FOUND' | 'NETWORK' }` を返却し、UI にエラー表示する
- マップのフッターに「座標はエリア代表点です」の免責表示を常時表示すること

## 開発スタイル

TDD で開発する（探索 → Red → Green → Refactoring）。
KPI やカバレッジ目標が与えられたら、達成するまで試行する。
不明瞭な指示は質問して明確にする。

## コード設計

- 関心の分離を保つ
- 状態とロジックを分離する
- 可読性と保守性を重視する
- コントラクト層（API/型）を厳密に定義し、実装層は再生成可能に保つ
- 静的検査可能なルールはプロンプトではなく、その環境の linter か ast-grep で記述する

## ハザードタイル URL

| レイヤー | URL パターン |
|---|---|
| 地理院標準地図 | `https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png` |
| 洪水浸水想定区域（想定最大規模）| `https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png` |
| 土砂災害警戒区域 | `https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png` |
