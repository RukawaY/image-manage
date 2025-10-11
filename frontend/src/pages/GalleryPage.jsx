import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import { imageAPI } from '../services/api';
import ImageCard from '../components/ImageCard';
import ImageSlideshow from '../components/ImageSlideshow';
import ImageEditor from '../components/ImageEditor';
import TagEditor from '../components/TagEditor';
import { useSearchFilter } from '../layouts/MainLayout';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [cropMode, setCropMode] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newTags, setNewTags] = useState('');
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { searchQuery, ordering, uploadSuccess, setUploadSuccess } = useSearchFilter();

  useEffect(() => {
    loadImages();
  }, [ordering, searchQuery]);

  useEffect(() => {
    if (uploadSuccess) {
      loadImages();
      setUploadSuccess(false);
    }
  }, [uploadSuccess, setUploadSuccess]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const params = { ordering };
      
      // 如果有搜索关键词，添加到参数中
      if (searchQuery && searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      
      const response = await imageAPI.list(params);
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

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setSlideshowOpen(true);
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

  const handleEditorSave = () => {
    setEditorOpen(false);
    setCropMode(false);
    showSnackbar('图片编辑成功', 'success');
    loadImages();
  };

  const handleEditTags = (image) => {
    setSelectedImage(image);
    setTagDialogOpen(true);
  };

  const handleTagsSave = () => {
    setTagDialogOpen(false);
    showSnackbar('标签更新成功', 'success');
    loadImages();
  };

  const handleAddTags = (image) => {
    setSelectedImage(image);
    setNewTags('');
    setTagDialogOpen(true);
  };

  const handleSaveTags = async () => {
    if (!newTags.trim()) {
      showSnackbar('请输入标签', 'error');
      return;
    }

    const tags = newTags.split(',').map(t => t.trim()).filter(t => t);
    
    try {
      await imageAPI.addTags(selectedImage.id, tags);
      showSnackbar('标签添加成功', 'success');
      setTagDialogOpen(false);
      setNewTags('');
      loadImages();
    } catch (error) {
      showSnackbar('添加标签失败', 'error');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await imageAPI.removeTags(selectedImage.id, [tagId]);
      showSnackbar('标签已删除', 'success');
      loadImages();
    } catch (error) {
      showSnackbar('删除标签失败', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">全部图片</Typography>
        {searchQuery && (
          <Typography variant="body2" color="text.secondary">
            搜索: {searchQuery}
          </Typography>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : images.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            还没有图片，快去上传吧！
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {images.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <ImageCard
                image={image}
                onFavorite={handleFavorite}
                onDelete={handleDelete}
                onEdit={() => handleEditImage(image)}
                onCrop={() => handleCropImage(image)}
                onEditTags={() => handleEditTags(image)}
                onClick={() => handleImageClick(index)}
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

      {/* 标签编辑对话框 */}
      <TagEditor
        open={tagDialogOpen}
        onClose={() => setTagDialogOpen(false)}
        image={selectedImage}
        onSave={handleTagsSave}
      />

      {/* 旧的标签编辑对话框 - 可以保留或删除 */}
      <Dialog open={false} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>编辑标签</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="新标签（用逗号分隔）"
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            margin="normal"
            helperText="例如: 风景, 旅行, 夏天"
            autoFocus
          />
          {selectedImage?.tags && selectedImage.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                当前标签:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {selectedImage.tags.map((tag) => (
                  <Chip
                    key={tag.id}
                    label={tag.name}
                    onDelete={() => handleRemoveTag(tag.id)}
                    sx={{ mt: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveTags} variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>

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

