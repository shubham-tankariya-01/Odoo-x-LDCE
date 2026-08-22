import React from 'react';
import { BrowserRouter, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { engineer1Routes } from './routes/engineer1.routes';
import { engineer2Routes } from './routes/engineer2.routes';
import './styles/global.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {engineer1Routes}
          {engineer2Routes}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
