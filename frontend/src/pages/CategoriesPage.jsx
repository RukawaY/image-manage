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
import ImageEditor from '../components/ImageEditor';
import TagEditor from '../components/TagEditor';

export default function CategoriesPage() {
  const [popularTags, setPopularTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [tagEditorOpen, setTagEditorOpen] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
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
    loadImages();
  };

  const handleTagsSave = () => {
    setTagEditorOpen(false);
    showSnackbar('标签更新成功', 'success');
    loadImages();
  };

  const handleDelete = async (image) => {
    if (window.confirm('确定要删除这张图片吗？')) {
      try {
        await imageAPI.delete(image.id);
        showSnackbar('删除成功', 'success');
        loadImages();
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
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }} >
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
        </Box>
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

