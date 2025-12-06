<template>
  <div class="template-showcase" v-memo="[value1, value2]">
    <h1 id="1" :id="dynamicId" class="title" :class="cls">
      {{ pageTitle }}
    </h1>

    <div v-show="show" style="background: red" :style="{ color: 'red' }">拥有3个 style 项</div>

    <p v-once>这个内容只会渲染一次: {{ initialValue }}</p>

    <img :src="imageUrl" :alt="imageAlt" :class="{ 'active-image': isActive }" />

    <button v-on:click="handleClick(1)" @click.stop="count++" :disabled="isButtonDisabled">
      点击我触发事件
    </button>

    <input type="text" v-model="searchText" placeholder="输入并双向绑定" />
    <input type="text" @keydown.enter.prevent="handleEnter" />

    <p>v-model 的值: {{ searchText }}</p>

    <div v-if="userType === 'admin'">管理员权限内容</div>
    <div v-else-if="userType === 'editor'">编辑者权限内容</div>
    <div v-else>普通用户或未登录</div>

    <div v-show="isLoading">加载中... (v-show)</div>

    <h2>待办事项列表</h2>
    <ul>
      <li v-for="(todo, index) in todoList" :key="todo.id">
        {{ index + 1 }}. [{{ todo.status }}] - {{ todo.text }}
      </li>
    </ul>

    <div v-for="(value, key, index) in userInfo" :key="key">
      {{ index + 1 }}: {{ key }} 是 {{ value }}
    </div>

    <div v-text="textContent"></div>

    <div v-html="rawHtmlContent"></div>

    <div v-pre>{{ 这段内容将作为纯文本显示，不会被 Vue 编译 }}</div>

    <MyChildComponent
      :user-id="currentUserId"
      static-text="这是一个静态 Prop"
      @child-event="handleChildEvent"
    />

    <MyChildComponent data-tracking-id="12345" error-level="critical" />

    <div :class="{ 'text-red': hasError, 'text-large': isLarge }">类绑定（对象语法）</div>

    <div style="display: block" :style="{ color: textColor, fontSize: fontSize + 'px' }">
      样式绑定（对象语法）
    </div>

    <input ref="inputRef" type="text" placeholder="用于获取 DOM 引用" />

    <MyChildComponent>
      <template #header="data">header插槽</template>
      <p>默认插槽</p>
      <template #footer>footer插槽</template>
    </MyChildComponent>

    <div v-bind="{ class: 'cls', style: { display: 'none' } }">v-bind={...}</div>
  </div>
</template>

<script></script>

<style lang="less"></style>
