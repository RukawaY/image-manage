import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Folder as FolderIcon,
  Input as InputIcon,
  Output as OutputIcon,
  Collections as CollectionsIcon,
} from '@mui/icons-material';
import { albumAPI, imageAPI } from '../services/api';

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
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(''); // 'import' or 'remove' or 'create'
  const [albumImages, setAlbumImages] = useState([]);

  useEffect(() => {
    loadAlbums();
    loadAllImages();
  }, []);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const response = await albumAPI.list();
      const albumsData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setAlbums(albumsData);
    } catch (error) {
      console.error('加载相册失败:', error);
      showSnackbar('加载相册失败', 'error');
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllImages = async () => {
    try {
      const response = await imageAPI.list();
      const imagesData = Array.isArray(response.data) 
        ? response.data 
        : (response.data?.results || []);
      setAllImages(imagesData);
    } catch (error) {
      console.error('加载图片失败:', error);
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
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingAlbum(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  const handleOpenCreateDialog = async () => {
    setDialogMode('create');
    setSelectedImages([]);
    setOpenImageDialog(true);
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
        const response = await albumAPI.create(formData);
        // 如果是通过图片选择对话框创建的，添加选中的图片
        if (dialogMode === 'create' && selectedImages.length > 0) {
          await albumAPI.addImages(response.data.id, selectedImages);
        }
        showSnackbar('相册创建成功', 'success');
      }
      handleCloseDialog();
      setOpenImageDialog(false);
      setDialogMode('');
      loadAlbums();
    } catch (error) {
      console.error('保存相册失败:', error);
      showSnackbar('保存相册失败', 'error');
    }
  };

  const handleDelete = async (album) => {
    if (!window.confirm('确定要删除这个相册吗？相册中的图片不会被删除。')) {
      return;
    }

    try {
      await albumAPI.delete(album.id);
      showSnackbar('相册删除成功', 'success');
      loadAlbums();
    } catch (error) {
      console.error('删除相册失败:', error);
      showSnackbar('删除相册失败', 'error');
    }
  };

  const handleOpenImportDialog = async (album) => {
    setSelectedAlbum(album);
    setDialogMode('import');
    setSelectedImages([]);
    setOpenImageDialog(true);
  };

  const handleOpenRemoveDialog = async (album) => {
    setSelectedAlbum(album);
    setDialogMode('remove');
    setSelectedImages([]);
    
    // 加载相册中的图片
    try {
      const response = await albumAPI.get(album.id);
      setAlbumImages(response.data.images || []);
    } catch (error) {
      console.error('加载相册图片失败:', error);
      showSnackbar('加载相册图片失败', 'error');
    }
    
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
    setSelectedAlbum(null);
    setDialogMode('');
    setSelectedImages([]);
    setAlbumImages([]);
  };

  const handleToggleImage = (imageId) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleImportImages = async () => {
    if (selectedImages.length === 0) {
      showSnackbar('请选择要导入的图片', 'warning');
      return;
    }

    try {
      await albumAPI.addImages(selectedAlbum.id, selectedImages);
      showSnackbar('图片导入成功', 'success');
      handleCloseImageDialog();
      loadAlbums();
    } catch (error) {
      console.error('导入图片失败:', error);
      showSnackbar('导入图片失败', 'error');
    }
  };

  const handleRemoveImages = async () => {
    if (selectedImages.length === 0) {
      showSnackbar('请选择要移出的图片', 'warning');
      return;
    }

    try {
      await albumAPI.removeImages(selectedAlbum.id, selectedImages);
      showSnackbar('图片移出成功', 'success');
      handleCloseImageDialog();
      loadAlbums();
    } catch (error) {
      console.error('移出图片失败:', error);
      showSnackbar('移出图片失败', 'error');
    }
  };

  const handleConfirmImageSelection = () => {
    if (dialogMode === 'import') {
      handleImportImages();
    } else if (dialogMode === 'remove') {
      handleRemoveImages();
    } else if (dialogMode === 'create') {
      // 打开创建对话框
      setOpenImageDialog(false);
      setOpenDialog(true);
    }
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: -4.25 }}>
        <Typography variant="h5" component="h1">
          我的相册
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
        }}
      >

        {/* 相册卡片列表 */}
        {albums.map((album) => (
          <Card
            key={album.id}
            sx={{
              width: 320,
              height: 400,
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 6,
              },
            }}
          >
            {/* 相册图片预览 */}
            <Box
              sx={{
                position: 'relative',
                width: 320,
                height: 240,
                overflow: 'hidden',
                bgcolor: 'grey.200',
              }}
            >
              {album.preview_images && album.preview_images.length > 0 ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {album.preview_images.slice(0, 3).map((image, index) => (
                    <Box
                      key={index}
                      component="img"
                      src={image.thumbnail_url || image.file_url}
                      alt={image.title}
                      sx={{
                        position: 'absolute',
                        width: '75%',
                        height: '75%',
                        objectFit: 'cover',
                        borderRadius: 1,
                        boxShadow: 2,
                        transform: `rotate(${(index - 1) * 10}deg) translateY(${(index - 1) * 12}px)`,
                        zIndex: 3 - index,
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CollectionsIcon sx={{ fontSize: 80, color: 'grey.400' }} />
                </Box>
              )}
            </Box>

            {/* 相册信息 */}
            <CardContent sx={{ flexGrow: 1, pb: 1 }}>
              <Typography gutterBottom variant="h6" component="div" noWrap>
                {album.name || '无标题'}
              </Typography>
              {album.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 1,
                  }}
                >
                  {album.description}
                </Typography>
              )}
              <Typography variant="body2" color="primary" fontWeight="medium">
                {album.image_count} 张图片
              </Typography>
            </CardContent>

            {/* 操作按钮 */}
            <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {/* 编辑按钮 */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDialog(album);
                  }}
                  title="编辑"
                >
                  <EditIcon />
                </IconButton>

                {/* 导入按钮 */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImportDialog(album);
                  }}
                  title="导入图片"
                >
                  <InputIcon />
                </IconButton>

                {/* 移出按钮 */}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRemoveDialog(album);
                  }}
                  title="移出图片"
                  disabled={!album.image_count || album.image_count === 0}
                >
                  <OutputIcon />
                </IconButton>
              </Box>

              {/* 删除按钮 */}
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(album);
                }}
                title="删除"
              >
                <DeleteIcon />
              </IconButton>
            </CardActions>
          </Card>
        ))}

        {/* 创建相册卡片 */}
        <Card
          sx={{
            width: 320,
            height: 400,
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            border: '2px dashed',
            borderColor: 'grey.400',
            bgcolor: 'transparent',
            boxShadow: 'none',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              bgcolor: 'action.hover',
            },
          }}
          onClick={handleOpenCreateDialog}
        >
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddIcon sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              创建相册
            </Typography>
          </Box>
        </Card>
      </Box>

      {/* 图片选择对话框 */}
      <Dialog 
        open={openImageDialog} 
        onClose={handleCloseImageDialog} 
        maxWidth="lg" 
        fullWidth
      >
        <DialogTitle>
          {dialogMode === 'import' && '选择要导入的图片'}
          {dialogMode === 'remove' && '选择要移出的图片'}
          {dialogMode === 'create' && '选择相册初始图片（可选）'}
        </DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 2,
              mt: 2,
            }}
          >
            {(dialogMode === 'remove' ? albumImages : allImages).map((image) => (
              <Box
                key={image.id}
                sx={{
                  position: 'relative',
                  cursor: 'pointer',
                  border: selectedImages.includes(image.id) ? '3px solid' : '1px solid',
                  borderColor: selectedImages.includes(image.id) ? 'primary.main' : 'grey.300',
                  borderRadius: 1,
                  overflow: 'hidden',
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
                onClick={() => handleToggleImage(image.id)}
              >
                <Box
                  component="img"
                  src={image.thumbnail_url || image.file_url}
                  alt={image.title}
                  sx={{
                    width: '100%',
                    height: 150,
                    objectFit: 'cover',
                  }}
                />
                <Checkbox
                  checked={selectedImages.includes(image.id)}
                  sx={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    bgcolor: 'white',
                    '&:hover': { bgcolor: 'white' },
                  }}
                />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>取消</Button>
          <Button onClick={handleConfirmImageSelection} variant="contained">
            {dialogMode === 'create' ? '下一步' : '确定'}
          </Button>
        </DialogActions>
      </Dialog>

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

