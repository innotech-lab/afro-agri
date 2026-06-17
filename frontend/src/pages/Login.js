import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || 'Email ou mot de passe incorrect';
      setError(msg);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🌱 AfroAgri</h2>
        <h3 style={{ textAlign: 'center', marginBottom: 20 }}>Connexion</h3>
        {error && <p style={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <input style={styles.input} type="email" placeholder="Email" value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input style={styles.input} type="password" placeholder="Mot de passe" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required />
          <button style={styles.btn} type="submit">Se connecter</button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8f5e9' },
  card: { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: 360 },
  title: { textAlign: 'center', color: '#2e7d32', marginBottom: 8 },
  input: { width: '100%', padding: 10, marginBottom: 14, borderRadius: 6, border: '1px solid #ccc', boxSizing: 'border-box', fontSize: 15 },
  btn: { width: '100%', padding: 12, background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, fontSize: 16, cursor: 'pointer' },
  error: { color: 'red', textAlign: 'center', marginBottom: 10 },
};
