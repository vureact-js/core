import { VUE_DIR } from '@constants/vue';

export const Structural = [
  VUE_DIR.if,
  VUE_DIR.elseIf,
  VUE_DIR.else,
  VUE_DIR.for,
  VUE_DIR.once,
  VUE_DIR.memo,
  VUE_DIR.text,
];

export const Conditionals = [VUE_DIR.if, VUE_DIR.elseIf, VUE_DIR.else];

export const RequiresBabelExp = [
  VUE_DIR.bind,
  VUE_DIR.on,
  VUE_DIR.model,
  VUE_DIR.show,
  VUE_DIR.html,
  VUE_DIR.text,
  VUE_DIR.if,
  VUE_DIR.elseIf,
];
