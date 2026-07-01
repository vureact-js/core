import { useMemo, memo } from 'react';
interface Props {
  msg?: string;
  count?: number;
  labels: string[];
}
export type ICompProps = Props;
const Input = memo((vrProps: ICompProps) => {
  /* from withDefaults */
  const props = useMemo<Readonly<Props>>(() => ({
    ...vrProps,
    msg: vrProps.msg ?? 'hello',
    count: vrProps.count ?? 42,
    labels: vrProps.labels ?? ['one', 'two']
  }), [vrProps]);
  ;
  return <><div>{props.msg}{props.count}</div><ul>{props.labels.map(value => <li key={value}>{value}</li>)}</ul></>;
});
export default Input;