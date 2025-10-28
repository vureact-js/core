<!-- tests/fixtures/TemplateTest.vue -->
<template>
  <div>
    <!-- v-if/v-else -->
    <div v-if="condition">Third If Content</div>
    <div v-else="condition">Third Else Content</div>

    <!-- v-if/v-else-if 链 / Conditional chain -->
    <div v-if="condition">Second If Content</div>
    <div v-else-if="condition2">Second If ElseIf Content</div>

    <!-- v-if/v-else-if/v-else 链 / Conditional chain -->
    <div v-if="condition">If Content</div>
    <div v-else-if="condition2">ElseIf Content</div>
    <div v-else>Else Content</div>

    <!-- v-for / Loop -->
    <ul>
      <li v-for="item in items" :key="item.id">{{ item.name }}</li>
    </ul>

    <!-- v-for + v-if / Loop -->
    <ul>
      <li v-if="condition" v-for="item in items" :key="item.id">
        {{ item.name }}
      </li>
    </ul>

    <!-- v-slot: 默认、具名、作用域、动态、嵌套解构 / Slots -->
    <MyComponent>
      <!-- 默认插槽 / Default slot -->
      <template v-slot:default>Default Slot</template>
      <!-- 具名插槽 / Named slot -->
      <template v-slot:header>Header Slot</template>
      <!-- 作用域插槽 / Scoped slot -->
      <template v-slot:content="props">Content {{ props.value }}</template>
      <!-- 动态插槽 / Dynamic slot -->
      <template v-slot:[dynamicSlot]="data">Dynamic {{ data.info }}</template>
      <!-- 嵌套解构 / Nested destructuring -->
      <template v-slot:footer="{ key: [a, b], obj: { sub: name } }">
        Footer {{ a }} {{ b }} {{ name }}
      </template>
    </MyComponent>

    <!-- v-on: 带修饰符 / Event with modifiers -->
    <button v-on:click.stop.prevent="handleClick">Click Me</button>
    <input v-on:keydown.enter="submit" placeholder="Enter to submit" />
    <div v-on:click.once.capture="onceClick">Once Click</div>
    <div v-on:mouseup.left.self="leftClick">Left Click Self</div>

    <!-- v-bind: 静态、动态 / Binding -->
    <div :class="dynamicClass" :[dynamicAttr]="value">Bound Div</div>

    <!-- v-model -->
    <input v-model="inputValue" />
    <input v-model="inputValue" type="checkbox" />
    <select v-model="inputValue" multiple></select>

    <!-- v-model modifiers -->
    <input v-model.number="inputValue" type="text" />

    <!-- v-model prop name -->
    <MyInput v-model:title="inputValue" />
    <MyInput v-model:[dynamicAttr]="inputValue" />

    <!-- v-show / Conditional display -->
    <div v-show="isVisible">Visible Div</div>

    <!-- v-html / Raw HTML -->
    <div v-html="rawHtml"></div>

    <!-- v-text / Text content -->
    <div v-text="textContent"></div>

    <!-- v-pre -->
    <div v-skip v-if="condition"><span>Static</span> {{ rawContent }}</div>

    <!-- v-cloak / Hide until compiled -->
    <div v-cloak>Cloaked Div</div>

    <!-- v-once -->
    <div v-once>Once</div>

    <!-- v-memo -->
    <div v-memo="value"></div>
    <div v-memo="[condition, condition2]"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const condition = ref(true);
const condition2 = ref(false);
const items = ref([
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
]);
const dynamicSlot = ref('dynamic');
const dynamicClass = ref('active');
const dynamicAttr = ref('data-test');
const value = ref('test-value');
const inputValue = ref('');
const isVisible = ref(true);
const rawHtml = ref('<span>Raw HTML</span>');
const textContent = ref('Text Content');
const rawContent = ref('Raw {{ content }}');

const handleClick = () => console.log('Clicked');
const submit = () => console.log('Submitted');
const onceClick = () => console.log('Once Click');
const leftClick = () => console.log('Left Click');
</script>

<style scoped>
[v-cloak] {
  display: none;
}
</style>
