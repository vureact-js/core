export const enum RuntimeHelperTypes {
  NONE = 0,
  UTILS = 1,
  COMPONENT = 2,
}

export const enum RuntimeUtils {
  V_ON = 0,
  V_BIND = 1,
  V_SHOW = 2,
  V_MODEL = 3,
}

export const enum RuntimeComponents {
  MEMO = 0,
  ONCE = 1,
  IF_GROUP = 3,
  IF = 4,
  ELSE = 5,
  ELSE_IF = 6,
}

export const enum ReactVue3Components {
  KEEP_ALIVE = 0,
  SUSPENSE = 1,
  TRANSITION_GROUP = 2,
  TRANSITION = 3,
  TELEPORT = 4,
  COMPONENT = 5,
}

export const enum ReactVue3Hooks {
  USE_BEFORE_MOUNT = 0,
  // todo
}
