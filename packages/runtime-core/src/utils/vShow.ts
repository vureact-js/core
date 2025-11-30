/**
 * vShow - Runtime helper for Vue v-show directive in React JSX
 * @param state
 * @returns Object that can be spread as JSX props
 */
export function vShow(state: boolean) {
  return { display: state ? '' : 'none' };
}
