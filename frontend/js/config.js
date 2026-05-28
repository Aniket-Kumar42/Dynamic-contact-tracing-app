// config.js
window.API_URL = 'http://127.0.0.1:5001'; // Default fallback

async function loadConfig() {
  const envPaths = ['./.env', '../.env'];
  for (const path of envPaths) {
    try {
      const response = await fetch(path);
      if (response.ok) {
        const text = await response.text();
        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const parts = trimmed.split('=');
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key === 'HOST_URL' || key === 'API_URL' || key === 'REACT_APP_HOST_URL') {
              window.API_URL = value;
              console.log("Loaded API URL from .env:", window.API_URL);
              return;
            }
          }
        }
      }
    } catch (e) {
      // Ignore and try next path
    }
  }
  console.warn("Could not load .env file from paths, using default API URL:", window.API_URL);
}

// Immediately load config
window.configPromise = loadConfig();
