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

    // 前端验证
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
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: 20,
          mb: -20
        }}
      >
        <img
          src="/imageeee.png"
          alt="Login Logo"
          style={{
            maxWidth: '500px',
            height: 'auto'
          }}
        />
      </Box>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={3} sx={{ width: '100%', overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="登录" />
              <Tab label="注册" />
            </Tabs>
          </Box>

          {error && (
            <Box sx={{ p: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h5" gutterBottom align="center">
              欢迎回来
            </Typography>
            <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="用户名"
                name="username"
                value={loginForm.username}
                onChange={handleLoginChange}
                margin="normal"
                required
                autoFocus
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
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '登录'}
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h5" gutterBottom align="center">
              创建账户
            </Typography>
            <Box component="form" onSubmit={handleRegister} sx={{ mt: 2 }}>
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
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                sx={{ mt: 3 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '注册'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
}

