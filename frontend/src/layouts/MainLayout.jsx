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
} from '@mui/icons-material';
import { useState, createContext, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';

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

  const sortOptions = [
    { label: '上传时间（从新到旧）', value: '-uploaded_at' },
    { label: '上传时间（从旧到新）', value: 'uploaded_at' },
    { label: '拍摄时间（从新到旧）', value: '-shot_at' },
    { label: '拍摄时间（从旧到新）', value: 'shot_at' },
    { label: '标题（A-Z）', value: 'title' },
    { label: '标题（Z-A）', value: '-title' },
  ];

  const drawer = (
    <div>
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
    </div>
  );

  const searchFilterValue = {
    searchQuery,
    setSearchQuery,
    ordering,
    setOrdering,
    uploadDialogOpen,
    setUploadDialogOpen,
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
    </Box>
    </SearchFilterContext.Provider>
  );
}

