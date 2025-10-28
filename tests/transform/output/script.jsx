import { computed, nextTick, onBeforeUpdate, onMounted, onUnmounted, onUpdated, readonly, ref, watch, watchEffect } from 'vue';
const [count, setCount] = useState(0);
const doubled = useMemo(() => count * 2, [count]);
const [state, setState] = useImmer({
  nested: {
    value: 1
  }
});
const [arr, setArr] = useImmer([1]);
const readObj = useMemo(() => Object.freeze({
  name: 'jack'
}), []);
// nextTick
useLayoutEffect(() => {
  console.log('nextTick');
}, []);
// onMounted
useMount(() => console.log('mounted'));
// onMounted
useAsync(async () => {
  console.log('async onMounted');
}, []);
// onUnmounted
useUnmount(() => console.log('unmounted'));
// onBeforeUpdate
useLayoutEffect(() => {});
// onUpdated
useUpdateEffect(() => {}, []);
// onUpdated
useAsync(async () => {
  if (IS_FIRST_MOUNT) return;
  console.log('async onUpdated');
}, []);
// watchEffect
useEffect(() => {
  setCount(count + 1);
  return () => {
    setCount(0);
  };
}, [count]);
// watch
useUpdateEffect(() => {
  console.log(state.nested.value);
}, []);
// watch
useUpdateEffect(() => {
  return () => console.log(count + doubled);
}, [count, doubled]);
// watch
useEffectOnce(() => {
  console.log('watch once');
});
// watch
useEffect(() => {
  console.log('watch immediate call');
}, []);
// watch
useDeepCompareEffect(() => {
  if (IS_FIRST_MOUNT) return;
  console.log('deep watch');
}, []);
const handleClick = useCallback(function () {
  count;
}, [count]);
const callClick = useCallback(function () {
  handleClick();
  console.log('Collect handleClick');
}, [handleClick]);
setCount(3);
setCount(doubled);
setCount(count + 1);
setCount(count - 1);
setArr(arr => {
  arr.push(2);
});
setArr(arr => {
  arr.pop();
});
setArr(arr => {
  arr.length = 0;
});
setState(state => {
  state.nested.value = 3;
});
setState(state => {
  state.nested = {
    value: 8
  };
});