import React, { useState } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FeedList from './components/FeedList';
import HotelFilter from './components/HotelFilter';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!username);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [refreshFeed, setRefreshFeed] = useState(0);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('username', username.trim());
      setShowUsernameModal(false);
    }
  };

  const handlePostSuccess = () => {
    setRefreshFeed(prev => prev + 1);
  };

  return (
    <div className="App">
      {showUsernameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>🎉 Welcome to MessMate!</h2>
            <p>What should we call you?</p>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <button type="submit">Let's Go! 🚀</button>
            </form>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <h1>🍽️ MessMate</h1>
          <span className="username">👋 {username}</span>
        </div>
        <p className="header-subtitle">📍 Discover today's mess menu • Posts vanish in 24hrs ⏰</p>
      </header>

      <main className="app-main">
        <UploadForm username={username} onSuccess={handlePostSuccess} />
        <HotelFilter 
          selectedHotel={selectedHotel} 
          onSelectHotel={setSelectedHotel} 
        />
        <FeedList selectedHotel={selectedHotel} refresh={refreshFeed} />
      </main>
    </div>
  );
}

export default App;
