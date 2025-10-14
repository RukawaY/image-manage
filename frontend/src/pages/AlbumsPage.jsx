import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { albumAPI } from '../services/api';

export default function AlbumsPage() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  useEffect(() => {
    loadAlbums();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const response = await albumAPI.list();
      // 确保 albums 始终是数组
      const albumsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载相册失败:', error);
      showSnackbar('加载相册失败', 'error');
      setAlbums([]); // 出错时设置为空数组
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (album = null) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        name: album.name,
        description: album.description || '',
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setOpenDialog(true);
    handleCloseMenu();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAlbum(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showSnackbar('请输入相册名称', 'error');
      return;
    }

    try {
      if (editingAlbum) {
        await albumAPI.update(editingAlbum.id, formData);
        showSnackbar('相册更新成功', 'success');
      } else {
        await albumAPI.create(formData);
        showSnackbar('相册创建成功', 'success');
      }
      handleCloseDialog();
      loadAlbums();
    } catch (error) {
      console.error('保存相册失败:', error);
      showSnackbar('保存相册失败', 'error');
    }
  };

  const handleDelete = async (albumId) => {
    if (!window.confirm('确定要删除这个相册吗？相册中的图片不会被删除。')) {
      return;
    }

    try {
      await albumAPI.delete(albumId);
      showSnackbar('相册删除成功', 'success');
      loadAlbums();
    } catch (error) {
      console.error('删除相册失败:', error);
      showSnackbar('删除相册失败', 'error');
    }
    handleCloseMenu();
  };

  const handleOpenMenu = (event, album) => {
    setAnchorEl(event.currentTarget);
    setSelectedAlbum(album);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAlbum(null);
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          我的相册
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2 }}
        >
          创建相册
        </Button>
      </Box>

      {albums.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            color: 'text.secondary',
          }}
        >
          <ImageIcon sx={{ fontSize: 80, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" gutterBottom>
            还没有相册
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            点击"创建相册"按钮创建您的第一个相册
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {albums.map((album) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={album.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
                  },
                }}
              >
                {album.preview_images && album.preview_images.length > 0 ? (
                  <Box sx={{ position: 'relative', paddingTop: '75%' }}>
                    <ImageList
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        margin: 0,
                      }}
                      cols={2}
                      gap={2}
                    >
                      {album.preview_images.slice(0, 4).map((image, index) => (
                        <ImageListItem key={index}>
                          <img
                            src={image.thumbnail_url || image.file_url}
                            alt={image.title}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      paddingTop: '75%',
                      position: 'relative',
                      bgcolor: 'grey.200',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageIcon
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: 60,
                        color: 'grey.400',
                      }}
                    />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        gutterBottom
                        sx={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {album.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {album.description || '暂无简介'}
                      </Typography>
                      <Typography variant="body2" color="primary" fontWeight="medium">
                        {album.image_count} 张图片
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleOpenMenu(e, album)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedAlbum)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          编辑
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedAlbum?.id)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>

      {/* 创建/编辑相册对话框 */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAlbum ? '编辑相册' : '创建相册'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="相册名称"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            margin="dense"
            label="相册简介"
            fullWidth
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingAlbum ? '保存' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示消息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

