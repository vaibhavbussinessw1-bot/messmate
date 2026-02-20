import React, { useState, useEffect } from 'react';
import './App.css';
import UploadForm from './components/UploadForm';
import FeedList from './components/FeedList';
import HotelFilter from './components/HotelFilter';

function App() {
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [showUsernameModal, setShowUsernameModal] = useState(!username);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [refreshFeed, setRefreshFeed] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUsernameSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('username', username.trim());
      setShowUsernameModal(false);
    }
  };

  const handlePostSuccess = () => {
    setRefreshFeed(prev => prev + 1);
    // Scroll to top to see the new post
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleChangeUsername = () => {
    const newUsername = prompt('Enter your new name:', username);
    if (newUsername && newUsername.trim()) {
      setUsername(newUsername.trim());
      localStorage.setItem('username', newUsername.trim());
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="App">
      {showUsernameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">🍽️</div>
            <h2>Welcome to MessMate!</h2>
            <p>Share and discover today's mess menu</p>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                required
                autoFocus
              />
              <button type="submit">Let's Go! 🚀</button>
            </form>
            <p className="modal-note">No signup required • Posts auto-delete in 24hrs</p>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="header-content">
          <h1>🍽️ MessMate</h1>
          <button className="username-btn" onClick={handleChangeUsername} title="Change username">
            👋 {username}
          </button>
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

      {showScrollTop && (
        <button className="scroll-top-btn" onClick={scrollToTop} title="Scroll to top">
          ⬆️
        </button>
      )}

      <footer className="app-footer">
        <p>Made with ❤️ for students</p>
        <p className="footer-note">Share your mess food • Help others decide</p>
      </footer>
    </div>
  );
}

export default App;
