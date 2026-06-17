import React, { useEffect, useState } from 'react';
import { getEtudeSol, createEtudeSol, getChamps } from '../api/api';

const empty = { id_champ: '', date_analyse: '', ph_sol: '', matiere_organique: '', azote: '', phosphore: '', potassium: '', humidite: '', type_sol: '', fertilite: '', rapport_analyse: '' };

export default function EtudeSol() {
  const [etudes, setEtudes] = useState([]);
  const [champs, setChamps] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    getEtudeSol().then(r => setEtudes(r.data)).catch(() => {});
    getChamps().then(r => setChamps(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createEtudeSol(form);
    setForm(empty);
    setShowForm(false);
    load();
  };

  const fields = ['ph_sol', 'matiere_organique', 'azote', 'phosphore', 'potassium', 'humidite', 'type_sol', 'fertilite', 'rapport_analyse'];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🔬 Études du Sol</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <select style={styles.input} value={form.id_champ} onChange={e => setForm({ ...form, id_champ: e.target.value })} required>
            <option value="">-- Champ --</option>
            {champs.map(c => <option key={c.id_champ} value={c.id_champ}>Champ #{c.id_champ}</option>)}
          </select>
          <input style={styles.input} type="date" value={form.date_analyse} onChange={e => setForm({ ...form, date_analyse: e.target.value })} required />
          {fields.map(f => (
            <input key={f} style={styles.input} placeholder={f.replace('_', ' ')} value={form[f]}
              onChange={e => setForm({ ...form, [f]: e.target.value })} required />
          ))}
          <button style={styles.btn} type="submit">Enregistrer</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th>ID</th><th>Champ</th><th>Date</th><th>pH Sol</th><th>Type Sol</th><th>Fertilité</th>
          </tr>
        </thead>
        <tbody>
          {etudes.map(e => (
            <tr key={e.id_etude_sol} style={styles.tr}>
              <td>{e.id_etude_sol}</td>
              <td>#{e.id_champ}</td>
              <td>{e.date_analyse}</td>
              <td>{e.ph_sol}</td>
              <td>{e.type_sol}</td>
              <td>{e.fertilite}</td>
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
  form: { background: '#f3e5f5', padding: 20, borderRadius: 10, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' },
  input: { padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { background: '#6a1b9a', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#6a1b9a', color: '#fff' },
  tr: { borderBottom: '1px solid #e0e0e0', textAlign: 'center' },
};
