import React, { useState } from 'react';
import axios from 'axios';
import './UploadForm.css';

function UploadForm({ username, onSuccess }) {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [hotelName, setHotelName] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !hotelName.trim()) {
      alert('Please fill all fields');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    
    const formData = new FormData();
    formData.append('image', image);
    formData.append('username', username);
    formData.append('hotelName', hotelName.trim());

    try {
      const response = await axios.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      console.log('Upload success:', response.data);
      
      // Reset form
      setImage(null);
      setPreview(null);
      setHotelName('');
      setUploadProgress(0);
      
      // Trigger refresh
      onSuccess();
      
      // Success feedback
      alert('🎉 Posted successfully! Your food pic is now live!');
    } catch (error) {
      console.error('Full upload error:', error);
      console.error('Error response:', error.response);
      
      // Extract error message properly
      let errorMsg = 'Upload failed';
      
      try {
        if (error.response) {
          // Server responded with error
          console.log('Response data:', error.response.data);
          console.log('Response status:', error.response.status);
          
          if (typeof error.response.data === 'string') {
            errorMsg = error.response.data;
          } else if (error.response.data && error.response.data.error) {
            errorMsg = error.response.data.error;
          } else if (error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message;
          } else {
            errorMsg = `Server error (${error.response.status})`;
          }
        } else if (error.request) {
          // Request made but no response
          errorMsg = 'No response from server. Check your internet connection.';
        } else {
          // Error in request setup
          errorMsg = error.message || 'Failed to send request';
        }
      } catch (parseError) {
        console.error('Error parsing error:', parseError);
        errorMsg = 'An unknown error occurred';
      }
      
      console.log('Final error message:', errorMsg);
      alert(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  return (
    <div className="upload-form">
      <h2>📸 Share Today's Menu!</h2>
      <form onSubmit={handleSubmit}>
        <div className="image-upload">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            id="image-input"
            disabled={loading}
          />
          <label htmlFor="image-input" className="image-label">
            {preview ? (
              <div className="preview-container">
                <img src={preview} alt="Preview" />
                <button 
                  type="button" 
                  className="remove-image" 
                  onClick={(e) => {
                    e.preventDefault();
                    removeImage();
                  }}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="placeholder">
                <span>📷</span>
                <p>Tap to capture your food!</p>
                <small>Max 10MB • JPG, PNG, GIF</small>
              </div>
            )}
          </label>
        </div>

        <input
          type="text"
          placeholder="🏨 Mess/Hotel name (e.g., Annapurna Mess)"
          value={hotelName}
          onChange={(e) => setHotelName(e.target.value)}
          disabled={loading}
          maxLength={50}
          required
        />

        {loading && (
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
              {uploadProgress}%
            </div>
          </div>
        )}

        <button type="submit" disabled={loading || !image || !hotelName.trim()}>
          {loading ? `⏳ Uploading... ${uploadProgress}%` : '🚀 Share Now'}
        </button>
      </form>
      <p className="auto-delete-notice">⏰ Posts auto-delete after 24 hours</p>
    </div>
  );
}

export default UploadForm;
