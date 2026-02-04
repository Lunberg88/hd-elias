import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './contexts/GameContext';
import { Home, Game, Admin } from './pages';

function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;
