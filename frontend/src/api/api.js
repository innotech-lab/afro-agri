import axios from 'axios';

const API = axios.create({ baseURL: 'http://127.0.0.1:8000/api' });

export const getChamps = () => API.get('/champs/');
export const createChamp = (data) => API.post('/champs/', data);
export const updateChamp = (id, data) => API.put(`/champs/${id}/`, data);
export const deleteChamp = (id) => API.delete(`/champs/${id}/`);

export const getPlantes = () => API.get('/plantes/');
export const createPlante = (data) => API.post('/plantes/', data);

export const getJournal = () => API.get('/journal/');
export const createJournal = (data) => API.post('/journal/', data);

export const getEtudeSol = () => API.get('/etude-sol/');
export const createEtudeSol = (data) => API.post('/etude-sol/', data);

export const getUsers = () => API.get('/users/users/');
export const loginUser = (data) => API.post('/users/auth/login/', data);
