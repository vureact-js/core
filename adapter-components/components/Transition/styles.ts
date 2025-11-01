// 过渡样式工具函数

/**
 * 预定义的过渡名称
 */
export const transitionNames = {
  fade: 'fade',
  scale: 'scale',
  slide: 'slide',
  slideUp: 'slide-up',
  slideDown: 'slide-down',
  slideLeft: 'slide-left',
  slideRight: 'slide-right',
  bounce: 'bounce',
  zoom: 'zoom',
  flip: 'flip',
  fadeScale: 'fade-scale',
  list: 'list',
  staggered: 'staggered',
};

/**
 * 过渡持续时间选项
 */
export const transitionDurations = {
  fast: 'duration-100',
  normal: 'duration-300',
  slow: 'duration-500',
  slower: 'duration-1000',
};

/**
 * 缓动函数选项
 */
export const easingFunctions = {
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  linear: 'linear',
};

export function getTransitionClassNames(
  name: string = 'ed',
  options: {
    duration?: keyof typeof transitionDurations;
    easing?: keyof typeof easingFunctions;
  } = {},
): string {
  const classes = [name];

  if (options.duration) {
    classes.push(transitionDurations[options.duration]);
  }

  if (options.easing) {
    classes.push(easingFunctions[options.easing]);
  }

  return classes.join(' ');
}

/**
 * 预定义的过渡配置
 */
export const transitionPresets = {
  fade: () => getTransitionClassNames('fade'),
  fadeScale: () => getTransitionClassNames('fade-scale'),
  slide: () => getTransitionClassNames('slide'),
  slideUp: () => getTransitionClassNames('slide-up'),
  slideDown: () => getTransitionClassNames('slide-down'),
  slideLeft: () => getTransitionClassNames('slide-left'),
  slideRight: () => getTransitionClassNames('slide-right'),
  bounce: () => getTransitionClassNames('bounce'),
  zoom: () => getTransitionClassNames('zoom'),
  flip: () => getTransitionClassNames('flip'),
};
