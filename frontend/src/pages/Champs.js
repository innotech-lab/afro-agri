import React, { useEffect, useState } from 'react';
import { getChamps, createChamp, deleteChamp } from '../api/api';

const empty = { superficie: '', source_eau: 'Forage', longitude: '', latitude: '' };

export default function Champs() {
  const [champs, setChamps] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = () => getChamps().then(r => setChamps(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createChamp(form);
    setForm(empty);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce champ ?')) {
      await deleteChamp(id);
      load();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🌾 Champs</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="Superficie (ha)" type="number" value={form.superficie}
            onChange={e => setForm({ ...form, superficie: e.target.value })} />
          <select style={styles.input} value={form.source_eau} onChange={e => setForm({ ...form, source_eau: e.target.value })}>
            {['Forage', 'Pluie', 'Irrigation', 'Riviere'].map(s => <option key={s}>{s}</option>)}
          </select>
          <input style={styles.input} placeholder="Longitude" type="number" value={form.longitude}
            onChange={e => setForm({ ...form, longitude: e.target.value })} required />
          <input style={styles.input} placeholder="Latitude" type="number" value={form.latitude}
            onChange={e => setForm({ ...form, latitude: e.target.value })} required />
          <button style={styles.btn} type="submit">Enregistrer</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th>ID</th><th>Superficie</th><th>Source eau</th><th>Longitude</th><th>Latitude</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {champs.map(c => (
            <tr key={c.id_champ} style={styles.tr}>
              <td>{c.id_champ}</td>
              <td>{c.superficie} ha</td>
              <td>{c.source_eau}</td>
              <td>{c.longitude}</td>
              <td>{c.latitude}</td>
              <td><button style={styles.deleteBtn} onClick={() => handleDelete(c.id_champ)}>🗑</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { padding: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  form: { background: '#f1f8e9', padding: 20, borderRadius: 10, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' },
  input: { padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { background: '#2e7d32', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#2e7d32', color: '#fff' },
  tr: { borderBottom: '1px solid #e0e0e0', textAlign: 'center' },
  deleteBtn: { background: '#c62828', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' },
};
