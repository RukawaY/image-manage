import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Box,
  Avatar,
  Typography,
  Button,
  TextField,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Image as ImageIcon,
  PhotoAlbum as AlbumIcon,
  Storage as StorageIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, statisticsAPI } from '../services/api';

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [form, setForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statistics, setStatistics] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setStatsLoading(true);
      const response = await statisticsAPI.getUserStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showSnackbar('请选择图片文件', 'error');
        return;
      }
      setAvatarFile(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      setLoading(true);
      await authAPI.uploadAvatar(formData);
      showSnackbar('头像上传成功', 'success');
      setAvatarFile(null);
      await checkAuth();
    } catch (error) {
      showSnackbar('头像上传失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    try {
      setLoading(true);
      const data = {
        username: form.username,
        email: form.email,
        bio: form.bio,
      };
      await authAPI.updateUser(data);
      showSnackbar('信息更新成功', 'success');
      await checkAuth();
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMsg = Object.values(errors).flat().join(', ');
        showSnackbar(errorMsg, 'error');
      } else {
        showSnackbar('更新失败', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!form.old_password || !form.new_password) {
      showSnackbar('请填写原密码和新密码', 'error');
      return;
    }

    if (form.new_password !== form.new_password_confirm) {
      showSnackbar('两次密码输入不一致', 'error');
      return;
    }

    if (form.new_password.length < 6) {
      showSnackbar('新密码至少需要6个字符', 'error');
      return;
    }

    try {
      setLoading(true);
      await authAPI.updateUser({
        old_password: form.old_password,
        new_password: form.new_password,
        new_password_confirm: form.new_password_confirm,
      });
      showSnackbar('密码修改成功', 'success');
      setForm({
        ...form,
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error) {
      const errors = error.response?.data;
      if (errors) {
        const errorMsg = Object.values(errors).flat().join(', ');
        showSnackbar(errorMsg, 'error');
      } else {
        showSnackbar('密码修改失败', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        个人信息
      </Typography>

      {/* 数据统计部分 */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          数据统计
        </Typography>
        
        {statsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : statistics ? (
          <>
            {/* 统计卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ImageIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">图片总数</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total_images}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'secondary.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AlbumIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">相册总数</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total_albums}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <StorageIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">占用空间</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total_size_mb} MB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrendingUpIcon sx={{ mr: 1 }} />
                      <Typography variant="body2">平均大小</Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold">
                      {statistics.total_images > 0 
                        ? (statistics.total_size_mb / statistics.total_images).toFixed(2) 
                        : 0} MB
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* 按年份统计图表 */}
            {statistics.yearly_stats && statistics.yearly_stats.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  按年份上传统计
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {statistics.yearly_stats.map((stat, index) => {
                    const maxCount = Math.max(...statistics.yearly_stats.map(s => s.count));
                    const percentage = (stat.count / maxCount) * 100;
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{stat.year}年</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stat.count} 张
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: 'primary.main',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* 按月份统计图表 */}
            {statistics.monthly_stats && statistics.monthly_stats.length > 0 && (
              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                  近12个月上传统计
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {statistics.monthly_stats.map((stat, index) => {
                    const maxCount = Math.max(...statistics.monthly_stats.map(s => s.count));
                    const percentage = (stat.count / maxCount) * 100;
                    return (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{stat.month}</Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {stat.count} 张
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 8,
                            bgcolor: 'grey.200',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              bgcolor: 'secondary.main',
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}
          </>
        ) : (
          <Typography color="text.secondary">暂无统计数据</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 4, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          基本信息
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar src={user?.avatar_url} alt={user?.username} sx={{ width: 100, height: 100, mr: 3 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarSelect}
            />
            <label htmlFor="avatar-upload">
              <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                选择头像
              </Button>
            </label>
            {avatarFile && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  {avatarFile.name}
                </Typography>
                <Button size="small" onClick={handleAvatarUpload} disabled={loading}>
                  上传
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="用户名"
              name="username"
              value={form.username}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="邮箱"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="个人简介"
              name="bio"
              value={form.bio}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        <Button variant="contained" onClick={handleUpdateInfo} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '更新信息'}
        </Button>
      </Paper>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          修改密码
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          密码至少需要6个字符
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="原密码"
              name="old_password"
              type="password"
              value={form.old_password}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="新密码"
              name="new_password"
              type="password"
              value={form.new_password}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="确认新密码"
              name="new_password_confirm"
              type="password"
              value={form.new_password_confirm}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
        <Button variant="contained" onClick={handleUpdatePassword} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : '修改密码'}
        </Button>
      </Paper>

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

