type VShowObject = { display: string };

export function vShow(state: boolean): VShowObject {
  return { display: state ? '' : 'none' };
}
