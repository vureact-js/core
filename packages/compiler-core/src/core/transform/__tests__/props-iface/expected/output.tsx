import { type ReactNode, memo } from 'react';
interface Props<T> {
  foo?: string;
  bar: number;
  dj: T;
}
// const $$props = defineProps({
//   foo: String,
//   bar: {
//     type: Number,
//     required: true,
//   },
// });

// const $$props = defineProps<{
//   foo?: string;
//   bar: number;
// }>();

// const $$props = defineProps<Props>();

// const $$props = defineProps<Props<any>>();

// const $$props = defineProps<Props & { x: string }>();

// const $$props = defineProps<Props | ({ a: string } | { b: number })>();

interface Emits {
  change: string;
  onUpdate?: (value: number) => number;
}
// const $$emits = defineEmits<{
//   change: [];
//   update: [value: number];
// }>();

// const $$emits = defineEmits<{ (e: 'change'): void; (e: 'update', value: number): number }>();

// const $$emits = defineEmits<Partial<{ (e: 'change'): void;}>>();

// const $$emits = defineEmits<Emits>();

interface Slots {
  default?(): any;
  header(props: {
    title: string;
  }): any;
  footer(props: {
    count: number;
  }): any;
}
export type IDemoProps = {
  foo?: any;
  bar?: any;
} & {
  onChange?: (...args: any[]) => any;
  onUpdate?: (...args: any[]) => any;
  onUpdateName?: (...args: any[]) => any;
} & {
  children?: ReactNode;
  header: (props: {
    title: string;
  }) => ReactNode;
  footer: (props: {
    count: number;
  }) => ReactNode;
};
const Demo = memo(($$props: IDemoProps) => {
  return <>{$$props.header?.({
      'title': 'title'
    })}{$$props.children}{$$props.footer?.({
      'count': 1
    })}</>;
});
export default Demo;