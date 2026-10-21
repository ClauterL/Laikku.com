/** Luonnokset (esim. suosittelija ei vielä hyväksynyt) näkyvät vain kehitystilassa ja esikatselussa (VITE_SHOW_DRAFTS=1) */
export const SHOW_DRAFTS = import.meta.env.DEV || import.meta.env.VITE_SHOW_DRAFTS === '1'
