import { CacheKey, FileMeta } from './cache-types';

export type CompilationUnit = SFCUnit | ScriptUnit | StyleUnit;

// SFC 编译单位
export interface SFCUnit extends BaseUnit {
  type: CacheKey.SFC;
  output?: {
    jsx: OutputItem;
    css: Partial<OutputItem>;
  };
}

// 脚本编译单位
export interface ScriptUnit extends BaseUnit {
  type: CacheKey.SCRIPT;
  output?: {
    script: OutputItem;
  };
}

// 样式编译单位
export interface StyleUnit extends Omit<BaseUnit, 'hasRoute'> {
  type: CacheKey.STYLE;
  output?: {
    style: OutputItem;
  };
}

// 附属资产拷贝单位
export interface AssetUnit extends Omit<BaseUnit, 'fileId' | 'source' | 'hasRoute'> {
  type: CacheKey.ASSET;
}

// 基础通用编译单位
export interface BaseUnit extends FileMeta {
  file: string; // 原始文件路径
  fileId: string; // 文件id
  source: string; // 源代码
  hasRoute?: boolean; // 是否使用了路由，后续作为是否注入路由包的依据
}

interface OutputItem {
  file: string;
  code: string;
}
