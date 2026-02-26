<template>
  <!-- 示例1: 基础用法 -->
  <input v-model="text" placeholder="输入文本..." />

  <!-- 示例2: 修饰符 .lazy -->
  <input v-model.lazy="lazyText" placeholder="输入后按回车或失去焦点..." />

  <!-- 示例3: 修饰符 .number -->
  <input v-model.number="numberValue" type="number" placeholder="输入数字..." />

  <!-- 示例4: 修饰符 .trim -->
  <input v-model.trim="trimmedText" placeholder="输入带空格的文本..." />

  <!-- 示例5: 多行文本 textarea -->
  <textarea v-model="message" placeholder="输入多行文本..."></textarea>

  <!-- 示例6: 复选框 -->
  <input type="checkbox" id="checkbox" v-model="checked" />

  <!-- 示例8: 单选框 -->
  <input type="radio" id="male" value="男" v-model="gender" />

  <!-- 示例9: 下拉选择框 -->
  <select v-model="selectedOption"></select>

  <!-- 示例10: 多选下拉框 -->
  <select v-model="multipleOptions" multiple></select>

  <ChildInput v-model:value="iam" />
</template>

<script setup></script>
