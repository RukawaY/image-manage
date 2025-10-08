import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Fab,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  LocalOffer as TagIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { imageAPI, tagAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ImageEditor from '../components/ImageEditor';
import ImageSearch from '../components/ImageSearch';
import ImageSlideshow from '../components/ImageSlideshow';

export default function HomePage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '' });
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTags, setNewTags] = useState('');
  const [popularTags, setPopularTags] = useState([]);
  const [searchParams, setSearchParams] = useState({});
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadImages();
    loadPopularTags();
  }, [searchParams]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const response = await imageAPI.list(searchParams);
      setImages(response.data.results || response.data);
    } catch (error) {
      showSnackbar('加载图片失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPopularTags = async () => {
    try {
      const response = await tagAPI.popular();
      setPopularTags(response.data);
    } catch (error) {
      console.error('加载热门标签失败', error);
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

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('确定要删除这张图片吗？')) {
      try {
        await imageAPI.delete(imageId);
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
    setEditingImage(image);
    setEditorOpen(true);
    setAnchorEl(null);
  };

  const handleMenuOpen = (event, image) => {
    setAnchorEl(event.currentTarget);
    setSelectedImage(image);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAddTags = async () => {
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

  const handleSearch = (params) => {
    setSearchParams(params);
    setSearchDialogOpen(false);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      showSnackbar('退出登录失败', 'error');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* 顶部栏 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          我的图库
        </Typography>
        <Box>
          <Button
            startIcon={<SearchIcon />}
            onClick={() => setSearchDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            搜索
          </Button>
          <Button
            startIcon={<FilterIcon />}
            sx={{ mr: 1 }}
          >
            筛选
          </Button>
          <Button onClick={handleLogout}>
            退出登录
          </Button>
        </Box>
      </Box>

      {/* 用户信息 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1">
          欢迎, <strong>{user?.username}</strong>
        </Typography>
      </Box>

      {/* 热门标签 */}
      {popularTags.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            热门标签:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {popularTags.slice(0, 10).map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                onClick={() => setSearchParams({ tags: tag.id.toString() })}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* 图片网格 */}
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
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 6 }
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={image.thumbnail_url || image.file_url}
                  alt={image.title}
                  onClick={() => handleImageClick(index)}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div" noWrap>
                    {image.title}
                  </Typography>
                  {image.description && (
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {image.description}
                    </Typography>
                  )}
                  {image.location && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      📍 {image.location}
                    </Typography>
                  )}
                  {image.tags && image.tags.length > 0 && (
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                      {image.tags.slice(0, 3).map((tag) => (
                        <Chip key={tag.id} label={tag.name} size="small" sx={{ mt: 0.5 }} />
                      ))}
                    </Stack>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditImage(image);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                      setTagDialogOpen(true);
                    }}
                  >
                    <TagIcon />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(image.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 上传按钮 */}
      <Fab
        color="primary"
        aria-label="上传"
        sx={{ position: 'fixed', bottom: 32, right: 32 }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 上传对话框 */}
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

      {/* 搜索对话框 */}
      <ImageSearch
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onSearch={handleSearch}
      />

      {/* 轮播对话框 */}
      <ImageSlideshow
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
      />

      {/* 编辑器对话框 */}
      {editingImage && (
        <ImageEditor
          open={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setEditingImage(null);
          }}
          image={editingImage}
          onSave={() => {
            loadImages();
            setEditorOpen(false);
            setEditingImage(null);
          }}
        />
      )}

      {/* 添加标签对话框 */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>添加标签</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="标签（用逗号分隔）"
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
                    onDelete={async () => {
                      try {
                        await imageAPI.removeTags(selectedImage.id, [tag.id]);
                        showSnackbar('标签已删除', 'success');
                        loadImages();
                      } catch (error) {
                        showSnackbar('删除标签失败', 'error');
                      }
                    }}
                    sx={{ mt: 1 }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>取消</Button>
          <Button onClick={handleAddTags} variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

