import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HotelFilter.css';

function HotelFilter({ selectedHotel, onSelectHotel }) {
  const [hotels, setHotels] = useState([]);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || '';
      const response = await axios.get(`${API_URL}/api/posts/hotels/list`);
      setHotels(response.data);
    } catch (error) {
      console.error('Failed to fetch hotels');
    }
  };

  return (
    <div className="hotel-filter">
      <div className="filter-scroll">
        <button
          className={!selectedHotel ? 'active' : ''}
          onClick={() => onSelectHotel('')}
        >
          All
        </button>
        {hotels.map((hotel) => (
          <button
            key={hotel}
            className={selectedHotel === hotel ? 'active' : ''}
            onClick={() => onSelectHotel(hotel)}
          >
            {hotel}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HotelFilter;
