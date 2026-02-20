import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeedList.css';

function FeedList({ selectedHotel, refresh }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = selectedHotel 
        ? `/api/posts/hotel/${encodeURIComponent(selectedHotel)}`
        : '/api/posts';
      const response = await axios.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setError('Failed to load posts. Please refresh.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHotel, refresh]);

  const formatMarathiDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['रविवार', 'सोमवार', 'मंगळवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const months = ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 
                    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
    
    const day = days[date.getDay()];
    const dateNum = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}, ${dateNum} ${month} ${year}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'आत्ताच';
    if (diffMins < 60) return `${diffMins} मिनिटे आधी`;
    if (diffHours < 24) return `${diffHours} तास आधी`;
    return formatMarathiDate(dateString);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading delicious posts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-icon">⚠️</p>
        <p>{error}</p>
        <button onClick={fetchPosts} className="retry-btn">🔄 Retry</button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-icon">🍽️</p>
        <p className="empty-title">No posts yet!</p>
        <p className="empty-subtitle">
          {selectedHotel 
            ? `No posts from ${selectedHotel} yet. Be the first!` 
            : 'Be the first to share today\'s menu!'}
        </p>
      </div>
    );
  }

  return (
    <div className="feed-list">
      <div className="feed-header">
        <h3>
          {selectedHotel ? `📍 ${selectedHotel}` : '🔥 Latest Posts'}
        </h3>
        <span className="post-count">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</span>
      </div>
      
      {posts.map((post, index) => (
        <div 
          key={post._id} 
          className="post-card"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="post-image-container">
            <img src={post.imageUrl} alt="Food" loading="lazy" />
            <div className="image-overlay">
              <span className="time-badge">{getTimeAgo(post.createdAt)}</span>
            </div>
          </div>
          
          <div className="post-info">
            <div className="post-header-info">
              <p className="hotel-name">🏨 {post.hotelName}</p>
              <p className="username">👤 {post.username}</p>
            </div>
            
            <div className="post-meta">
              <p className="post-date">
                📅 {formatMarathiDate(post.createdAt)}
              </p>
              <p className="post-time">
                ⏰ {formatTime(post.createdAt)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeedList;
