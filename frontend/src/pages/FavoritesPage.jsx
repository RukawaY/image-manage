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
import ImageEditor from '../components/ImageEditor';
import TagEditor from '../components/TagEditor';

export default function FavoritesPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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

  const handleEditImage = (image) => {
    setSelectedImage(image);
    setCropMode(false);
    setEditorOpen(true);
  };

  const handleCropImage = (image) => {
    setSelectedImage(image);
    setCropMode(true);
    setEditorOpen(true);
  };

  const handleEditTags = (image) => {
    setSelectedImage(image);
    setTagEditorOpen(true);
  };

  const handleEditorSave = () => {
    setEditorOpen(false);
    setCropMode(false);
    showSnackbar('图片编辑成功', 'success');
    loadFavorites();
  };

  const handleTagsSave = () => {
    setTagEditorOpen(false);
    showSnackbar('标签更新成功', 'success');
    loadFavorites();
  };

  const handleDelete = async (image) => {
    if (window.confirm('确定要删除这张图片吗？')) {
      try {
        await imageAPI.delete(image.id);
        showSnackbar('删除成功', 'success');
        loadFavorites();
      } catch (error) {
        showSnackbar('删除失败', 'error');
      }
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
                onEdit={() => handleEditImage(image)}
                onCrop={() => handleCropImage(image)}
                onEditTags={() => handleEditTags(image)}
                onDelete={() => handleDelete(image)}
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

      {/* 图片编辑器 */}
      <ImageEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setCropMode(false);
        }}
        image={selectedImage}
        onSave={handleEditorSave}
        defaultMode={cropMode ? 'crop' : 'adjust'}
      />

      {/* 标签编辑器 */}
      <TagEditor
        open={tagEditorOpen}
        onClose={() => setTagEditorOpen(false)}
        image={selectedImage}
        onSave={handleTagsSave}
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

