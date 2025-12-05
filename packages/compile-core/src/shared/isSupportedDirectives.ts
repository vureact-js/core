import { SupportedDirectives } from '@consts/supportedDirectives';

export const isSupportedDirectives = (rawName: string = ''): boolean => {
  if (!rawName.startsWith('v-')) return true;
  return SupportedDirectives.some((dir) => rawName.match(dir) !== null);
};
