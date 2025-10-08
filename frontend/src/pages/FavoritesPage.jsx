import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { Star as StarIcon } from '@mui/icons-material';
import { imageAPI } from '../services/api';
import ImageCard from '../components/ImageCard';
import ImageSlideshow from '../components/ImageSlideshow';

export default function FavoritesPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.getFavorites();
      setImages(response.data.results || response.data || []);
    } catch (error) {
      showSnackbar('加载收藏失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfavorite = async (image) => {
    try {
      await imageAPI.unfavorite(image.id);
      showSnackbar('已取消收藏', 'success');
      loadFavorites();
    } catch (error) {
      showSnackbar('操作失败', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        我的收藏
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : images.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 8,
          }}
        >
          <StarIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            还没有收藏任何图片
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <ImageCard
                image={image}
                onFavorite={handleUnfavorite}
                onClick={() => {
                  setSelectedImageIndex(index);
                  setSlideshowOpen(true);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <ImageSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}

