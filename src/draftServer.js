// URL of the real-time draft server (the Node/Socket.IO app in ../server,
// deployed on Railway). Set REACT_APP_DRAFT_SERVER_URL at build time to the
// Railway URL; falls back to a local dev server. CRA inlines this at build.
export const DRAFT_SERVER_URL =
  process.env.REACT_APP_DRAFT_SERVER_URL || 'http://localhost:4000';

// Whether a live server URL has been configured for production. When only the
// localhost fallback is present on the deployed site, the live room shows a
// "not configured yet" notice instead of failing to connect.
export const DRAFT_SERVER_CONFIGURED = Boolean(process.env.REACT_APP_DRAFT_SERVER_URL);
