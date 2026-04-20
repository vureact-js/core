<div align="center"><a name="readme-top"></a>

  <img height="180" src="./assets/logo.png" />

  <h1>VuReact</h1>

Vue 3 の構文を使って React 18+ アプリケーションを記述できるコンパイラ。

プロジェクト移行に限定されず、Vue の開発体験と React のエコシステム能力をシームレスに統合し、保守可能で進化可能、プロダクション対応の React コードを生成することに焦点を当てています。

[![Npm](https://img.shields.io/npm/v/@vureact/compiler-core.svg?label=Npm&style=flat-square)](https://vureact.top)
[![Total Downloads](https://img.shields.io/npm/dt/@vureact/compiler-core?label=Total%20Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Monthly Downloads](https://img.shields.io/npm/dm/@vureact/compiler-core?label=Monthly%20Downloads&style=flat-square)](https://www.npmjs.com/package/@vureact/compiler-core)
[![Node](https://img.shields.io/badge/node-%3E%3D19.0.0-green?label=Node)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-42b883)](https://vuejs.org/)
[![React 18+](https://img.shields.io/badge/React-18%2B-61dafb)](https://reactjs.org/)

日本語 | [简体中文](./README.md) | [English](./README.en.md)

[<video autoplay loop muted src="./assets/hero_demo_3MB.mp4"></video>](https://github.com/user-attachments/assets/ae3efac0-9576-42ea-8bbd-8dd5509947a8)

</div>

---

## 🎯 核心理念

VuReact は単なる構文変換ツールではなく、**規約ベースのインテリジェントなコンパイルプラットフォーム**です。「完全なカバレッジよりも制御可能性を優先する」という原則に従い、明確なコンパイル規約を通じて、Vue から React への移行に**予測可能で分析可能、保守可能な**エンジニアリングパスを提供します。

さらに、VuReact は移行シナリオだけでなく、**Vue の優れたメンタルモデルを享受**しながら**React コードを生成**したい開発シナリオにも適しています。

## ✨ コア機能

- ⚖️ 制御可能な段階的移行：単一コンポーネントからプロジェクト全体への安全で段階的な移行をサポートします。

- 🧭 規約駆動：ヒューリスティックなルールではなく、明確なルールに基づいたコンパイルにより、変換動作の決定性、分析可能性、保守性を確保します。

- 🌀 クロスフレームワークコンパイルブリッジ：Vue と React コードがコンパイルレベルで共存できる実験的なハイブリッドコンパイルモードを探索し、コンパイラがフレームワーク間の構文の違いを処理する橋渡し役を果たします。

- 🏆 概念実証（実験的）：大規模な「Vue から React への完全コンパイル」という長期的な技術的構想の実現可能性を検証し、革新的なコンパイルアーキテクチャとランタイム適応を通じて、前例のない変換の深さとエンジニアリングの完全性を実現します。

- 🔄 モダンな Vue 構文優先：watch、defineProps、defineEmits などを含む Vue 3 の script setup 構文と Composition API を完全にサポートします。

- 📋 テンプレートから JSX へのインテリジェント変換：Vue のテンプレート構文やディレクティブなどを、React の慣習に合った JSX コードにインテリジェントに変換し、ロジックを明確に保ちながら React のベストプラクティスに従います。

- ⚛️ Vue コア機能の適応：リアクティブシステム、ライフサイクル、組み込みコンポーネント（Transition/KeepAlive）などのコア機能を React に完全に適応させ、開発のメンタルモデルを一貫して維持します。

- 🎨 ゼロランタイムスタイルソリューション：コンパイル段階で SFC の scoped および module スタイル、および Less と Sass を完全に処理し、静的 CSS ファイルを生成することで、ランタイムスタイルのパフォーマンスオーバーヘッドを解決します。

- 🔬 細かい処理：import パスの修正から型定義の生成、コードフォーマットから依存関係分析まで、すべてのコンパイルの詳細が注意深く設計・最適化されています。

- 📝 TypeScript シームレス移行：TS 型定義を完全に保持し、対応する React コンポーネントの型インターフェースを自動的に導出・生成し、.vue から .tsx へのシームレスな型変換をサポートします。

- ⚡ CLI とリアルタイムコンパイル：build/watch のデュアルモード CLI を提供し、インクリメンタルコンパイルとファイル監視をサポートし、スムーズな開発体験を実現します。

- 📁 完全なエンジニアリング：単なるコード変換ではなく、完全なプロジェクトコンパイル：ディレクトリの維持、ファイルの生成、リソースのコピー、依存関係の管理を行います。

- 🛠️ Vite 環境統合：オプションで Vite 公式スキャフォールディングを統合し、標準的な React プロジェクト構造と設定を自動的に初期化します。

## 📦 クイックスタート

詳細な使用ガイドと API ドキュメントについては、[VuReact 公式サイト](https://vureact.top)をご覧ください！

### インストール

```bash
npm install -D @vureact/compiler-core
# または
yarn add -D @vureact/compiler-core
# または
pnpm add -D @vureact/compiler-core
```

### 基本設定

`vureact.config.js` を作成：

```javascript
import { defineConfig } from '@vureact/compiler-core';

export default defineConfig({
  input: 'src',
  cache: true,
  exclude: ['src/main.ts'], // Vue エントリーファイルを除外
  output: {
    workspace: '.vureact',
    outDir: 'react-app',
    bootstrapVite: true,
  },
});
```

実際には、`exclude`（手動で指定する必要があります）を除いて、他のオプションはすべて上記の例の設定のデフォルト値を使用し、追加の設定は必要ありません。

### コンパイルの実行

```bash
# ワンタイムビルド
npx vureact build

# 監視モード（開発推奨）
npx vureact watch
```

## 🎨 変換例

### Vue 3 コンポーネント（入力）

```html
<template>
  <div :class="$style['hello-container']">
    <h1>{{ greetingMessage }}</h1>
    <p>カウンター: {{ count }}</p>
    <button @click="increment">クリックしてカウントを増やす</button>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';

  const count = ref<number>(0);
  const name = ref('Vue 3');

  const greetingMessage = computed(() => {
    return `こんにちは、${name.value} の世界へようこそ！`;
  });

  const increment = () => {
    count.value++;
  };

  onMounted(() => {
    console.log('コンポーネントがマウントされました！');
  });
</script>

<style module scoped>
  .hello-container {
    padding: 20px;
    border: 1px solid #42b883;
    border-radius: 8px;
  }
</style>
```

### React コンポーネント（出力）

```tsx
import { useCallback, memo } from 'react';
import { useComputed, useMounted, useVRef } from '@vureact/runtime-core';
import $style from './counter-159e8f98.module.css';

const Counter = memo(() => {
  const count = useVRef<number>(0);
  const name = useVRef('Vue 3');

  const greetingMessage = useComputed(() => {
    return `こんにちは、${name.value} の世界へようこそ！`;
  });

  const increment = useCallback(() => {
    count.value++;
  }, [count.value]);

  useMounted(() => {
    console.log('コンポーネントがマウントされました！');
  });

  return (
    <div className={$style['hello-container']} data-css-159e8f98>
      <h1 data-css-159e8f98>{greetingMessage.value}</h1>
      <p data-css-159e8f98>カウンター: {count.value}</p>
      <button onClick={increment} data-css-159e8f98>
        クリックしてカウントを増やす
      </button>
    </div>
  );
});

export default Counter;
```

生成された付属 CSS ファイルの内容：

```css
.hello-container[data-css-159e8f98] {
  padding: 20px;
  border: 1px solid #42b883;
  border-radius: 8px;
}
```

## 📋 コンパイル規約（必読）

変換品質を確保するため、以下の規約に従ってください：

### 🗂️ ファイルとエントリー

- 制御可能なディレクトリのみを `input` に含めることを推奨します
- Vue エントリーファイル（例：`src/main.ts`）を `exclude` に追加することを強く推奨します
- まず小さなディレクトリで検証し、範囲を広げてください

### 📜 Script 規約

- `<script setup>` を優先して使用してください
- `defineProps/defineEmits/defineSlots/defineOptions` はトップレベルでのみ使用可能です
- React Hook に変換される `use*` 呼び出しはトップレベルに配置する必要があります

### 🎨 Template 規約

- サポートされているディレクティブのみを使用し、未知のディレクティブは警告が表示されます
- `v-else` / `v-else-if` は前の条件分岐に隣接している必要があります

### 🎨 Style 規約

- 最初の `style` ブロックのみをサポートし、複数の `style` ブロックは警告が表示されます
- `scoped` と `module` はサポートされていますが、規範に従って使用する必要があります

## 🛠️ CLI コマンド

```bash
# プロジェクトをコンパイル
npx vureact build

# 監視モードコンパイル
npx vureact watch

# ヘルプを表示
npx vureact --help
```

## 📁 プロジェクト構造

```txt
my-project/
├── src/                    # 元の Vue コード
│   ├── components/
│   │   └── Counter.vue
│   └── main.ts
├── .vureact/              # ワークスペース（生成）
│   ├── react-app/         # 生成された React コード
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Counter.tsx
│   │   │   │   └── counter-[hash].css
│   │   │   └── main.tsx
│   │   └── package.json
│   └── cache/             # コンパイルキャッシュ
└── vureact.config.js      # 設定ファイル
```

## 🔗 エコシステム

- **[ランタイム適応パッケージ](https://runtime.vureact.top)**：React 版の Vue コア API を提供します
- **[ルーター適応パッケージ](https://router.vureact.top)**：Vue Router → React Router 変換をサポートします
- **[完全なドキュメント](https://vureact.top)**：詳細な使用ガイドと API ドキュメント

## 🎯 適用シナリオ

### ✅ 推奨使用

- **新規プロジェクト開発**：VuReact 規約に従って Vue スタイルのコンポーネントを直接記述します
- **段階的移行**：ディレクトリやモジュールごとに段階的に移行をサポートします
- **ハイブリッド開発**：Vue と React コンポーネントをプロジェクト内で共存させることができます

### ⚠️ 注意事項

- **制御可能性優先**：現在のバージョンは制御可能なエンジニアリングシナリオを優先してサービスを提供します
- **規約駆動**：明確なコンパイル規約に従う必要があります
- **モダンな構文**：Vue 3 Composition API と `<script setup>` に焦点を当てています

## 🔎 リポジトリサブパッケージ

- [packages/compiler-core](./packages/compiler-core/)
- [packages/runtime-core](./packages/runtime-core/)

## 🤝 貢献

Issue や Pull Request を歓迎します！まずは[貢献ガイド](CONTRIBUTING.zh.md)をお読みください。

## 📄 ライセンス

MIT License © 2025 [Ruihong Zhong (Ryan John)](./LICENSE)

## 🩷 スポンサーシップ

**VuReact の継続的な発展はコミュニティのサポートに依存しています。皆様のスポンサーシップは、プロジェクトのメンテナンス、機能開発、ドキュメントの改善に直接役立てられ、Vue から React へのコンパイルの技術的限界を共に押し広げるのに役立ちます。**

プラットフォーム：[愛発電](https://afdian.com/a/vureact-js/plan)

---

\*\*VuReact - 「Vue から React への完全コンパイル」という長期的な技術的構想の実現可能性を検証し、革新的なコンパイルアー
