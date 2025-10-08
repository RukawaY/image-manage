import { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Box,
  Fab,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Add as AddIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import { imageAPI } from '../services/api';
import ImageCard from '../components/ImageCard';
import ImageSlideshow from '../components/ImageSlideshow';

export default function GalleryPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [ordering, setOrdering] = useState('-uploaded_at');

  useEffect(() => {
    loadImages();
  }, [ordering]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.list({ ordering });
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

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">全部图片</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>排序方式</InputLabel>
          <Select value={ordering} onChange={(e) => setOrdering(e.target.value)} label="排序方式">
            <MenuItem value="-uploaded_at">上传时间（新到旧）</MenuItem>
            <MenuItem value="uploaded_at">上传时间（旧到新）</MenuItem>
            <MenuItem value="-shot_at">拍摄时间（新到旧）</MenuItem>
            <MenuItem value="shot_at">拍摄时间（旧到新）</MenuItem>
            <MenuItem value="-width">宽度（大到小）</MenuItem>
            <MenuItem value="width">宽度（小到大）</MenuItem>
            <MenuItem value="-height">高度（大到小）</MenuItem>
            <MenuItem value="height">高度（小到大）</MenuItem>
          </Select>
        </FormControl>
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
                onClick={() => handleImageClick(index)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="上传"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

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

