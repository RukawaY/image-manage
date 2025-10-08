import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { tagAPI, imageAPI } from '../services/api';
import ImageCard from '../components/ImageCard';
import ImageSlideshow from '../components/ImageSlideshow';

export default function CategoriesPage() {
  const [popularTags, setPopularTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    if (selectedTag) {
      loadImages();
    }
  }, [selectedTag]);

  const loadTags = async () => {
    try {
      const [popularRes, allRes] = await Promise.all([
        tagAPI.popular(),
        tagAPI.allTags(),
      ]);
      setPopularTags(popularRes.data || []);
      setAllTags(allRes.data || []);
    } catch (error) {
      showSnackbar('加载标签失败', 'error');
    }
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.list({ tags: selectedTag.id });
      setImages(response.data.results || response.data || []);
    } catch (error) {
      showSnackbar('加载图片失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async (image) => {
    try {
      if (image.is_favorited) {
        await imageAPI.unfavorite(image.id);
      } else {
        await imageAPI.favorite(image.id);
      }
      loadImages();
    } catch (error) {
      showSnackbar('操作失败', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          热门标签
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
          {popularTags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              onClick={() => setSelectedTag(tag)}
              color={selectedTag?.id === tag.id ? 'primary' : 'default'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          所有标签
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {allTags.map((tag) => (
            <Chip
              key={tag.id}
              label={tag.name}
              onClick={() => setSelectedTag(tag)}
              color={selectedTag?.id === tag.id ? 'primary' : 'default'}
              variant={selectedTag?.id === tag.id ? 'filled' : 'outlined'}
              sx={{ mb: 1 }}
            />
          ))}
        </Stack>
      </Box>

      {selectedTag && (
        <Box>
          <Typography variant="h6" gutterBottom>
            标签：{selectedTag.name}
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : images.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">该标签下没有图片</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                  <ImageCard
                    image={image}
                    onFavorite={handleFavorite}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setSlideshowOpen(true);
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
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

