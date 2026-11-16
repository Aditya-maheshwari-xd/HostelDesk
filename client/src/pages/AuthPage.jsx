import { useState } from 'react';
import { api, saveLogin } from '../api';

// One page with two modes: "login" and "register".
// Only students register here. Warden/staff accounts come from seed.js.
export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', room_no: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // One change handler for all inputs: uses the input's "name" attribute as the key
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser from reloading the page
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const data = await api(path, 'POST', form);
      saveLogin(data.token, data.user);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h1>HostelDesk</h1>
        <p className="muted">Hostel complaint and maintenance portal</p>

        {mode === 'register' && (
          <input name="name" placeholder="Full name" value={form.name} onChange={handleChange} />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} />
        {mode === 'register' && (
          <input name="room_no" placeholder="Room number (e.g. A-101)" value={form.room_no} onChange={handleChange} />
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
        </button>

        <p className="switch">
          {mode === 'login' ? 'New student? ' : 'Already have an account? '}
          <a href="#" onClick={(e) => { e.preventDefault(); setError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>
            {mode === 'login' ? 'Register here' : 'Login'}
          </a>
        </p>

        <p className="demo muted">
          Demo: warden@hostel.com, ravi@hostel.com, aman@student.com — password: password123
        </p>
      </form>
    </div>
  );
}
