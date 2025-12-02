export const camelCase = (str: string): string => {
  if (str.includes('-')) {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  return str;
};
