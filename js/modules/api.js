const BASE_URL = ''; 

async function fetchApi(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  
  if (window.location.hostname.includes('github.io')) {
    console.warn('API features are not available on GitHub Pages.');
    return { ok: false, data: null, error: 'API not available on static host' };
  }

  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    let data = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch (err) {}
    }

    if (!response.ok) {
      return { ok: false, data: null, error: data?.error || 'An error occurred' };
    }

    return { ok: true, data: data?.data || data, error: null };
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    return { ok: false, data: null, error: error.message };
  }
}

export const api = {
  get: (path) => fetchApi(path, { method: 'GET' }),
  post: (path, body) => fetchApi(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => fetchApi(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => fetchApi(path, { method: 'DELETE' }),
};
