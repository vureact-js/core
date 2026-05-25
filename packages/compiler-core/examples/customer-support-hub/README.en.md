# Customer Support Hub

`Customer Support Hub` is a realistic multi-channel customer support sample used to stress-test VuReact in a business-style admin application.

English | [简体中文](./README.md)

## Stack

- Vue 3
- Vue Router 4
- Ant Design React 6
- Zustand
- Sass
- dayjs
- fuse.js

## Business Scope

The sample now covers the main workflow of a mid-sized support collaboration system:

- Login and admin shell
- Dashboard
- Conversation Center
- Tickets List
- Ticket Detail
- Customers
- Agents
- Knowledge Base
- SLA Board
- Settings

## Conversion Coverage

This example intentionally pushes compiler-sensitive Vue patterns inside real pages instead of isolated demos:

- layered conditionals: `v-if / v-else-if / v-else / v-show`
- nested lists with multiple `v-for`
- named slots and scoped slots
- dynamic components via `:is`
- `defineProps / defineEmits / defineExpose`
- `provide / inject`
- `watch / watchEffect / computed`
- multi-`v-model` event mapping
- template literals plus object / array literal props

## Build React Output with the Local Compiler

When you are validating compiler-core changes inside this repo, prefer the local CLI:

```bash
node ..\..\bin\vureact.js build
```

Generated output:

```bash
.vureact/react-app
```

## Run the React Output

```bash
cd .vureact/react-app
npm install
npm run dev
```

## Recommended Verification

1. Dashboard shows ticket KPIs, channel distribution, pending conversations, and hotspot customers.
2. Conversation Center supports filtering, queue switching, bulk assignment, convert-to-ticket, merge, pending state, and draft saving.
3. Ticket Detail shows linked conversations, escalation records, internal notes, and timeline updates.
4. Customers, Agents, and SLA Board have stable mock data on first load.

## Related Files

- [vureact.config.ts](./vureact.config.ts)
