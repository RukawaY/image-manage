import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Slider,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { imageAPI } from '../services/api';

export default function ImageEditor({ open, onClose, image, onSave }) {
  const [editing, setEditing] = useState(false);
  const [operations, setOperations] = useState({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
  });
  const [cropMode, setCropMode] = useState(false);
  const [cropData, setCropData] = useState(null);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    if (open && image) {
      setImgLoaded(false);
      setOperations({
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
      });
      setCropData(null);
      setCropMode(false);
    }
  }, [open, image]);

  const handleSliderChange = (name) => (event, value) => {
    setOperations({ ...operations, [name]: value });
  };

  const handleSave = async () => {
    try {
      setEditing(true);
      
      const editOperations = {};
      
      // 添加色调调整
      if (operations.brightness !== 1.0) {
        editOperations.brightness = operations.brightness;
      }
      if (operations.contrast !== 1.0) {
        editOperations.contrast = operations.contrast;
      }
      if (operations.saturation !== 1.0) {
        editOperations.saturation = operations.saturation;
      }
      
      // 添加裁剪
      if (cropData) {
        editOperations.crop = cropData;
      }

      if (Object.keys(editOperations).length > 0) {
        await imageAPI.edit(image.id, editOperations);
        onSave();
      } else {
        onClose();
      }
    } catch (error) {
      console.error('编辑失败', error);
      alert('编辑失败，请重试');
    } finally {
      setEditing(false);
    }
  };

  const handleReset = () => {
    setOperations({
      brightness: 1.0,
      contrast: 1.0,
      saturation: 1.0,
    });
    setCropData(null);
  };

  const applyFilters = () => {
    if (!imgRef.current || !canvasRef.current || !imgLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imgRef.current;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    // 应用滤镜（CSS filter预览）
    const filters = [
      `brightness(${operations.brightness})`,
      `contrast(${operations.contrast})`,
      `saturate(${operations.saturation})`,
    ];
    
    ctx.filter = filters.join(' ');
    ctx.drawImage(img, 0, 0);
    ctx.filter = 'none';
  };

  useEffect(() => {
    if (imgLoaded) {
      applyFilters();
    }
  }, [operations, imgLoaded]);

  if (!image) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>编辑图片</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* 图片预览 */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: 400,
              bgcolor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              overflow: 'hidden',
            }}
          >
            <img
              ref={imgRef}
              src={image.file_url}
              alt={image.title}
              onLoad={() => setImgLoaded(true)}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                filter: `brightness(${operations.brightness}) contrast(${operations.contrast}) saturate(${operations.saturation})`,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </Box>

          {/* 调整选项 */}
          <Stack spacing={3}>
            <Box>
              <Typography gutterBottom>
                亮度: {operations.brightness.toFixed(2)}
              </Typography>
              <Slider
                value={operations.brightness}
                onChange={handleSliderChange('brightness')}
                min={0.5}
                max={1.5}
                step={0.05}
                marks={[
                  { value: 0.5, label: '暗' },
                  { value: 1.0, label: '正常' },
                  { value: 1.5, label: '亮' },
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                对比度: {operations.contrast.toFixed(2)}
              </Typography>
              <Slider
                value={operations.contrast}
                onChange={handleSliderChange('contrast')}
                min={0.5}
                max={1.5}
                step={0.05}
                marks={[
                  { value: 0.5, label: '低' },
                  { value: 1.0, label: '正常' },
                  { value: 1.5, label: '高' },
                ]}
              />
            </Box>

            <Box>
              <Typography gutterBottom>
                饱和度: {operations.saturation.toFixed(2)}
              </Typography>
              <Slider
                value={operations.saturation}
                onChange={handleSliderChange('saturation')}
                min={0.0}
                max={2.0}
                step={0.1}
                marks={[
                  { value: 0.0, label: '黑白' },
                  { value: 1.0, label: '正常' },
                  { value: 2.0, label: '鲜艳' },
                ]}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>重置</Button>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSave} variant="contained" disabled={editing}>
          {editing ? <CircularProgress size={24} /> : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

