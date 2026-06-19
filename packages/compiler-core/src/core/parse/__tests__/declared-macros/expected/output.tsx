import { memo } from 'react';
// const props = defineProps(['foo', 'bar']);

// const props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

interface Emits {
  change: string;
  onUpdate?: (value: number) => number;
}
export type IAvCardProps = {
  foo?: string;
  bar: number;
} & Emits;
const AvCard = memo((props: IAvCardProps) => {
  return null;
});
export default AvCard;