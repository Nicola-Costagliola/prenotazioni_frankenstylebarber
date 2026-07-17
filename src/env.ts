const DEFAULT_API_BASE_URL = 'https://api.frankenstylebarber.it/api/events';
const DEFAULT_GOOGLE_REVIEW_URL = 'https://g.page/r/Cc-Uk-mBkwIgEAE/review';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
export const GOOGLE_REVIEW_URL = import.meta.env.VITE_GOOGLE_REVIEW_URL || DEFAULT_GOOGLE_REVIEW_URL;
