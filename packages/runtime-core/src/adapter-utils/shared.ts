export const camelCase = (str: string): string => {
  if (str.includes('-')) {
    return str.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  }

  return str;
};

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
