import { useState } from 'react';
import {
  Container,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AuthPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError('');
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(loginForm);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.non_field_errors?.[0] || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (registerForm.password !== registerForm.password_confirm) {
      setError('两次密码输入不一致');
      setLoading(false);
      return;
    }

    if (registerForm.username.length < 6) {
      setError('用户名至少需要6个字符');
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setError('密码至少需要6个字符');
      setLoading(false);
      return;
    }

    try {
      await register(registerForm);
      navigate('/');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        const errorMsg = Object.values(errors).flat().join(', ');
        setError(errorMsg);
      } else {
        setError('注册失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,rgb(120, 140, 231) 0%,rgb(111, 59, 162) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 装饰性背景元素 */}
      <Box
        sx={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-250px',
          right: '-250px',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-150px',
          left: '-150px',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={24}
          sx={{
            overflow: 'hidden',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* 固定的顶部 */}
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <img src="/imageeee.png" alt="Logo" style={{ width: '400px', height: 'auto' }} />
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              你的专属图片管理平台
            </Typography>
          </Box>

          {/* 标签页 */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="登录" sx={{ minWidth: 120, fontWeight: 'medium' }} />
              <Tab label="注册" sx={{ minWidth: 120, fontWeight: 'medium' }} />
            </Tabs>
          </Box>

          {error && (
            <Box sx={{ p: 2, pb: 0 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                label="用户名"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                margin="normal"
                required
                autoFocus
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="密码"
                name="password"
                type="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                margin="normal"
                required
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4193 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '登录'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleRegister}>
              <TextField
                fullWidth
                label="用户名"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                margin="normal"
                required
                helperText="至少6个字符"
                autoFocus
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="邮箱"
                name="email"
                type="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                margin="normal"
                required
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="密码"
                name="password"
                type="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                margin="normal"
                required
                helperText="至少6个字符"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="确认密码"
                name="password_confirm"
                type="password"
                value={registerForm.password_confirm}
                onChange={handleRegisterChange}
                margin="normal"
                required
                sx={{ mb: 3 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5568d3 0%, #6a4193 100%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : '注册'}
              </Button>
            </Box>
          </TabPanel>

          {/* 底部装饰 */}
          <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', fontSize: '0.875rem' }}>
            © 2025 Imageeee. 让每一张照片都有故事
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
