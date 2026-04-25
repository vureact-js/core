<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

**Vue を書き、本番 React コードを届ける** —— Vue 3 のメンタルモデルで React 18+ アプリケーションを構築するコンパイラ。

単なるプロジェクト移行ツールにとどまらず、Vue の優れた開発メンタルと React エコシステムの能力をシームレスに融合し、**保守可能で進化し続ける、本番即応**の React コードを生み出します。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top/)
[![Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

[English](./README.en.md) | [简体中文](./README.md) | 日本語

[<video autoplay loop muted src="./assets/hero_demo_3MB.mp4"></video>](https://github.com/user-attachments/assets/ae3efac0-9576-42ea-8bbd-8dd5509947a8)

</div>

---

## 🪄 オンラインデモ

実際に VuReact が Vue プロジェクトを React プロジェクトにコンパイルし、ページが正常に動作するまでの全プロセスを体験できます。

- カスタマーサポートハブ（混在記述）：<https://codesandbox.io/p/github/vureact-js/example-customer-support-hub/master?import=true>
- CRM管理画面（標準）：<https://codesandbox.io/p/github/vureact-js/example-crm-admin-backend/master>

## 🎯 コア哲学

VuReact は単なるシンタックス変換ツールではなく、**コンベンションベースのインテリジェントコンパイルプラットフォーム**です。「完全網羅よりも制御可能性」の原則に従い、明確なコンパイル規約を通じて、Vue から React への移行に**予測可能・分析可能・保守可能**なエンジニアリングパスを提供します。

さらに VuReact は移行シナリオだけでなく、**Vue の優れたメンタルモデルを享受**しながら**React コードを出力**したい開発シーンにも適しています。

## ✨ コア機能

**🧠 セマンティック認識**：Vue のテンプレートディレクティブ、script setup ロジック、Composition API、TypeScript 型など、構文の完全な意味構造を深く理解し、React のベストプラクティスに沿ったコードをインテリジェントに生成

**⚖️ 段階的移行**：単一ファイルからプロジェクト全体まで制御可能な段階的移行をサポート。大規模な一括変換に伴う技術負債とシステムリスクを回避

**🧭 コンベンション駆動**：ヒューリスティックルールではなく明確な構文規約に基づいてコンパイル。変換動作の決定性・分析可能性・保守性を保証し、モダンな Vue 構文を完全サポート

**⚛️ 完全機能適合**：リアクティブAPI、ライフサイクル、ビルトインコンポーネント、ルーティングなど Vue のコア機能を React に完全適合。scoped/module やスタイル言語の処理はコンパイル段階で完結し、ランタイムオーバーヘッドゼロを実現

**⚡ 優れた開発体験**：Vue のメンタルモデルを継承し、意識せずに React 開発を実現。build/watch デュアルモード CLI は超高速インクリメンタルコンパイルとファイル監視をサポートし、クロスフレームワーク開発の効率と体験をネイティブレベルに

**🌀 革新的探究**：クロスフレームワークコンパイルブリッジパターンを探究。Vue と React のコードをコンパイルレベルで共存させ、「Vue から React への完全コンパイル」の技術的実現可能性を実証

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
└─ vureact.config.js
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
│   │   │   │   └── counter-[hash].css
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
└── vureact.config.js      # VuReact 設定ファイル
```

### Step 6：生成結果との比較

以下はフォーマットされた典型的な出力です（説明のため簡略化しています。実際のハッシュやプロパティ名は生成物をご確認ください）：

```tsx
import { memo, useCallback, useMemo } from 'react';
import { useComputed, useVRef } from '@vureact/runtime-core';
import './counter-a1b2c3.css';

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
