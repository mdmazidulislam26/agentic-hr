import axios from 'axios';

// Unified API Client targeting Nginx Reverse Proxy Gateway
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
