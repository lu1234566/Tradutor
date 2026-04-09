
export type DensityMode = 'compact' | 'comfortable' | 'reading';
export type NavigationMode = 'guided' | 'panel';

export interface ViewPreferences {
  density: DensityMode;
  navigationMode: NavigationMode;
}

const STORAGE_KEY = 'literary_translator_view_prefs';

export const DEFAULT_VIEW_PREFS: ViewPreferences = {
  density: 'comfortable',
  navigationMode: 'guided'
};

export const viewService = {
  savePreferences(prefs: ViewPreferences): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  },

  loadPreferences(): ViewPreferences {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_VIEW_PREFS;
    try {
      return { ...DEFAULT_VIEW_PREFS, ...JSON.parse(saved) };
    } catch {
      return DEFAULT_VIEW_PREFS;
    }
  },

  getDensityClasses(mode: DensityMode) {
    switch (mode) {
      case 'compact':
        return {
          container: 'gap-2 p-2',
          card: 'p-3 rounded-xl',
          text: 'text-sm leading-tight',
          spacing: 'space-y-2',
          heading: 'text-sm',
          label: 'text-[10px]',
          icon: 'h-4 w-4'
        };
      case 'reading':
        return {
          container: 'gap-8 p-6 md:p-10',
          card: 'p-8 md:p-12 rounded-[2.5rem]',
          text: 'text-lg leading-relaxed font-serif',
          spacing: 'space-y-6',
          heading: 'text-2xl',
          label: 'text-sm',
          icon: 'h-6 w-6'
        };
      case 'comfortable':
      default:
        return {
          container: 'gap-4 p-4 md:p-6',
          card: 'p-6 rounded-3xl',
          text: 'text-base leading-normal',
          spacing: 'space-y-4',
          heading: 'text-lg',
          label: 'text-xs',
          icon: 'h-5 w-5'
        };
    }
  }
};
