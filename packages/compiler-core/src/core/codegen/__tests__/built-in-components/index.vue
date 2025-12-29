<template>
  <KeepAlive>
    <component :is="view"></component>
  </KeepAlive>

  <KeepAlive>
    <comp-a v-if="a > 1"></comp-a>
    <comp-b v-else></comp-b>
  </KeepAlive>

  <KeepAlive include="a,b"></KeepAlive>

  <KeepAlive :include="/a|b/"></KeepAlive>

  <KeepAlive :include="['a', 'b']"></KeepAlive>

  <KeepAlive :max="10"></KeepAlive>

  <Suspense
    :timeout="200"
    @fallback="handleFallback"
    @pending="handlePending"
    @resolve="handleResolve"
  >
  </Suspense>

  <Transition>
    <div>...</div>
  </Transition>

  <Transition name="fade">
    <div v-if="ok">toggled content</div>
  </Transition>

  <Transition>
    <div v-show="show">toggled content</div>
  </Transition>

  <Transition>
    <div v-if="a">one</div>
    <div v-else-if="b">two</div>
    <div v-else="c">three</div>
  </Transition>

  <Transition
    enter-active-class="abc"
    leave-active-class="efg"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
    @after-enter="onAfterEnter"
    @before-appear="onBeforeAppear"
    @appear="onAppear"
    @after-appear="onAfterAppear"
    @before-leave="onBeforeLeave"
    @leave="onLeave"
    @after-leave="onAfterLeave"
    @enter-cancelled="onEnterCancelled"
    @leave-cancelled="onLeaveCancelled"
  >
    <div v-if="ok">toggled content</div>
  </Transition>

  <TransitionGroup tag="ul" name="slide" move-class="slide-move">
    <li v-for="item in items" :key="item.id">
      {{ item.text }}
    </li>
  </TransitionGroup>
</template>

<script></script>
