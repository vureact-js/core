<template>
  <div class="my-class">日常用法</div>

  <div class="parent">
    <div class="child">嵌套选择器子元素</div>
    <div class="direct-child">直接子元素</div>
    <div class="sibling">兄弟元素</div>
  </div>

  <div class="component">复杂写法组件</div>
  <div class="component active">激活状态组件</div>
  <div class="component">
    <div class="global-class">全局类</div>
    <div class="nested-component">深层嵌套组件</div>
  </div>

  <p></p>
  <input type="checkbox" />
</template>

<style scoped>
/* 日常用法 */
.my-class {
  color: red;
  font-size: 16px;
}

/* 嵌套选择器 */
.parent {
  .child {
    background: blue;
  }

  > .direct-child {
    border: 1px solid;
  }

  & .sibling {
    margin: 10px;
  }
}

/* 复杂写法 */
.component {
  &:hover {
    opacity: 0.8;
  }

  &.active {
    font-weight: bold;
  }

  :global(.global-class) {
    color: green;
  }

  :deep(.nested-component) {
    background: yellow;
  }

  :slotted(.slotted-content) {
    display: flex;
  }

  &:not(:first-child) {
    margin-top: 20px;
  }

  &:nth-child(2n) {
    background: #f0f0f0;
  }

  &::before {
    content: '→';
  }

  &::placeholder {
    color: gray;
  }
}

input[type='checkbox'] {
  padding: 6px;
}
</style>
