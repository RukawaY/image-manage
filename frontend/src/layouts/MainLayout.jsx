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
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: '', description: '', tags: [] });
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

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showSnackbar('请选择图片文件', 'error');
        return;
      }
      setSelectedFile(file);
      
      // 如果启用了AI功能，自动分析图片
      if (aiDescriptionEnabled || aiTagsEnabled) {
        await analyzeImageWithAI(file);
      }
    }
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

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar('请选择要上传的图片', 'error');
      return;
    }

    if (!uploadForm.title && !selectedFile.name) {
      showSnackbar('请输入图片标题', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('title', uploadForm.title || selectedFile.name);
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
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadForm({ title: '', description: '', tags: [] });
      setAiDescriptionEnabled(true);
      setAiTagsEnabled(true);
      setUploadSuccess(true); // 标记上传成功，通知子页面刷新
    } catch (error) {
      showSnackbar('上传失败', 'error');
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
      <Box sx={{ px: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
          sx={{
            background: 'rgb(120, 140, 231)',
            '&:hover': {
              background: 'rgb(110, 130, 221)',
            },
          }}
        >
          上传图片
        </Button>
      </Box>
      
      <Box sx={{ flexGrow: 1 }} />
      
      {/* AI检索按钮 */}
      <Box sx={{ px: 2, pb: 2 }}>
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
    uploadDialogOpen,
    setUploadDialogOpen,
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
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setSelectedFile(null);
            setUploadForm({ title: '', description: '', tags: [] });
            setAiDescriptionEnabled(true);
            setAiTagsEnabled(true);
          }}>
            取消
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !selectedFile || aiAnalyzing} variant="contained">
            {uploading ? <CircularProgress size={24} /> : '上传'}
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

