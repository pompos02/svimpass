import { rosePineCSSVars } from '../colors';

export const injectRosePineColors = (): void => {
  const root = document.documentElement;
  
  Object.entries(rosePineCSSVars).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
};

export const removeRosePineColors = (): void => {
  const root = document.documentElement;
  
  Object.keys(rosePineCSSVars).forEach((property) => {
    root.style.removeProperty(property);
  });
};