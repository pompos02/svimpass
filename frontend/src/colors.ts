// Rose Pine Color Palette
// Based on https://rosepinetheme.com/palette

export const rosePine = {
  // Base colors
  base: '#191724',
  surface: '#1f1d2e', 
  overlay: '#26233a',
  muted: '#6e6a86',
  subtle: '#908caa',
  text: '#e0def4',
  
  // Highlight colors
  love: '#eb6f92',
  gold: '#f6c177',
  rose: '#ebbcba',
  pine: '#31748f',
  foam: '#9ccfd8',
  iris: '#c4a7e7',
  
  // Additional surface variations for better UI depth
  surfaceHighlight: '#2a273f',
  border: '#403d52',
  borderHighlight: '#524f67',
  
  // Semantic colors derived from the palette
  primary: '#c4a7e7',      // iris
  secondary: '#9ccfd8',    // foam  
  accent: '#f6c177',       // gold
  success: '#9ccfd8',      // foam
  warning: '#f6c177',      // gold
  error: '#eb6f92',        // love
  info: '#31748f',         // pine
  
  // Alpha variations for overlays and transparency
  alpha: {
    base10: 'rgba(25, 23, 36, 0.1)',
    base20: 'rgba(25, 23, 36, 0.2)',
    base50: 'rgba(25, 23, 36, 0.5)',
    overlay10: 'rgba(38, 35, 58, 0.1)',
    overlay20: 'rgba(38, 35, 58, 0.2)',
    text10: 'rgba(224, 222, 244, 0.1)',
    text20: 'rgba(224, 222, 244, 0.2)',
    text60: 'rgba(224, 222, 244, 0.6)',
    text80: 'rgba(224, 222, 244, 0.8)',
    iris10: 'rgba(196, 167, 231, 0.1)',
    iris20: 'rgba(196, 167, 231, 0.2)',
    iris30: 'rgba(196, 167, 231, 0.3)',
    foam10: 'rgba(156, 207, 216, 0.1)',
    foam20: 'rgba(156, 207, 216, 0.2)',
    foam30: 'rgba(156, 207, 216, 0.3)',
    gold10: 'rgba(246, 193, 119, 0.1)',
    gold20: 'rgba(246, 193, 119, 0.2)',
    gold30: 'rgba(246, 193, 119, 0.3)',
    love10: 'rgba(235, 111, 146, 0.1)',
    love20: 'rgba(235, 111, 146, 0.2)',
    love30: 'rgba(235, 111, 146, 0.3)',
    muted10: 'rgba(110, 106, 134, 0.1)',
  },
} as const;

// CSS Custom Properties for easy usage in CSS
export const rosePineCSSVars = {
  '--rp-base': rosePine.base,
  '--rp-surface': rosePine.surface,
  '--rp-overlay': rosePine.overlay,
  '--rp-muted': rosePine.muted,
  '--rp-subtle': rosePine.subtle,
  '--rp-text': rosePine.text,
  '--rp-love': rosePine.love,
  '--rp-gold': rosePine.gold,
  '--rp-rose': rosePine.rose,
  '--rp-pine': rosePine.pine,
  '--rp-foam': rosePine.foam,
  '--rp-iris': rosePine.iris,
  '--rp-surface-highlight': rosePine.surfaceHighlight,
  '--rp-border': rosePine.border,
  '--rp-border-highlight': rosePine.borderHighlight,
  '--rp-primary': rosePine.primary,
  '--rp-secondary': rosePine.secondary,
  '--rp-accent': rosePine.accent,
  '--rp-success': rosePine.success,
  '--rp-warning': rosePine.warning,
  '--rp-error': rosePine.error,
  '--rp-info': rosePine.info,
} as const;

// Type for the color palette
export type RosePineColors = typeof rosePine;
export type RosePineColorKey = keyof typeof rosePine;