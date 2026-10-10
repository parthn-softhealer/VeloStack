// Single switch: backend origin. Mock (src/mock.json) is ONLY a fallback
// when the backend is unreachable — see api.js.
// LAN IP so same-network devices reach the same DB (localhost = own machine only).
export const API_BASE = "http://192.168.1.66:8000";
