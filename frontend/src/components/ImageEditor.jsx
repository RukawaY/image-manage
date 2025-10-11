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

export default function ImageEditor({ open, onClose, image, onSave, defaultMode = 'adjust' }) {
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState(defaultMode); // 'adjust' 或 'crop'
  const [operations, setOperations] = useState({
    brightness: 1.0,
    contrast: 1.0,
    saturation: 1.0,
  });
  const [cropData, setCropData] = useState(null);
  const [cropStart, setCropStart] = useState(null);
  const [cropEnd, setCropEnd] = useState(null);
  const [clickCount, setClickCount] = useState(0);
  const imgContainerRef = useRef(null);
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (open && image) {
      setImgLoaded(false);
      setMode(defaultMode);
      setOperations({
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
      });
      setCropData(null);
      setCropStart(null);
      setCropEnd(null);
      setClickCount(0);
    }
  }, [open, image, defaultMode]);

  const handleImageLoad = () => {
    setImgLoaded(true);
    if (imgRef.current) {
      setImgDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight,
      });
    }
  };

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
    setCropStart(null);
    setCropEnd(null);
    setClickCount(0);
  };

  // 裁剪相关的点击事件处理（点击两次确定裁剪框）
  const handleCropClick = (e) => {
    if (mode !== 'crop' || !imgContainerRef.current || !imgRef.current) return;
    
    const container = imgContainerRef.current;
    const img = imgRef.current;
    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    
    // 计算点击位置相对于容器的坐标
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;
    
    // 检查点击是否在图片区域内
    const imgOffsetX = imgRect.left - containerRect.left;
    const imgOffsetY = imgRect.top - containerRect.top;
    const displayWidth = imgRect.width;
    const displayHeight = imgRect.height;
    
    if (x < imgOffsetX || x > imgOffsetX + displayWidth || 
        y < imgOffsetY || y > imgOffsetY + displayHeight) {
      return; // 点击在图片外部，忽略
    }
    
    if (clickCount === 0) {
      // 第一次点击，设置起点
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setClickCount(1);
    } else if (clickCount === 1) {
      // 第二次点击，设置终点并计算裁剪数据
      setCropEnd({ x, y });
      setClickCount(2);
      
      // 计算裁剪区域
      const left = Math.max(0, Math.min(cropStart.x, x) - imgOffsetX);
      const top = Math.max(0, Math.min(cropStart.y, y) - imgOffsetY);
      const right = Math.min(displayWidth, Math.max(cropStart.x, x) - imgOffsetX);
      const bottom = Math.min(displayHeight, Math.max(cropStart.y, y) - imgOffsetY);
      
      // 原始图片尺寸
      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;
      
      // 计算缩放比例
      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;
      
      // 转换为原始图片坐标
      const cropDataNatural = {
        left: Math.round(left * scaleX),
        top: Math.round(top * scaleY),
        right: Math.round(right * scaleX),
        bottom: Math.round(bottom * scaleY),
      };
      
      // 检查裁剪区域是否有效（至少50x50像素）
      if (cropDataNatural.right - cropDataNatural.left > 50 && 
          cropDataNatural.bottom - cropDataNatural.top > 50) {
        setCropData(cropDataNatural);
      }
    } else {
      // 已完成裁剪，重新开始
      setCropStart({ x, y });
      setCropEnd({ x, y });
      setClickCount(1);
      setCropData(null);
    }
  };

  // 鼠标移动时更新裁剪框预览（仅在第一次点击后）
  const handleCropMouseMove = (e) => {
    if (mode !== 'crop' || clickCount !== 1 || !imgContainerRef.current) return;
    
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCropEnd({ x, y });
  };

  // 获取裁剪框的样式
  const getCropBoxStyle = () => {
    if (!cropStart || !cropEnd || mode !== 'crop') return {};
    
    const left = Math.min(cropStart.x, cropEnd.x);
    const top = Math.min(cropStart.y, cropEnd.y);
    const width = Math.abs(cropEnd.x - cropStart.x);
    const height = Math.abs(cropEnd.y - cropStart.y);
    
    return {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #1976d2',
      backgroundColor: 'rgba(25, 118, 210, 0.1)',
      pointerEvents: 'none',
      zIndex: 10,
    };
  };


  if (!image) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {mode === 'adjust' ? '调整色调' : '裁剪图片'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {/* 图片预览 */}
          <Box
            ref={imgContainerRef}
            onClick={handleCropClick}
            onMouseMove={handleCropMouseMove}
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
              cursor: mode === 'crop' ? 'crosshair' : 'default',
            }}
          >
            <img
              ref={imgRef}
              src={image.file_url}
              alt={image.title}
              onLoad={handleImageLoad}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                filter: mode === 'adjust' 
                  ? `brightness(${operations.brightness}) contrast(${operations.contrast}) saturate(${operations.saturation})`
                  : 'none',
                userSelect: 'none',
              }}
            />
            {/* 裁剪框 */}
            {mode === 'crop' && (cropStart || cropData) && (
              <div style={getCropBoxStyle()} />
            )}
            {mode === 'crop' && cropData && !cropStart && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  px: 2,
                  py: 1,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                }}
              >
                已选择裁剪区域: {cropData.right - cropData.left} × {cropData.bottom - cropData.top} 像素
              </Box>
            )}
          </Box>

          {/* 调整选项 */}
          {mode === 'adjust' && (
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
          )}

          {/* 裁剪说明 */}
          {mode === 'crop' && (
            <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body2">
                {clickCount === 0 && '点击图片左上角选择裁剪起点'}
                {clickCount === 1 && '移动鼠标预览，点击右下角确定裁剪区域'}
                {clickCount === 2 && '裁剪区域已确定，点击保存或重新选择'}
              </Typography>
            </Box>
          )}
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

