// Dynamic backend origin: automatically uses current host (localhost or your IP 192.168.1.97) on port 8000
const host =
  typeof window !== "undefined" && window.location.hostname
    ? window.location.hostname
    : "localhost";

export const API_BASE = `http://${host}:8000`;
