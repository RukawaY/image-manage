import { useState, useEffect } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { Collections as CollectionsIcon } from '@mui/icons-material';
import { imageAPI } from '../services/api';
import './HomePage.css';

export default function HomePage() {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (images.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [images.length]);

  const loadImages = async () => {
    try {
      const response = await imageAPI.list({ page_size: 20, ordering: '-uploaded_at' });
      setImages(response.data.results || response.data || []);
    } catch (error) {
      console.error('加载图片失败', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <Typography>加载中...</Typography>
      </Container>
    );
  }

  if (images.length === 0) {
    return (
      <Container
        maxWidth="md"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '70vh',
          textAlign: 'center',
        }}
      >
        <CollectionsIcon sx={{ fontSize: 120, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="text.secondary" gutterBottom>
          图库空空如也
        </Typography>
        <Typography variant="body1" color="text.secondary">
          快上传图片吧！
        </Typography>
      </Container>
    );
  }

  return (
    <Box className="home-container">
      <div className="slideshow-container">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`slide ${index === currentIndex ? 'active' : ''} ${
              index === (currentIndex - 1 + images.length) % images.length ? 'prev' : ''
            }`}
          >
            <img src={image.file_url} alt={image.title} />
            <div className="slide-info">
              <Typography variant="h3" className="slide-title">
                {image.title || '无标题'}
              </Typography>
              {image.description && (
                <Typography variant="h6" className="slide-description">
                  {image.description}
                </Typography>
              )}
            </div>
          </div>
        ))}
      </div>

      <Box className="slide-indicators">
        {images.map((_, index) => (
          <span
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </Box>
    </Box>
  );
}
