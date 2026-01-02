<template>
  <!-- 这是一条注释 -->
  <div class="template-showcase">
    <h1 id="1" :id="dynamicId" class="title" :class="cls">
      {{ pageTitle }}
    </h1>

    <div v-show="show" style="background: red" :style="styles">拥有3个 style 项</div>

    <div v-bind="bindProps">会覆盖所有属性</div>

    <p v-once>这个内容只会渲染一次: {{ initialValue }}</p>

    <img :src="imageUrl" :alt="imageAlt" :class="{ 'active-image': isActive }" />

    <button v-on:click="handleClick(1)" @click.stop="count++" :disabled="isButtonDisabled">
      点击我触发事件
    </button>

    <button @click.capture.once="handleCapture">触发捕获模式事件</button>

    <input type="text" v-model="searchText" placeholder="输入并双向绑定" />
    <input type="text" v-model.lazy="searchText" placeholder="lazy" />
    <input type="text" v-model.trim="searchText" placeholder="trim" />
    <input type="text" v-model.number="searchText" placeholder="number" />
    <input type="text" v-model.lazy.trim.number="searchText" placeholder="lazy + trim + number" />
    <input type="text" @keydown.enter.prevent="handleEnter" />

    <MyComp v-model="value">在组件上使用 v-model</MyComp>

    <p>v-model 的值: {{ searchText }}</p>

    <div v-show="isLoading">加载中... (v-show)</div>

    <span is="div"></span>
    <div :is="MyChildComponent">动态组件 is</div>

    <div v-memo="[value]">缓存优化节点</div>

    <div v-once>只渲染一次</div>

    <div v-if="userType === 'admin'">管理员权限内容</div>
    <div v-else-if="userType === 'editor'">编辑者权限内容</div>
    <div v-else>普通用户或未登录</div>

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

    <MyChildComponent
      v-memo="[currentUserId]"
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
      <template #header="data">
        <header>header 插槽</header>
      </template>

      <section>默认插槽</section>

      <template #footer>
        <footer>footer插槽</footer>
      </template>
    </MyChildComponent>
  </div>

  <div>
    <header>
      <slot name="header" title="title" :count="1"></slot>
    </header>
    <main>
      <div>
        <slot></slot>
      </div>
    </main>
    <footer>
      <slot name="footer" :get-count="() => 1"></slot>
    </footer>
  </div>

  <button @click="__emit('click', e)">Emit click</button>
</template>

<script></script>

<style lang="less"></style>
