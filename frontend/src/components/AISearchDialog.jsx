import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  SmartToy as AiIcon,
} from '@mui/icons-material';
import { aiAPI } from '../services/api';

export default function AISearchDialog({ open, onClose, onImageClick }) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('请输入搜索内容');
      return;
    }

    try {
      setSearching(true);
      setError('');
      const response = await aiAPI.searchImages(query);
      setResults(response.data);
    } catch (err) {
      setError('搜索失败，请重试');
      console.error('AI搜索失败:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleClose = () => {
    setQuery('');
    setResults(null);
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '600px',
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 2 }}>
        <AiIcon color="primary" />
        <Typography variant="h6" component="span">
          AI智能检索
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 搜索框 */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="用自然语言描述你想找的图片，例如：找出所有包含蓝天的风景照"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={searching}
            size="medium"
            multiline
            maxRows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={searching || !query.trim()}
            sx={{
              minWidth: '100px',
              borderRadius: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)',
              },
            }}
          >
            {searching ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </Button>
        </Box>

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {/* 搜索结果 */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {searching && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, py: 4 }}>
              <CircularProgress />
              <Typography color="text.secondary">AI正在为您搜索...</Typography>
            </Box>
          )}

          {!searching && results && (
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
                搜索: "{results.query}" - 找到 {results.count} 张相关图片
              </Typography>

              {results.count === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    未找到相关图片，请尝试其他描述
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {results.results.map((image) => (
                    <Card
                      key={image.id}
                      sx={{
                        display: 'flex',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 4,
                        },
                      }}
                      onClick={() => {
                        if (onImageClick) {
                          onImageClick(image);
                        }
                        handleClose();
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{ width: 160, height: 120, objectFit: 'cover' }}
                        image={image.thumbnail_url || image.file_url}
                        alt={image.title}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {image.title || '无标题'}
                        </Typography>
                        {image.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {image.description}
                          </Typography>
                        )}
                        {image.tags && image.tags.length > 0 && (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 1 }}>
                            {image.tags.slice(0, 4).map((tag) => {
                              const getTagColor = (source) => {
                                switch (source) {
                                  case 'user':
                                    return { bgcolor: '#4CAF50', color: '#fff' };
                                  case 'ai':
                                    return { bgcolor: '#2196F3', color: '#fff' };
                                  case 'exif':
                                    return { bgcolor: '#FF9800', color: '#fff' };
                                  default:
                                    return { bgcolor: '#9E9E9E', color: '#fff' };
                                }
                              };
                              
                              return (
                                <Chip
                                  key={tag.id}
                                  label={tag.name}
                                  size="small"
                                  sx={{
                                    mt: 0.5,
                                    ...getTagColor(tag.source),
                                  }}
                                />
                              );
                            })}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}

          {!searching && !results && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <AiIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography color="text.secondary" variant="body1">
                使用AI智能检索，用自然语言找到您想要的图片
              </Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                例如："找出所有拍摄于晚上的照片" 或 "有动物的图片"
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
          Powered by Google Gemini 2.0 Flash
        </Typography>
        <Button onClick={handleClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}

