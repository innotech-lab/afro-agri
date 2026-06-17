import React, { useEffect, useState } from 'react';
import { getJournal, createJournal, getPlantes, getUsers } from '../api/api';

const empty = { id_plante: '', date_observation: '', stade_croissance: '', symptomes: '', ravageur_suspecte: '', maladie_suspecte: '', id_user: '', session_uuid: '', longitude: '', latitude: '' };

export default function Journal() {
  const [journaux, setJournaux] = useState([]);
  const [plantes, setPlantes] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    getJournal().then(r => setJournaux(r.data)).catch(() => {});
    getPlantes().then(r => setPlantes(r.data)).catch(() => {});
    getUsers().then(r => setUsers(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await createJournal({ ...form, session_uuid: crypto.randomUUID() });
    setForm(empty);
    setShowForm(false);
    load();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>📓 Journal des Plantes</h2>
        <button style={styles.btn} onClick={() => setShowForm(!showForm)}>+ Ajouter</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <select style={styles.input} value={form.id_plante} onChange={e => setForm({ ...form, id_plante: e.target.value })} required>
            <option value="">-- Plante --</option>
            {plantes.map(p => <option key={p.id_plante} value={p.id_plante}>{p.nom_plante}</option>)}
          </select>
          <select style={styles.input} value={form.id_user} onChange={e => setForm({ ...form, id_user: e.target.value })} required>
            <option value="">-- Utilisateur --</option>
            {users.map(u => <option key={u.id_user} value={u.id_user}>{u.prenom} {u.nom}</option>)}
          </select>
          <input style={styles.input} type="date" value={form.date_observation} onChange={e => setForm({ ...form, date_observation: e.target.value })} required />
          <input style={styles.input} placeholder="Stade croissance" value={form.stade_croissance} onChange={e => setForm({ ...form, stade_croissance: e.target.value })} required />
          <input style={styles.input} placeholder="Symptômes" value={form.symptomes} onChange={e => setForm({ ...form, symptomes: e.target.value })} required />
          <input style={styles.input} placeholder="Ravageur suspecté" value={form.ravageur_suspecte} onChange={e => setForm({ ...form, ravageur_suspecte: e.target.value })} required />
          <input style={styles.input} placeholder="Maladie suspectée" value={form.maladie_suspecte} onChange={e => setForm({ ...form, maladie_suspecte: e.target.value })} required />
          <input style={styles.input} placeholder="Longitude" type="number" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} required />
          <input style={styles.input} placeholder="Latitude" type="number" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} required />
          <button style={styles.btn} type="submit">Enregistrer</button>
        </form>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th>ID</th><th>Plante</th><th>Date</th><th>Stade</th><th>Symptômes</th><th>Maladie</th>
          </tr>
        </thead>
        <tbody>
          {journaux.map(j => (
            <tr key={j.id_journal} style={styles.tr}>
              <td>{j.id_journal}</td>
              <td>#{j.id_plante}</td>
              <td>{j.date_observation}</td>
              <td>{j.stade_croissance}</td>
              <td>{j.symptomes}</td>
              <td>{j.maladie_suspecte}</td>
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
  form: { background: '#fff3e0', padding: 20, borderRadius: 10, marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' },
  input: { padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 14 },
  btn: { background: '#e65100', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#e65100', color: '#fff' },
  tr: { borderBottom: '1px solid #e0e0e0', textAlign: 'center' },
};
