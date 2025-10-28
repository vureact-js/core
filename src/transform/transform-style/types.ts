import type { StyleInfo as ParsedStyleInfo } from '@parse/types';

interface StyleInfo extends ParsedStyleInfo {
  transformedContent?: string;
}
export type { StyleInfo };
