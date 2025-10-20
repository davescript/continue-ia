export const createStyle = (styleProps = {}) => {
  if (!styleProps || typeof styleProps !== 'object') return undefined;
  const entries = Object.entries(styleProps).filter(([, value]) => value !== undefined && value !== null && value !== '');
  if (!entries.length) return undefined;
  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};
