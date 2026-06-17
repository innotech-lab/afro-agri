import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>🌱 AfroAgri</span>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/champs" style={styles.link}>Champs</Link>
        <Link to="/plantes" style={styles.link}>Plantes</Link>
        <Link to="/journal" style={styles.link}>Journal</Link>
        <Link to="/etude-sol" style={styles.link}>Étude Sol</Link>
        <button onClick={logout} style={styles.btn}>Déconnexion</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2e7d32', padding: '10px 24px' },
  brand: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  links: { display: 'flex', gap: 16, alignItems: 'center' },
  link: { color: '#fff', textDecoration: 'none', fontSize: 15 },
  btn: { background: '#c62828', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' },
};
