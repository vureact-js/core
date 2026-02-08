<template>
  <!-- 随意写的测试用例，
   出现 TS 类型错误提示是预料之中的，
   因为我们的关注点是验证语义映射是否正确。-->

  <div class="template-showcase" v-memo="[value1, value2]">
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

    <input type="text" v-model="user.name" placeholder="输入并双向绑定" />
    <input type="text" v-model.lazy="searchText" placeholder="lazy" />
    <input type="text" v-model.trim="searchText" placeholder="trim" />
    <input type="text" v-model.number="searchText" placeholder="number" />
    <input type="text" v-model.lazy.trim.number="searchText" placeholder="lazy + trim + number" />
    <input type="text" @keydown.enter.prevent="handleEnter" />

    <p>v-model 的值: {{ searchText }}</p>

    <div v-show="isLoading">加载中... (v-show)</div>

    <span is="div"></span>
    <div :is="MyChildComponent">动态组件 is</div>

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

<script setup lang="ts">
// @ts-nocheck
import { computed, defineAsyncComponent, inject, provide, reactive, ref } from 'vue';
import Count from 'count.vue';

interface Props {}

type A = {};

enum B {}

const $$props = defineProps(['foo', 'bar']);

// const $$props = defineProps<Props>();

// const $$props = defineProps<{
//   foo?: string;
//   bar: number;
// }>();

// const $$props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

const $$emits = defineEmits(['change', 'update', 'update:name']);

// const $$emits = defineEmits<{
//   change: [];
//   update: [value: number];
// }>();

// const $$emits = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();

const AdminPage = defineAsyncComponent(() => import('./components/AdminPageComponent.vue'));

const AsyncComp = defineAsyncComponent({
  loader: () => import('./Foo.vue'),
});

provide('message', 'hello');

const myInjectionKey = Symbol();

provide(myInjectionKey, {});

const message = inject<string>('message');

const myInjection = inject<object>(myInjectionKey);

const factory = inject('count', () => Date.now(), true);

const MAX_VALUE = 999;

const person = {
  name: 'k',
  age: 1,
};

const LIST = [1, MAX_VALUE, person.age];

const inputRef = ref<HTMLInputElement>();

const count = ref<number | string>(1);

const state = reactive({
  foo: 1,
  bar: 2,
  list: LIST,
});

const value = readonly(1);

const double = computed(() => count.value + state?.foo);

const stateRef = toRef(state, 'foo');

const numRef = toRef(1);

const stateRefs = toRefs(state);

const 函数 = (参数: number): number => {
  let 值 = 0;

  const 嵌套函数 = () => {
    值 += count.value + 参数;
  };

  嵌套函数();
  return 值;
};

const fn2 = function (count) {
  state.foo = count + stateRefs.bar;
  state.list.push({
    k: Date.now().toString(),
    v: state.foo,
  });
};

function fn3() {
  count.value++;
}

onBeforeMount(() => {
  console.log('beforeMount');
});

onMounted(async () => {
  console.log('mounted');
});

onBeforeUnmount(() => {
  console.log('beforeUnmount');
});

onUnmounted(function () {
  console.log('unmounted');
});

onBeforeUpdate(() => {
  state.foo = 0;
  console.log('beforeUpdate');
});

const updated = () => {
  count.value++;
  fn2();
  console.log('updated');
};

onUpdated(updated);

const updatedWithNoDeps = () => {
  console.log('updated');
};

onUpdated(updatedWithNoDeps);

watchEffect(() => {
  if (state.foo >= 10) {
    fn2();
  }
  state.foo++;
  console.log('watchEffect');
});

watchSyncEffect(() => {
  state.foo++;
  console.log('watchSyncEffect');
});

watchEffect((onCleanup) => {
  count.value;
  onCleanup(() => {
    console.log('watchEffect cleanup');
  });
});

watch(count.value, () => {
  console.log(count.value);
});

watch(
  state,
  (newVal, oldVal) => {
    console.log(newVal, oldVal);
  },
  { deep: true },
);

watch(
  () => count.value,
  () => {
    console.log(count.value);
  },
  { once: true },
);

const stop = watch(
  () => [count.value, state],
  (newVal) => {
    console.log(newVal);
  },
);
</script>

<style lang="less" scoped module>
.template-showcase {
  padding: 20px;
  border: 1px solid #42b883;
  border-radius: 8px;
  text-align: center;
  max-width: 400px;
  margin: 20px auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  .title,
  .footer {
    padding: 12px;
    color: #35495e;
    margin-bottom: 10px;
  }
}
</style>
