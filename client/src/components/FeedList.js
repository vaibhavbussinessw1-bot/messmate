import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FeedList.css';

function FeedList({ selectedHotel, refresh }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const url = selectedHotel 
        ? `/api/posts/hotel/${selectedHotel}`
        : '/api/posts';
      const response = await axios.get(url);
      setPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts');
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
    hours = hours ? hours : 12; // 0 should be 12
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="empty-state">
        <p>🍽️</p>
        <p>No posts yet. Be the first to share today's menu!</p>
      </div>
    );
  }

  return (
    <div className="feed-list">
      {posts.map((post) => (
        <div key={post._id} className="post-card">
          <img src={post.imageUrl} alt="Food" />
          <div className="post-info">
            <p className="hotel-name">🏨 {post.hotelName}</p>
            <p className="post-date">
              📅 {formatMarathiDate(post.createdAt)} • ⏰ {formatTime(post.createdAt)}
            </p>
            <p className="username">by {post.username}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default FeedList;
