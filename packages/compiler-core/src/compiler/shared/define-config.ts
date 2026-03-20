import { CompilerOptions as UserConfig } from './types';

/**
 * Type helper to make it easier to use vureact.config.js
 * accepts a direct {@link UserConfig} object, or a function that returns it.
 */
export function defineConfig(config: UserConfig): UserConfig;
export function defineConfig(config: UserConfigFnObject): UserConfig;
export function defineConfig(config: UserConfig | UserConfigFnObject): UserConfig {
  return typeof config === 'function' ? config() : config;
}

export type UserConfigFnObject = () => UserConfig;
