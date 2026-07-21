// export const BACKEND_BASE_URL = "https://backend.nafri.in/api/v1";
export const BACKEND_BASE_URL = 'http://localhost:5000/api/v1';

// The model used when the user hasn't explicitly picked one yet.
export const DEFAULT_MODEL = 'arcee-ai/trinity-large-preview:free';

// localStorage key holding the user's currently selected model. Persisted so the
// choice stays consistent across the hero, dashboard, and session pages until the
// user explicitly changes it.
export const SELECTED_MODEL_STORAGE_KEY = 'dryink:selectedModel';