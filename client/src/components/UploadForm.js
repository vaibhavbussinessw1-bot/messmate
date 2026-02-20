import React, { useState } from 'react';
import axios from 'axios';
import './UploadForm.css';

function UploadForm({ username, onSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !hotelName) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', image);
    formData.append('username', username);
    formData.append('hotelName', hotelName);

    try {
      const response = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('Upload success:', response.data);
      setImage(null);
      setPreview(null);
      setHotelName('');
      onSuccess();
      alert('Posted successfully! 🎉');
    } catch (error) {
      console.error('Upload error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data || error.message || 'Unknown error';
      console.log('Error details:', errorMsg);
      alert(`Failed to upload: ${typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-form">
      <h2>📸 Share today's menu!</h2>
      <form onSubmit={handleSubmit}>
        <div className="image-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            id="image-input"
            required
          />
          <label htmlFor="image-input" className="image-label">
            {preview ? (
              <img src={preview} alt="Preview" />
            ) : (
              <div className="placeholder">
                <span>📷</span>
                <p>Click to snap your food!</p>
              </div>
            )}
          </label>
        </div>

        <input
          type="text"
          placeholder="🏨 Mess/Hotel name"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? '⏳ Posting...' : '🚀 Share Now'}
        </button>
      </form>
      <p className="auto-delete-notice">⏰ Posts auto-delete after 24 hours</p>
    </div>
  );
}

export default UploadForm;
