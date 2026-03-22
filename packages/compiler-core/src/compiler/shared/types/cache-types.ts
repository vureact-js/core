import { ScriptUnit, SFCUnit, StyleUnit } from './compilation-unit';

export type LoadedCache<T = CacheMeta> = {
  key: CacheKey;
  target: T[];
  source: CacheList;
};

export type CacheMeta = Vue2ReactCacheMeta | FileCacheMeta;

export enum CacheKey {
  SFC = 'sfc',
  SCRIPT = 'script',
  STYLE = 'style',
  ASSET = 'copied',
}

export interface CacheList {
  [CacheKey.SFC]: Vue2ReactCacheMeta[];
  [CacheKey.SCRIPT]: ScriptCacheMeta[];
  [CacheKey.STYLE]: StyleCacheMeta[];
  [CacheKey.ASSET]: FileCacheMeta[];
}

export type Vue2ReactCacheMeta = Omit<SFCUnit, 'source'>;
export type ScriptCacheMeta = Omit<ScriptUnit, 'source'>;
export type StyleCacheMeta = Omit<StyleUnit, 'source'>;

export interface FileCacheMeta extends FileMeta {
  file: string;
}

export interface FileMeta {
  fileSize: number; // 文件大小
  mtime: number; // 修改时间
  hash?: string; // 内容哈希
}

export interface CacheCheckResult {
  shouldCompile: boolean;
  hash?: string;
}
