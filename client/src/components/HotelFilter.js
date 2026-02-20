import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HotelFilter.css';

function HotelFilter({ selectedHotel, onSelectHotel }) {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/posts/hotels/list');
      setHotels(response.data);
    } catch (error) {
      console.error('Failed to fetch hotels:', error);
      setHotels([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="hotel-filter">
        <div className="filter-scroll">
          <div className="filter-skeleton"></div>
          <div className="filter-skeleton"></div>
          <div className="filter-skeleton"></div>
        </div>
      </div>
    );
  }

  if (hotels.length === 0) {
    return null;
  }

  return (
    <div className="hotel-filter">
      <div className="filter-label">
        <span>🏨 Filter by Mess/Hotel</span>
      </div>
      <div className="filter-scroll">
        <button
          className={`filter-btn ${!selectedHotel ? 'active' : ''}`}
          onClick={() => onSelectHotel('')}
        >
          <span className="filter-icon">🔥</span>
          All
        </button>
        {hotels.map((hotel) => (
          <button
            key={hotel}
            className={`filter-btn ${selectedHotel === hotel ? 'active' : ''}`}
            onClick={() => onSelectHotel(hotel)}
          >
            <span className="filter-icon">🏨</span>
            {hotel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HotelFilter;
