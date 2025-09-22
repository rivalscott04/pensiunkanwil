/**
 * Dynamic configuration based on environment and network detection
 */

// Function to detect if we're running in development mode
const isDevelopment = import.meta.env.DEV;

// Function to get the current hostname
const getCurrentHost = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return 'localhost';
};

// Function to determine API base URL dynamically
export const getApiBaseUrl = (): string => {
  // If VITE_API_BASE_URL is explicitly set, use it
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const hostname = getCurrentHost();
  
  // If running on localhost or 127.0.0.1, use local backend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // If running on network IP, use network backend
  if (hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
    return `http://${hostname}:8000`;
  }
  
  // Default fallback
  return 'http://localhost:8000';
};

// Export the API base URL
export const API_BASE_URL = getApiBaseUrl();

// Log the configuration for debugging
if (isDevelopment) {
  console.log('🔧 API Configuration:', {
    hostname: getCurrentHost(),
    apiBaseUrl: API_BASE_URL,
    viteApiBaseUrl: import.meta.env.VITE_API_BASE_URL,
    mode: import.meta.env.MODE
  });
}
