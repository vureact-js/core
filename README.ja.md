<div align="center"><a name="readme-top"></a>

 <img height="180" src="./assets/logo.png" />

 <h1>VuReact</h1>

**Vue を書いて、メンテナブルな React を生成する。**

> Vue 3 の SFC・Script・Style を、ランタイムブリッジを使わずに純粋な React 18+ コンポーネントへコンパイルするツールチェーンです。
>
> `<script setup>` を優先的にサポートし、主要機能を広くカバーします。段階的な移行やハイブリッド開発にも対応します。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/en/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square&color=red)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/vureact-js/core/blob/master/LICENSE)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

[オンラインで試す](#️-オンラインプレイグラウンドインストール不要) · [クイックスタート](#-クイックスタート) · [CLI](#️-cli) · [利用シーン](#-利用シーン) · [エコシステム](#️-エコシステム) · [比較（セマンティック）](https://vureact.top/en/guide/semantic-comparison/overview.html) · [更新履歴](https://vureact.top/en/guide/changelog.html)

简体中文 | [English](./README.en.md) | [日本語](./README.ja.md)

  <a href="assets/vureact-showcase(3.7MB).mp4" title="展示ビデオを見る">
    <img src="assets/vureact-showcase(800x450).gif" alt="vureact ターミナル操作デモを見る" width="100%">
  </a>

  VuReact 実践：Vue 3 SFC → React 18+ コンポーネントのコンパイルデモ。
  
  [展示ビデオを見る](assets/vureact-showcase(3.7MB).mp4) · [高画質アニメーションを見る](assets/vureact-showcase(1280x720).gif)
</div>

---

## 💡 なぜ VuReact を選ぶか

既存の手法はランタイムを抱き合わせるもの（性能・デバッグの問題）か、複雑な構文で失敗する部分的な変換です。VuReact はコンパイル時のアプローチで、出力は純粋な React コードです。段階的な移行が可能です。

| 他の手法 | VuReact |
|---|---|
| ランタイムラッパー（デュアルフレームワーク、性能低下、バンドル増） | コンパイル時に純粋な React を出力、段階的な移行が可能 |
| 部分的な変換（複雑構文で失敗） | テンプレート指令、Props、スロット、Composition API、scoped スタイル、TypeScript 型をサポート |
| AI リライト（結果が不安定、手動レビュー必須） | AST に基づく決定論的変換で予測可能かつ追跡可能 |

👉 **詳細:** [Why VuReact? — more than syntax transformation](https://vureact.top/en/guide/why.html)

---

## 🕹️ オンラインプレイグラウンド（インストール不要）

30 秒で Vue → React のコンパイル体験ができます：

- [Customer Support Hub（混在例）](https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true)
- [CRM 管理バックエンド（標準例）](https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master)

> 例は CodeSandbox 上で自動的に起動します。読み込みに時間がかかる場合があります。

---

## ✨ コア機能

- **セマンティックな変換（文字列置換ではない）:** テンプレート、`<script setup>`、Composition API、TS 型を解析し、慣習に沿った React コードを生成します。
- **約定優先・可制御・メンテナブル:** すべてを無差別に変換するのではなく、明確なコンパイル約定に従い予測可能な出力を実現します。
- **段階的移行:** 単一ファイルからプロジェクト全体まで段階的に変換可能。
- **包括的な機能適合:** レスポンシブ API、ライフサイクル、組み込み、ルーティング、scoped/module スタイル、Less/Sass をコンパイル時に処理（ランタイム負荷ゼロ）。
- **自動依存解析:** トップレベル関数に `useCallback` を注入、オブジェクトや値は `useMemo` でメモ化、hooks の依存を追跡します。
- **デュアルモード CLI:** `vureact build`（高速インクリメンタルビルド）と `vureact watch`（ウォッチモード）を提供。

---

## 🚀 クイックスタート

> 💡 **ゼロから始める公式ガイド:** [VuReact Quick Start](https://vureact.top/en/guide/quick-start.html)
>
> 💡 **ハイブリッド移行の実践例:** [Customer Support Hub (Vue + React)](https://vureact.top/en/guide/customer-support-hub)

### インストール

Vue 3 プロジェクトで:

```bash
npm i -D @vureact/compiler-core
```

### 設定ファイル作成

プロジェクトルートに `vureact.config.ts` を作成：

```ts
import { defineConfig } from '@vureact/compiler-core';
export default defineConfig({
  input: '', // 入力パス（単一ファイルまたはディレクトリ）
  exclude: ['src/main.ts'], // Vue エントリとコンパイル対象外ファイルを除外
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
  onSuccess: async () => {
    console.log('コンパイル成功！');
    // ここでファイル操作や他ツール呼び出しなどの追加処理を行えます
  },
});
```

> 💡 そのほかの設定項目は [Config API](https://vureact.top/en/api/config.html) を参照してください。

### 単一コンポーネントを変換

```ts
{
 input: './src/your-component.vue',
}
```

### プロジェクト全体を変換

```ts
{
 input: './src',
}
```

> 💡 注意: Vue Router を使用する場合は、必要な設定のために [router adaptation guide](https://vureact.top/en/guide/router-adaptation.html) を参照してください。

### コンパイラ実行

```bash
npx vureact build
```

自動生成される `.vureact/react-app` ディレクトリには、変換後のコンポーネントと関連する依存関係・設定が含まれます。

プロジェクト構成例：

```txt
vue-project/
├── .vureact/
│   ├── cache/             # コンパイルキャッシュ
│   ├── react-app/         # 変換後の React アプリ
│   │   ├── src/           # 変換後の React ソース
│   │   ├── package.json   # React アプリ依存
│   │   ├── vite.config.ts # Vite 設定
│   │
├── src/                   # 元の Vue ソース
├── package.json           # 元プロジェクトの依存
└── vureact.config.ts      # 設定ファイル
```

> 💡 コンパイル警告が出た場合は、メッセージに従って修正してください。[Compilation Conventions](https://vureact.top/en/guide/specification.html) と [Best Practices](https://vureact.top/en/guide/best-practices.html) を読むと、変換しやすい Vue コードを書きやすくなります。

---

## 🛠️ CLI

```bash
# フル／インクリメンタルビルド
npx vureact build

# 開発用ウォッチ
npx vureact watch

# バージョン表示
npx vureact -v

# ヘルプ
npx vureact --help
```

👉 詳細はガイドを参照: [Incremental Compilation](https://vureact.top/en/guide/incremental-compilation.html) | [Watch Mode](https://vureact.top/en/guide/watch-mode.html)

---

## 💬 フィードバックとコミュニティ

- 問題があれば [FAQ](https://vureact.top/en/guide/faq.html) を確認、または [Issue](https://github.com/vureact-js/core/issues) を提出してください。
- ルーター適合に関する疑問は [router adaptation guide](https://vureact.top/en/guide/router-adaptation.html) を参照してください。
- ページスタイルが崩れる場合は [style troubleshooting solution](https://vureact.top/en/guide/faq.html#q35-how-to-fix-missing-or-broken-page-styles) を確認してください。
- ご意見は [Discussions](https://github.com/vureact-js/core/discussions) で共有してください。
- プロジェクトを応援したい場合は、⭐ を付けてもらえると助かります。

---

## ✅ 利用シーン

### 推奨

- **新規プロジェクト**: VuReact の約定に従って Vue 風コンポーネントを記述。
- **段階的移行**: ディレクトリやモジュール単位で移行可能。
- **ハイブリッド開発**: Vue と React の共存が可能。

### 注意点

- **可制御性優先**: 予測可能性を重視した設計。
- **約定駆動**: 明確な[コンパイル規約](https://vureact.top/en/guide/specification.html)に従う必要あり。
- **モダン構文重視**: Vue 3 Composition API と `<script setup>` を前提とする。

> オプション [☣️ハイブリッド開発](https://vureact.top/en/guide/mind-control-readme.html)で、Vue プロジェクトに直接 React エコシステムの機能を導入できます。

---

## 📦 リポジトリパッケージ

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

---

## ♻️ エコシステム

- **[VuReact Runtime](https://runtime.vureact.top/en)** — React 側での軽量な Vue API 実装。
- **[VuReact Router](https://router.vureact.top/en)** — Vue Router 風の構文を React Router にマッピングするアダプター。

---

## 🙏 特別謝辞

ランタイム適応レイヤーの開発は、以下のプロジェクトから着想と支援を受けています。

- [valtio](https://github.com/pmndrs/valtio) — React 側における Vue 風リアクティブ API と Proxy 実装
- [react-transition-group](https://github.com/reactjs/react-transition-group#readme) — React のトランジションアニメーションコンポーネント

---

## 🤝 コントリビュート

貢献歓迎です。詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご確認ください。

---

## 📄 ライセンス

MIT License © 2025 [Ruihong Zhong (Ryan John)](./LICENSE)

---

## 🩷 スポンサー

VuReact はコミュニティに支えられています。スポンサーはメンテナンス、機能、ドキュメント改善に使われます。

プラットフォーム: [Afdian](https://afdian.com/a/vureact-js/plan)

---

## 🧩 事例募集

利用事例を募集しています。試したプロジェクトがあればご連絡ください：

- [事例を提出](https://github.com/vureact-js/core/issues/new?template=showcase.md&title=%5BSHOWCASE%5D%20)
- [提出済みの事例を見る](https://github.com/vureact-js/core/issues?q=is%3Aissue%20label%3Ashowcase)

---

*VuReact — 革新的なコンパイラ設計とランタイム適応を通じて、Vue から React への完全コンパイルの可能性を探り、これまでにない変換深度とエンジニアリングの完成度を目指します。*
