import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Home as HomeIcon,
  Collections as CollectionsIcon,
  Label as LabelIcon,
  Favorite as FavoriteIcon,
  PhotoAlbum as AlbumIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  CloudUpload as UploadIcon,
  SmartToy as AiIcon,
} from '@mui/icons-material';
import { useState, createContext, useContext, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { imageAPI, aiAPI } from '../services/api';
import AISearchDialog from '../components/AISearchDialog';

const drawerWidth = 240;

const menuItems = [
  { text: '首页', icon: <HomeIcon />, path: '/' },
  { text: '全部图片', icon: <CollectionsIcon />, path: '/gallery' },
  { text: '个人相册', icon: <AlbumIcon />, path: '/albums' },
  { text: '图片分类', icon: <LabelIcon />, path: '/categories' },
  { text: '我的收藏', icon: <FavoriteIcon />, path: '/favorites' },
  { text: '个人信息', icon: <PersonIcon />, path: '/profile' },
];

// 创建搜索和筛选的Context
const SearchFilterContext = createContext();

export const useSearchFilter = () => {
  const context = useContext(SearchFilterContext);
  if (!context) {
    throw new Error('useSearchFilter must be used within SearchFilterProvider');
  }
  return context;
};

export default function MainLayout() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-uploaded_at');
  const [singleUploadDialogOpen, setSingleUploadDialogOpen] = useState(false);
  const [batchUploadDialogOpen, setBatchUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', tags: [] });
  const [batchForms, setBatchForms] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [aiDescriptionEnabled, setAiDescriptionEnabled] = useState(true);
  const [aiTagsEnabled, setAiTagsEnabled] = useState(true);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSearchDialogOpen, setAiSearchDialogOpen] = useState(false);
  const sortRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      setSortExpanded(false);
    }
  };

  const handleSortToggle = () => {
    // 如果已经展开，则收回；如果未展开，则展开
    setSortExpanded(!sortExpanded);
    if (!sortExpanded) {
      setSearchExpanded(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // 搜索逻辑在GalleryPage中自动触发
  };

  const handleSearchClear = () => {
    setSearchQuery('');
  };

  const handleSingleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // 验证文件是图片
    if (!files[0].type.startsWith('image/')) {
      showSnackbar('请只选择图片文件', 'error');
      return;
    }
    
    setSelectedFile(files[0]);
    setUploadForm({ 
      title: files[0].name.replace(/\.[^/.]+$/, ''), 
      description: '', 
      tags: [] 
    });
    
    // 如果启用了AI功能，自动分析图片
    if (aiDescriptionEnabled || aiTagsEnabled) {
      await analyzeImageWithAI(files[0]);
    }
  };

  const handleBatchFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    // 验证所有文件都是图片
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      showSnackbar('请只选择图片文件', 'error');
      return;
    }
    
    setSelectedFiles(files);
    // 初始化批量表单
    const forms = files.map(file => ({
      title: file.name.replace(/\.[^/.]+$/, ''), // 去掉扩展名
      description: '',
      tags: []
    }));
    setBatchForms(forms);
  };

  const analyzeImageWithAI = async (file) => {
    try {
      setAiAnalyzing(true);
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await aiAPI.analyzeImage(formData);
      
      // 如果启用了AI描述，设置描述
      if (aiDescriptionEnabled && response.data.description) {
        setUploadForm(prev => ({ ...prev, description: response.data.description }));
      }
      
      // 如果启用了AI标签，设置标签
      if (aiTagsEnabled && response.data.tags) {
        setUploadForm(prev => ({ ...prev, tags: response.data.tags }));
      }
      
      showSnackbar('AI分析完成', 'success');
    } catch (error) {
      console.error('AI分析失败:', error);
      showSnackbar('AI分析失败，您可以手动填写', 'warning');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSingleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('请选择要上传的图片', 'error');
      return;
    }

    if (!uploadForm.title) {
      showSnackbar('请输入图片标题', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title);
    formData.append('description', uploadForm.description);

    try {
      setUploading(true);
      const response = await imageAPI.upload(formData);
      
      // 如果有AI生成的标签，添加到图片上
      if (aiTagsEnabled && uploadForm.tags && uploadForm.tags.length > 0) {
        try {
          await imageAPI.addTags(response.data.id, uploadForm.tags, 'ai');
        } catch (error) {
          console.error('添加标签失败:', error);
        }
      }
      
      showSnackbar('上传成功', 'success');
      setSingleUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', tags: [] });
      setAiDescriptionEnabled(true);
      setAiTagsEnabled(true);
      setUploadSuccess(true);
    } catch (error) {
      showSnackbar('上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleBatchUpload = async () => {
    if (selectedFiles.length === 0) {
      showSnackbar('请选择要上传的图片', 'error');
      return;
    }
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });
    
    // 添加元数据
    formData.append('metadata', JSON.stringify(batchForms));
    
    try {
      setUploading(true);
      const response = await imageAPI.batchUpload(formData);
      
      showSnackbar(`成功上传 ${response.data.uploaded} 张图片`, 'success');
      setBatchUploadDialogOpen(false);
      setSelectedFiles([]);
      setBatchForms([]);
      setUploadSuccess(true);
    } catch (error) {
      showSnackbar('批量上传失败', 'error');
    } finally {
      setUploading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  // 点击外部关闭排序选项（handleSortToggle已经处理了筛选按钮的点击）
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortExpanded && sortRef.current && !sortRef.current.contains(event.target)) {
        setSortExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sortExpanded]);

  const sortOptions = [
    { label: '上传时间（从新到旧）', value: '-uploaded_at' },
    { label: '上传时间（从旧到新）', value: 'uploaded_at' },
    { label: '拍摄时间（从新到旧）', value: '-shot_at' },
    { label: '拍摄时间（从旧到新）', value: 'shot_at' },
    { label: '标题（A-Z）', value: 'title' },
    { label: '标题（Z-A）', value: '-title' },
  ];

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2.5, mb: 2 }} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/imageeee.png" alt="Logo" style={{ width: '300px', height: 'auto' }} />
        </Box>
      </Toolbar>

      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      
      <Divider sx={{ my: 2 }} />
      
      {/* 上传按钮 */}
      <Box sx={{ px: 2, pt: 1, display: 'flex', flexDirection: 'column', gap: 2.2}}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setSingleUploadDialogOpen(true)}
          sx={{
            background: 'rgb(103, 126, 230)',
            '&:hover': {
              background: 'rgb(93, 116, 220)',
            },
          }}
        >
          单张上传
        </Button>
        <Button
          fullWidth
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setBatchUploadDialogOpen(true)}
          sx={{
            background: 'rgb(130, 150, 241)',
            '&:hover': {
              background: 'rgb(120, 140, 231)',
            },
          }}
        >
          批量上传
        </Button>
      </Box>
      
      {/* <Box sx={{ flexGrow: 1 }} /> */}
      
      {/* AI检索按钮 */}
      <Box sx={{ px: 2, pb: 2 , pt: 2.3}}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AiIcon />}
          onClick={() => setAiSearchDialogOpen(true)}
          sx={{
            borderColor: 'rgb(120, 140, 231)',
            color: 'rgb(120, 140, 231)',
            '&:hover': {
              borderColor: 'rgb(110, 130, 221)',
              backgroundColor: 'rgba(120, 140, 231, 0.04)',
            },
          }}
        >
          AI检索
        </Button>
      </Box>
    </Box>
  );

  const searchFilterValue = {
    searchQuery,
    setSearchQuery,
    ordering,
    setOrdering,
    uploadSuccess,
    setUploadSuccess,
  };

  return (
    <SearchFilterContext.Provider value={searchFilterValue}>
      <Box sx={{ display: 'flex' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'white',
            color: 'text.primary',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}>
            {menuItems.find(item => item.path === location.pathname)?.text || '首页'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* 搜索按钮和搜索框 */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <IconButton 
                color="inherit" 
                onClick={handleSearchToggle}
                sx={{
                  transition: 'all 0.3s',
                  ...(searchExpanded && { color: 'primary.main' }),
                }}
              >
                <SearchIcon />
              </IconButton>
              <Box
                component="form"
                onSubmit={handleSearchSubmit}
                sx={{
                  position: 'absolute',
                  right: 40,
                  width: searchExpanded ? '300px' : '0px',
                  overflow: 'hidden',
                  transition: 'width 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <TextField
                  size="small"
                  placeholder="搜索图片..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    width: '100%',
                    bgcolor: 'white',
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(0, 0, 0, 0.23)',
                      },
                    },
                  }}
                />
                {searchQuery && (
                  <IconButton
                    size="small"
                    onClick={handleSearchClear}
                    sx={{ position: 'absolute', right: 8 }}
                  >
                    <Typography variant="caption">✕</Typography>
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* 筛选按钮 */}
            <IconButton 
              color="inherit" 
              onClick={handleSortToggle}
              sx={{
                transition: 'all 0.3s',
                ...(sortExpanded && { color: 'primary.main' }),
              }}
            >
              <FilterIcon />
            </IconButton>

            <IconButton onClick={handleUserMenuOpen} sx={{ ml: 1 }}>
              <Avatar
                src={user?.avatar_url}
                alt={user?.username}
                sx={{ width: 32, height: 32 }}
              >
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
            </IconButton>
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' } }}>
              {user?.username}
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
          >
            <MenuItem onClick={() => { navigate('/profile'); handleUserMenuClose(); }}>
              个人信息
            </MenuItem>
            <MenuItem onClick={handleLogout}>退出登录</MenuItem>
          </Menu>
        </Toolbar>

        {/* 排序选项下拉面板 */}
        <Box
          ref={sortRef}
          sx={{
            maxHeight: sortExpanded ? '300px' : '0px',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
            bgcolor: 'background.paper',
            borderTop: sortExpanded ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              排序方式
            </Typography>
            <RadioGroup
              value={ordering}
              onChange={(e) => setOrdering(e.target.value)}
            >
              {sortOptions.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </Box>
        </Box>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          bgcolor: '#f5f5f5',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </Box>

      {/* 单张上传对话框 */}
      <Dialog 
        open={singleUploadDialogOpen} 
        onClose={() => setSingleUploadDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>单张上传</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="single-file-upload"
              type="file"
              onChange={handleSingleFileSelect}
            />
            <label htmlFor="single-file-upload">
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
            {aiAnalyzing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="primary">
                  AI正在分析图片...
                </Typography>
              </Box>
            )}
            <TextField
              fullWidth
              label="标题（必填）"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="描述"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
              disabled={aiDescriptionEnabled}
              helperText={aiDescriptionEnabled ? "AI描述已启用" : ""}
            />
            
            {uploadForm.tags && uploadForm.tags.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  AI生成的标签:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {uploadForm.tags.map((tag, index) => (
                    <Box
                      key={index}
                      sx={{
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1,
                        bgcolor: 'primary.light',
                        color: 'white',
                        fontSize: '0.875rem',
                      }}
                    >
                      {tag}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
            
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="subtitle2" gutterBottom>
                AI功能
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Button
                  variant={aiDescriptionEnabled ? "contained" : "outlined"}
                  startIcon={<AiIcon />}
                  size="small"
                  onClick={() => {
                    setAiDescriptionEnabled(!aiDescriptionEnabled);
                    if (aiDescriptionEnabled) {
                      setUploadForm({ ...uploadForm, description: '' });
                    }
                  }}
                >
                  {aiDescriptionEnabled ? "✓ AI生成描述" : "AI生成描述"}
                </Button>
                <Button
                  variant={aiTagsEnabled ? "contained" : "outlined"}
                  startIcon={<AiIcon />}
                  size="small"
                  onClick={() => {
                    setAiTagsEnabled(!aiTagsEnabled);
                    if (aiTagsEnabled) {
                      setUploadForm({ ...uploadForm, tags: [] });
                    }
                  }}
                >
                  {aiTagsEnabled ? "✓ AI生成标签" : "AI生成标签"}
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <Typography variant="caption" color="text.secondary" sx={{ pl: 3}}>
          Powered by Google Gemini 2.0 Flash
        </Typography>

        <DialogActions>
          <Button onClick={() => {
            setSingleUploadDialogOpen(false);
            setSelectedFile(null);
            setUploadForm({ title: '', description: '', tags: [] });
            setAiDescriptionEnabled(true);
            setAiTagsEnabled(true);
          }}>
            取消
          </Button>
          <Button 
            onClick={handleSingleUpload} 
            disabled={uploading || !selectedFile || aiAnalyzing} 
            variant="contained"
          >
            {uploading ? <CircularProgress size={24} /> : '上传'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 批量上传对话框 */}
      <Dialog 
        open={batchUploadDialogOpen} 
        onClose={() => setBatchUploadDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'white',
          color: 'black',
          py: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <UploadIcon />
            <Typography variant="h6" component="span">
              批量上传 {selectedFiles.length > 0 && `(${selectedFiles.length}张)`}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 , mt: 1}}>
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="batch-file-upload"
              type="file"
              multiple
              onChange={handleBatchFileSelect}
            />
            <label htmlFor="batch-file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ 
                  mb: 3,
                  py: 1.5,
                  borderRadius: 1.5,
                  borderWidth: 2,
                  borderStyle: 'dashed',
                  borderColor: 'rgb(120, 140, 231)',
                  color: 'rgb(120, 140, 231)',
                  '&:hover': {
                    borderWidth: 2,
                    borderColor: 'rgb(110, 130, 221)',
                    backgroundColor: 'rgba(120, 140, 231, 0.04)',
                  }
                }}
              >
                {selectedFiles.length > 0 ? '重新选择图片' : '选择多张图片'}
              </Button>
            </label>
            
            {selectedFiles.length > 0 && (
              <Box sx={{ maxHeight: '450px', overflowY: 'auto', pr: 1 }}>
                {selectedFiles.map((file, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      mb: 2.5, 
                      p: 2.5, 
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                        borderColor: 'rgb(120, 140, 231)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgb(120, 140, 231) 0%, rgb(90, 110, 201) 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          mr: 2,
                          flexShrink: 0
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600,
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {file.name}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      label="标题"
                      value={batchForms[index]?.title || ''}
                      onChange={(e) => {
                        const newForms = [...batchForms];
                        newForms[index] = { ...newForms[index], title: e.target.value };
                        setBatchForms(newForms);
                      }}
                      size="small"
                      margin="dense"
                      sx={{ mb: 1.5 }}
                    />
                    <TextField
                      fullWidth
                      label="描述"
                      value={batchForms[index]?.description || ''}
                      onChange={(e) => {
                        const newForms = [...batchForms];
                        newForms[index] = { ...newForms[index], description: e.target.value };
                        setBatchForms(newForms);
                      }}
                      size="small"
                      margin="dense"
                      multiline
                      rows={2}
                      sx={{ mb: 1.5 }}
                    />
                    <TextField
                      fullWidth
                      label="标签（用逗号分隔）"
                      value={batchForms[index]?.tags?.join(', ') || ''}
                      onChange={(e) => {
                        const newForms = [...batchForms];
                        const tags = e.target.value.split(',').map(t => t.trim()).filter(t => t);
                        newForms[index] = { ...newForms[index], tags };
                        setBatchForms(newForms);
                      }}
                      size="small"
                      margin="dense"
                      placeholder="例如: 风景, 旅行, 自然"
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>

        <Typography variant="caption" color="text.secondary" sx={{ pl: 3, mt: -2}}>
          注意：批量上传时，不可使用AI功能
        </Typography>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => {
              setBatchUploadDialogOpen(false);
              setSelectedFiles([]);
              setBatchForms([]);
            }}
            sx={{ 
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            取消
          </Button>
          <Button 
            onClick={handleBatchUpload} 
            disabled={uploading || selectedFiles.length === 0} 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, rgb(120, 140, 231) 0%, rgb(90, 110, 201) 100%)',
              px: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, rgb(110, 130, 221) 0%, rgb(80, 100, 191) 100%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)'
              }
            }}
          >
            {uploading ? <CircularProgress size={24} color="inherit" /> : '开始上传'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 提示信息 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      {/* AI检索对话框 */}
      <AISearchDialog
        open={aiSearchDialogOpen}
        onClose={() => setAiSearchDialogOpen(false)}
        onImageClick={(image) => {
          // 可以在这里处理图片点击事件，例如跳转到图片详情页
          console.log('Selected image:', image);
        }}
      />
    </Box>
    </SearchFilterContext.Provider>
  );
}

