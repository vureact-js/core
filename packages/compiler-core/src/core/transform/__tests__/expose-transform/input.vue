<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  title?: string;
  initialCount?: number;
}>();

const count = ref(props.initialCount || 0);
const increment = () => count.value++;
const reset = () => (count.value = 0);

defineExpose({
  count,
  increment,
  reset,
});
</script>
