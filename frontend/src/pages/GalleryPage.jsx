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
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import { imageAPI } from '../services/api';
import ImageCard from '../components/ImageCard';
import ImageSlideshow from '../components/ImageSlideshow';
import { useSearchFilter } from '../layouts/MainLayout';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [newTags, setNewTags] = useState('');
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { searchQuery, ordering, uploadDialogOpen, setUploadDialogOpen } = useSearchFilter();

  useEffect(() => {
    loadImages();
  }, [ordering, searchQuery]);

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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showSnackbar('请选择图片文件', 'error');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('请选择要上传的图片', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title || selectedFile.name);
    formData.append('description', uploadForm.description);

    try {
      setUploading(true);
      await imageAPI.upload(formData);
      showSnackbar('上传成功', 'success');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '' });
      loadImages();
    } catch (error) {
      showSnackbar('上传失败', 'error');
    } finally {
      setUploading(false);
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
                onEdit={() => handleAddTags(image)}
                onClick={() => handleImageClick(index)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>上传图片</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                选择图片
              </Button>
            </label>
            {selectedFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                已选择: {selectedFile.name}
              </Typography>
            )}
            <TextField
              fullWidth
              label="标题"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="描述"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>取消</Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile} variant="contained">
            {uploading ? <CircularProgress size={24} /> : '上传'}
          </Button>
        </DialogActions>
      </Dialog>

      <ImageSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
      />

      {/* 标签编辑对话框 */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
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

