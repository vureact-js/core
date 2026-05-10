<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

**Vue を書き、保守可能な React を生成する**

**Vue から React への完全コンパイルツール**。Vue 3 の SFC・Script・Style を**純粋な React 18+ コンポーネントとコードに完全コンパイル**（ランタイムブリッジ不要）、`<script setup>` のコア全機能に対応。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square&color=red)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

[English](./README.en.md) | [简体中文](./README.md) | 日本語

[<video autoplay loop muted src="./assets/hero_demo_3MB.mp4"></video>](https://github.com/user-attachments/assets/ae3efac0-9576-42ea-8bbd-8dd5509947a8)

</div>

---

*「 VuReact は構文変換を超え、Vue のメンタルモデルと React のエコシステムを融合し、Vue コードから**保守可能・進化可能・プロダクション対応**の React コードを生成します 」*

## ✨ 核心機能

- **🧠 セマンティックレベルでのコンパイル、単なる文字列置換ではありません**：テンプレート、`<script setup>`、Composition API、TS 型などの完全なセマンティクスを分析し、React の慣習に沿ったコードを生成します。
- **🎯 規約優先、制御可能で保守性が高い**：「何でも変換できる」ことを追求せず、明確なコンパイル規約に基づき、変換結果が予測可能かつ分析可能であることを保証します。
- **📦 段階的移行**：単一ファイルからプロジェクト全体まで徐々に進めることができ、一度に全てを書き換える必要はありません。
- **⚛️ 完全な機能アダプテーション**：リアクティブ API、ライフサイクル、組み込みコンポーネント、ルーティングなどの Vue コア機能を React に完全適応。`scoped`/`module` スタイルと Less/Sass はコンパイル段階で処理され、ランタイムオーバーヘッドはゼロです。
- **⚡ スマートな依存関係分析**：トップレベル関数には自動で `useCallback` を注入、変数宣言には自動で `useMemo` を注入、hooks の依存関係を自動追跡します。
- **🛠️ デュアルモード CLI**：`vureact build`（超高速インクリメンタルコンパイル）+ `vureact watch`（ファイル監視）により、ネイティブに近い開発体験を提供します。

## 🪄 オンラインデモ

実際に VuReact が Vue プロジェクトを React プロジェクトにコンパイルし、ページが正常に動作するまでの全プロセスを体験できます。

- カスタマーサポートハブ（混在記述）：<https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true>
- CRM管理画面（標準）：<https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master>

## 🧩 利用事例

あなたのチーム、製品、または実験プロジェクトがすでに VuReact を使用している場合、ぜひお知らせください。このセクションでは、実際のプロジェクト名、使用シナリオ、移行段階、公開リンクを優先的に掲載し、後続の開発者が VuReact が自分のエンジニアリングシナリオに適しているかどうかを迅速に判断できるようにします。

| プロジェクト | シナリオ | 現在の段階 | リンク |
| --- | --- | --- | --- |
| あなたのプロジェクトの参加をお待ちしています | 新規プロジェクト / 移行トライアル / ハイブリッドスタックの実践 | 募集中 | [使用事例を提出](https://github.com/vureact-js/core/issues/new?template=showcase.md&title=%5BSHOWCASE%5D%20) |

Issue テンプレートから事例を提出できます：

- [「利用事例」を提出](https://github.com/vureact-js/core/issues/new?template=showcase.md&title=%5BSHOWCASE%5D%20)
- [提出済みの事例を確認](https://github.com/vureact-js/core/issues?q=is%3Aissue%20label%3Ashowcase)

メンテナーは定期的にこれらの事例から公開表示に適したエントリを整理し、ここに更新します。

## 📦 クイックスタート

👉 **完全なチュートリアルはこちら：[VuReact - クイックスタート](https://vureact.top/guide/quick-start.html)**

完了すると、以下の 4 点が明確になります：

1. 入力 SFC がどのような規約のもとで安定して変換されるか
2. コンパイル後のディレクトリ構造
3. 出力 TSX と元の SFC の意味的対応関係
4. コンパイラが自動的に依存関係を分析・追加するため、React Hooks の依存関係を手動管理する必要がないこと

### Step 0：ディレクトリの準備

最小限のプロジェクトを用意します：

```txt
my-app/
├─ src/
│  ├─ components/
│  │  └─ Counter.vue
│  ├─ App.vue
│  ├─ main.ts
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
└─ vureact.config.ts
```

### Step 1：インストール

Vue プロジェクトに VuReact コンパイラをインストール：

```bash
# npm を使用
npm install -D @vureact/compiler-core

# yarn を使用
yarn add -D @vureact/compiler-core

# pnpm を使用
pnpm add -D @vureact/compiler-core
```

### Step 2：入力 SFC の作成

`src/components/Counter.vue`

```html
<template>
  <section class="counter-card">
    <h2>{{ props.title || title }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="increment">+1</button>
    <button @click="methods.decrease">-1</button>
  </section>
</template>

<script setup lang="ts">
  // @vr-name: Counter （コンパイラに生成するコンポーネント名を指示）
  import { computed, ref } from 'vue';

  // マクロでコンポーネント名を定義することも可能
  defineOptions({ name: 'Counter' });

  // props の定義
  const props = defineProps<{ title?: string }>();

  // emits の定義
  const emits = defineEmits<{
    (e: 'change'): void;
    (e: 'update', value: number): number;
  }>();

  const step = ref(1);
  const count = ref(0);
  const title = computed(() => `Counter x${step.value}`);

  const increment = () => {
    count.value += step.value;
    emits('update', count.value);
  };

  const methods = {
    decrease() {
      count.value -= step.value;
    },
  };
</script>

<style lang="less" scoped>
  @border-color: #ddd;
  @border-radius: 8px;
  @padding-base: 12px;

  .counter-card {
    border: 1px solid @border-color;
    border-radius: @border-radius;
    padding: @padding-base;
  }
</style>
```

### Step 3：コンパイラの設定

`vureact.config.ts`

```ts
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  // 入力パス。コンパイルする Vue ファイルを含むディレクトリ。単一ファイル 'xxx.vue' も可
  input: './src',

  // セマンティック競合を避けるため Vue エントリファイルを除外
  exclude: ['src/main.ts'],

  output: {
    // コンパイル成果物とキャッシュを格納するワークスペースディレクトリ
    workspace: '.vureact',

    // 出力ディレクトリ名
    outDir: 'react-app',

    // Vite React 環境を自動初期化
    bootstrapVite: true,
  },
});
```

実際には `exclude` 以外のオプションはデフォルト値が使用されるため、追加設定は不要です。

### Step 4：コンパイルの実行

#### 方法1：npx コマンドを使用

ルートディレクトリで実行：

```bash
npx vureact build
```

#### 方法2：npm scripts を使用

`package.json` にスクリプトを追加：

```json
"scripts": {
  "watch": "vureact watch",
  "build": "vureact build"
}
```

```bash
npm run build
```

### Step 5：出力ディレクトリの確認

コンパイル後のディレクトリ構造：

```txt
my-project/
├── .vureact/              # ワークスペース（コンパイル生成）
│   ├── cache/             # コンパイルキャッシュ
│   ├── react-app/         # 生成された React コード
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── Counter-[hash].css
│   │   │   └── App.tsx
│   │   │   └── index.css
│   │   │   └── main.tsx
│   │   └── package.json
│   │   └── tsconfig.json
│   │   └── vite.config.ts
│   │   └── ...
│   │
├── src/                   # 元の Vue コード
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts            # Vue エントリファイル
├── ...
└── vureact.config.ts      # VuReact 設定ファイル
```

### Step 6：生成結果との比較

以下はフォーマットされた典型的な出力です（説明のため簡略化しています。実際のハッシュやプロパティ名は生成物をご確認ください）：

```tsx
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './Counter-a1b2c3.css';

// defineProps と defineEmits から推論
type ICounterType = {
  title?: string;
  onChange: () => void;
  onUpdate: (value: number) => number;
};

// memo でラップされたコンポーネント
const Counter = memo((props: ICounterType) => {
  // ref/computed が同等のアダプテーション API に変換
  const step = useVRef(1);
  const count = useVRef(0);
  const title = useComputed(() => `Counter x${step.value}`);

  // トップレベルアロー関数の依存関係を自動解析し、useCallback を注入
  const increment = useCallback(() => {
    count.value += step.value;
    props.onUpdate?.(count.value); // emits の変換
  }, [count.value, step.value, props.onUpdate]);

  // トップレベルオブジェクトの依存関係を自動解析し、useMemo を注入
  const methods = useMemo(
    () => ({
      decrease() {
        count.value -= step.value;
      },
    }),
    [count.value, step.value],
  );

  return (
    <>
      <section className="counter-card" data-css-a1b2c3>
        <h2 data-css-a1b2c3>{props.title || title.value}</h2>
        <p data-css-a1b2c3>Count: {count.value}</p>
        <button onClick={increment} data-css-a1b2c3>
          +1
        </button>
        <button onClick={methods.decrease} data-css-a1b2c3>
          -1
        </button>
      </section>
    </>
  );
});

export default Counter;
```

CSS ファイルの内容：

```css
.counter-card[data-css-a1b2c3] {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
}
```

### 重要な観察ポイント

1. `// @vr-name: Counter` という特別なコメントがコンポーネント名を定義
2. `defineProps` と `defineEmits` が TS コンポーネントタイプに変換
3. 純粋な UI 表示コンポーネント以外はデフォルトで `memo` でラップ
4. `ref` / `computed` はランタイムアダプテーション API（`useVRef` / `useComputed`）に変換
5. テンプレートのイベントコールバックは React セマンティクスの `onClick` に変換
6. トップレベルのアロー関数は依存関係を自動解析し、`useCallback` を注入
7. トップレベルの変数宣言は依存関係を自動解析し、`useMemo` を注入
8. JSX 内の元 `ref` 状態値に `.value` を追加
9. Less スタイルは css コードにコンパイル
10. `scoped` スタイルはハッシュ付き css ファイルを生成し、要素にスコープ属性を付与

## 📋 コンパイル規約（必読）

詳細は [VuReact コンパイル規約](https://vureact.top/guide/specification.html) をご覧ください。

## 🛠️ CLI コマンド

```bash
# プロジェクトのコンパイル
npx vureact build

# ウォッチモードでコンパイル
npx vureact watch

# ヘルプの表示
npx vureact --help
```

## よくある質問

[VuReact FAQ](https://vureact.top/guide/faq.html) をご覧ください。

## 🔗 エコシステム

- **[ランタイムアダプテーションパッケージ](https://runtime.vureact.top)**：React 版の Vue コア API を提供
- **[ルーティングアダプテーションパッケージ](https://router.vureact.top)**：Vue Router → React Router 変換をサポート
- **[完全ドキュメント](https://vureact.top)**：詳細な利用ガイドと API ドキュメント

## 🎯 適用シーン

### ✅ 推奨用途

- **新規プロジェクト開発**：VuReact 規約に従って Vue スタイルのコンポーネントを作成
- **段階的移行**：ディレクトリやモジュール単位での段階的移行をサポート
- **ハイブリッド開発**：Vue と React コンポーネントの共存が可能

### ⚠️ 注意事項

- **制御可能性優先**：現バージョンは制御可能なエンジニアリングシーンを優先
- **コンベンション駆動**：明確なコンパイル規約に従う必要あり
- **モダン構文**：Vue 3 Composition API と `<script setup>` に特化

## 🔎 リポジトリサブパッケージ

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

## 🤝 コントリビューション

Issue と Pull Request をお待ちしています。コントリビューションガイド（[CONTRIBUTING.md](CONTRIBUTING.md)）をご一読ください。

## 📄 ライセンス

MIT License © 2025 [Ruihong Zhong (Ryan John)](./LICENSE)

## 🩷 スポンサーシップ

**VuReact の継続的な発展はコミュニティのサポートに支えられています。いただいたスポンサーシップはプロジェクトのメンテナンス、機能開発、ドキュメント改善に直接使用され、Vue から React へのコンパイル技術の探求を共に前進させます。**

プラットフォーム：[愛発電（afdian）](https://afdian.com/a/vureact-js/plan)

---

**VuReact — 「Vue から React への完全コンパイル」という長年の技術構想の実現可能性を、革新的なコンパイルアーキテクチャとランタイムアダプテーションを通じて実証し、かつてない変換の深さとエンジニアリング完全性を達成します。**
