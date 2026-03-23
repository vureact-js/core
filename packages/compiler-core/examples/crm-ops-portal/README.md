# CRM Operations Portal Admin Backend

English | [简体中文](./README.zh.md)

This sample is a standard `vue-ts` style project, designed to verify the closed-loop conversion of regular Vite + Vue3 + Vue Router projects.

## Coverage Capabilities

- Vite + Vue3 + Vue Router real project structure and dependency analysis
- Full conversion of SFC (template/script/style) with scoped style support
- `defineProps` / `defineEmits` converted to TSX component interfaces compliant with React specifications
- `@vureact/runtime-core` provides runtime adaptation for Vue APIs
- Full adaptation of `<router-link>` & `<router-view>` components and routing APIs
- `v-model` syntax conversion (supports custom components and multi-parameter scenarios)
- Complete conversion of named slots, scoped slots, and default slots
- `provide/inject` dependency injection mechanism and runtime Provider adaptation
- Comprehensive coverage of template syntax including event handling, directives, conditional rendering, and list rendering
- Conversion of Sass/Less style syntax to CSS syntax
- Conversion of emit('event') calls to component props method calls
- Collaboration center scenario coverage: notifications + approvals + cross-page business linkage

## Business Workflow Highlights

- High-value lead linkage: when lead amount reaches 100+, an approval is generated automatically.
- Task blockage linkage: when a task enters blocked status, a collaboration notification is created.
- Dashboard collaboration summary: unread notifications / pending approvals / handled today.
- End-to-end flow: Leads/Tasks action -> Notification/Approval center -> Dashboard metrics update.

## Getting Started

### Step 1: Run VuReact Build

Run the commands in the root directory of `crm-ops-portal`:

- Install dependencies

Note: If local testing is required, you can directly execute the build command without installing dependencies, but ensure all dependencies of the `core` project are installed.

```bash
npm install
```

- Execute compilation

```bash
# Method 1: VuReact full compilation
npm run vr:build

# Method 2: VuReact incremental compilation (watch mode)
npm run vr:watch
```

### Step 2: Run React App

- Enter the workspace build output directory

```bash
cd .vureact/react-app/
```

- Install dependencies

```bash
npm install
```

- Modify the routing entry configuration (important)

See: [route-setup-notes.md](../../templates/route-setup-notes.zh.md)

- Start the Vite dev server and visit, e.g., <http://localhost:5173>

```bash
npm run dev
```
