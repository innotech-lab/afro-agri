import React, { useEffect, useState } from 'react';
import { getChamps, getPlantes, getJournal, getEtudeSol } from '../api/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ champs: 0, plantes: 0, journal: 0, etudeSol: 0 });

  useEffect(() => {
    Promise.all([getChamps(), getPlantes(), getJournal(), getEtudeSol()])
      .then(([c, p, j, e]) => setStats({ champs: c.data.length, plantes: p.data.length, journal: j.data.length, etudeSol: e.data.length }))
      .catch(() => {});
  }, []);

  const cards = [
    { label: 'Champs', value: stats.champs, color: '#2e7d32', icon: '🌾' },
    { label: 'Plantes', value: stats.plantes, color: '#1565c0', icon: '🌿' },
    { label: 'Journal', value: stats.journal, color: '#e65100', icon: '📓' },
    { label: 'Études Sol', value: stats.etudeSol, color: '#6a1b9a', icon: '🔬' },
  ];

  return (
    <div style={styles.container}>
      <h2>Tableau de bord</h2>
      <div style={styles.grid}>
        {cards.map(c => (
          <div key={c.label} style={{ ...styles.card, background: c.color }}>
            <div style={styles.icon}>{c.icon}</div>
            <div style={styles.value}>{c.value}</div>
            <div style={styles.label}>{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: { padding: 32 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginTop: 24 },
  card: { borderRadius: 12, padding: 24, color: '#fff', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
  icon: { fontSize: 36, marginBottom: 8 },
  value: { fontSize: 40, fontWeight: 'bold' },
  label: { fontSize: 16, marginTop: 4 },
};
