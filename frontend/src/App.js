import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Champs from './pages/Champs';
import Plantes from './pages/Plantes';
import Journal from './pages/Journal';
import EtudeSol from './pages/EtudeSol';

const PrivateRoute = ({ children }) => {
  return localStorage.getItem('user') ? (
    <><Navbar />{children}</>
  ) : <Navigate to="/login" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/champs" element={<PrivateRoute><Champs /></PrivateRoute>} />
        <Route path="/plantes" element={<PrivateRoute><Plantes /></PrivateRoute>} />
        <Route path="/journal" element={<PrivateRoute><Journal /></PrivateRoute>} />
        <Route path="/etude-sol" element={<PrivateRoute><EtudeSol /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
