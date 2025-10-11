import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  IconButton,
  Typography,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalOffer as TagIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { tagAPI, imageAPI } from '../services/api';

export default function TagEditor({ open, onClose, image, onSave }) {
  const [imageTags, setImageTags] = useState([]); // 当前图片的标签
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [editingTagId, setEditingTagId] = useState(null);
  const [editingTagName, setEditingTagName] = useState('');

  useEffect(() => {
    if (open && image) {
      // 加载当前图片的标签
      setImageTags([...(image.tags || [])]);
      setTagInput('');
      setEditingTagId(null);
    }
  }, [open, image]);

  // 开始编辑标签
  const startEditTag = (tag) => {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  };

  // 保存标签编辑（修改标签名称）
  const saveTagEdit = async () => {
    if (!editingTagName.trim() || !editingTagId) return;
    
    try {
      // 更新标签名称（全局修改）
      await tagAPI.update(editingTagId, { name: editingTagName.trim() });
      
      // 更新本地显示
      setImageTags(imageTags.map(tag => 
        tag.id === editingTagId ? { ...tag, name: editingTagName.trim() } : tag
      ));
      
      setEditingTagId(null);
      setEditingTagName('');
    } catch (error) {
      console.error('更新标签失败:', error);
      alert('更新标签失败，请重试');
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTagId(null);
    setEditingTagName('');
  };

  // 删除标签（从当前图片移除）
  const deleteTag = (tagId) => {
    setImageTags(imageTags.filter(tag => tag.id !== tagId));
  };

  // 解析输入框内容（支持分号分隔）
  const parseTagInput = (input) => {
    return input
      .split(/[;；]/) // 支持中英文分号
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  // 添加标签
  const handleAddTags = async () => {
    const tagNames = parseTagInput(tagInput);
    if (tagNames.length === 0) return;

    try {
      setLoading(true);

      for (const tagName of tagNames) {
        // 检查当前图片是否已有此标签
        const alreadyHas = imageTags.find(
          t => t.name.toLowerCase() === tagName.toLowerCase()
        );
        if (alreadyHas) continue; // 跳过已存在的

        // 创建或获取标签（后端会处理重复的情况）
        const response = await tagAPI.create({
          name: tagName,
          source: 'user',
        });
        const tag = response.data;
        setImageTags(prev => [...prev, tag]);
      }

      setTagInput('');
    } catch (error) {
      console.error('添加标签失败:', error);
      alert('添加标签失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 保存所有修改
  const handleSave = async () => {
    if (!image) return;

    try {
      setSaving(true);
      
      // 提交当前图片的标签列表
      const tagIds = imageTags.map(tag => tag.id);
      await imageAPI.updateTags(image.id, { tag_ids: tagIds });

      onSave();
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        <TagIcon color="primary" />
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          编辑标签
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3, minHeight: 300 }}>
        <Box>
          {/* 上排：当前图片的标签展示区 */}
          <Box sx={{ mb: 4 , mt: 2}}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>
              标签列表
            </Typography>
            
            {imageTags.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 2 }}>
                暂无标签，请在下方添加
              </Typography>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2.5, // 增加间隔
                minHeight: 80,
                p: 2.5,
                bgcolor: 'grey.50',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
              }}>
                {imageTags.map((tag) => {
                  const isEditing = editingTagId === tag.id;

                  if (isEditing) {
                    // 编辑模式
                    return (
                      <Box
                        key={tag.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          bgcolor: 'white',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          borderRadius: 2,
                          boxShadow: 1,
                        }}
                      >
                        <TextField
                          size="small"
                          value={editingTagName}
                          onChange={(e) => setEditingTagName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              saveTagEdit();
                            } else if (e.key === 'Escape') {
                              cancelEdit();
                            }
                          }}
                          autoFocus
                          sx={{
                            width: 120,
                            '& .MuiInputBase-root': {
                              height: 28,
                              fontSize: '0.875rem',
                            },
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={saveTagEdit}
                          color="primary"
                          sx={{ p: 0.3 }}
                        >
                          <CheckIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={cancelEdit}
                          sx={{ p: 0.3 }}
                        >
                          <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>
                    );
                  }

                  // 正常显示模式
                  return (
                    <Box
                      key={tag.id}
                      sx={{
                        position: 'relative',
                        display: 'inline-block',
                      }}
                    >
                      {/* 左上角编辑图标 */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditTag(tag);
                        }}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 22,
                          height: 22,
                          zIndex: 1,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          boxShadow: 1,
                        }}
                      >
                        <EditIcon sx={{ fontSize: 13 }} />
                      </IconButton>

                      {/* 右上角删除图标 */}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTag(tag.id);
                        }}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 22,
                          height: 22,
                          zIndex: 1,
                          '&:hover': {
                            bgcolor: 'error.dark',
                          },
                          boxShadow: 1,
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 13 }} />
                      </IconButton>

                      {/* 标签本体 */}
                      <Chip
                        label={tag.name}
                        color="primary"
                        variant="filled"
                        sx={{
                          height: 40,
                          px: 1.5,
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          transition: 'all 0.2s',
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                            transform: 'translateY(-2px)',
                            boxShadow: 3,
                          },
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          {/* 下排：添加标签输入框 */}
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
              添加新标签
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="medium"
                placeholder='输入标签名称，多个标签用"；"分隔，如：标签1；标签2'
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTags();
                  }
                }}
                disabled={loading}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleAddTags}
                        disabled={!tagInput.trim() || loading}
                        color="primary"
                        sx={{
                          bgcolor: tagInput.trim() && !loading ? 'primary.main' : 'transparent',
                          color: tagInput.trim() && !loading ? 'white' : 'inherit',
                          '&:hover': {
                            bgcolor: tagInput.trim() && !loading ? 'primary.dark' : 'transparent',
                          },
                        }}
                      >
                        {loading ? <CircularProgress size={20} /> : <AddIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: 'white',
                  }
                }}
              />
            </Box>
            
            {/* 提示文字 */}
            {/* <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 提示：支持中英文分号（;、；）分隔多个标签，已存在的标签会自动关联
            </Typography> */}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
        <Button 
          onClick={onClose} 
          sx={{ mr: 'auto' }}
          variant="outlined"
        >
          取消
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} /> : null}
          sx={{
            px: 4,
            py: 1,
            borderRadius: 2,
            boxShadow: 2,
            fontSize: '1rem',
            fontWeight: 600,
            '&:hover': {
              boxShadow: 4,
            }
          }}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
