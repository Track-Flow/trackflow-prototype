// helpers/api.js  ← create this file
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// attach token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// if token expires, kick user back to login
api.interceptors.response.use(
  res => res,
  err => {
    // Only a bad/expired token should log the user out. Other 403s are normal
    // permission answers (e.g. "already claimed", "not your department") and
    // must reach the screen as an error message instead.
    const status = err.response?.status;
    const tokenRejected =
      status === 401 ||
      (status === 403 && err.response?.data?.error === 'Invalid or expired token.');
    if (tokenRejected) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;