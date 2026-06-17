import React, { useEffect, useState } from 'react';
import { getPlantes, createPlante, getChamps } from '../api/api';

const empty = { nom_plante: '', variete: '', date_plantation: '', id_champ: '' };

export default function Plantes() {
  const [plantes, setPlantes] = useState([]);
  const [champs, setChamps] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    getPlantes().then(r => setPlantes(r.data)).catch(() => {});
    getChamps().then(r => setChamps(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createPlante(form);
    setForm(empty);
    setShowForm(false);
    load();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🌿 Plantes</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <input style={styles.input} placeholder="Nom plante" value={form.nom_plante}
            onChange={e => setForm({ ...form, nom_plante: e.target.value })} required />
          <input style={styles.input} placeholder="Variété" value={form.variete}
            onChange={e => setForm({ ...form, variete: e.target.value })} required />
          <input style={styles.input} type="date" value={form.date_plantation}
            onChange={e => setForm({ ...form, date_plantation: e.target.value })} required />
          <select style={styles.input} value={form.id_champ} onChange={e => setForm({ ...form, id_champ: e.target.value })} required>
            <option value="">-- Champ --</option>
            {champs.map(c => <option key={c.id_champ} value={c.id_champ}>Champ #{c.id_champ}</option>)}
          </select>
          <button style={styles.btn} type="submit">Enregistrer</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th>ID</th><th>Nom</th><th>Variété</th><th>Date plantation</th><th>Champ</th>
          </tr>
        </thead>
        <tbody>
          {plantes.map(p => (
            <tr key={p.id_plante} style={styles.tr}>
              <td>{p.id_plante}</td>
              <td>{p.nom_plante}</td>
              <td>{p.variete}</td>
              <td>{p.date_plantation}</td>
              <td>#{p.id_champ}</td>
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
  form: { background: '#e3f2fd', padding: 20, borderRadius: 10, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' },
  input: { padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { background: '#1565c0', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#1565c0', color: '#fff' },
  tr: { borderBottom: '1px solid #e0e0e0', textAlign: 'center' },
};
