// api.js — one function that every component uses to talk to the backend.
// It adds the login token, sends JSON, and turns server errors into JS errors.

export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');

  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers.Authorization = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const res = await fetch('/api' + path, options);
  const data = await res.json().catch(() => ({}));

  // Token missing or expired -> clear it and reload, which shows the login page
  if (res.status === 401 && token) {
    logout();
    return;
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function saveLogin(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

export function getSavedUser() {
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.reload();
}
