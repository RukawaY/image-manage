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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ordering, setOrdering] = useState('-uploaded_at');
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

  const handleSearchSubmit = () => {
    setSearchDialogOpen(false);
  };

  const handleSortSubmit = () => {
    setSortDialogOpen(false);
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
    </div>
  );

  const searchFilterValue = {
    searchQuery,
    setSearchQuery,
    ordering,
    setOrdering,
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
            <IconButton color="inherit" onClick={() => setSearchDialogOpen(true)}>
              <SearchIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setSortDialogOpen(true)}>
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

      {/* 搜索对话框 */}
      <Dialog open={searchDialogOpen} onClose={() => setSearchDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>搜索图片</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="搜索关键词"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            margin="normal"
            autoFocus
            placeholder="搜索标题、描述、标签或地点..."
            helperText="输入关键词后点击搜索按钮"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSearchQuery(''); setSearchDialogOpen(false); }}>清除</Button>
          <Button onClick={() => setSearchDialogOpen(false)}>取消</Button>
          <Button onClick={handleSearchSubmit} variant="contained">搜索</Button>
        </DialogActions>
      </Dialog>

      {/* 排序对话框 */}
      <Dialog open={sortDialogOpen} onClose={() => setSortDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>排序方式</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            sx={{ mt: 2 }}
          >
            {sortOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio />}
                label={option.label}
              />
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSortDialogOpen(false)}>取消</Button>
          <Button onClick={handleSortSubmit} variant="contained">确定</Button>
        </DialogActions>
      </Dialog>
    </Box>
    </SearchFilterContext.Provider>
  );
}

