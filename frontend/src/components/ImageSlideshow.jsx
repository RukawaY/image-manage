import { useState } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  Chip,
  Stack,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
} from '@mui/icons-material';
import { useEffect } from 'react';

export default function ImageSlideshow({ open, onClose, images, initialIndex = 0 }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    let interval;
    if (isPlaying && images.length > 0) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, images.length]);

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          height: '100vh',
          m: 0,
          maxWidth: '100vw',
          maxHeight: '100vh',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'black',
        }}
      >
        {/* 关闭按钮 */}
        <IconButton
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            zIndex: 10,
          }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>

        {/* 播放/暂停按钮 */}
        <IconButton
          sx={{
            position: 'absolute',
            top: 16,
            right: 72,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            zIndex: 10,
          }}
          onClick={togglePlay}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>

        {/* 上一张按钮 */}
        <IconButton
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            zIndex: 10,
          }}
          onClick={handlePrev}
          disabled={images.length <= 1}
        >
          <PrevIcon />
        </IconButton>

        {/* 下一张按钮 */}
        <IconButton
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            zIndex: 10,
          }}
          onClick={handleNext}
          disabled={images.length <= 1}
        >
          <NextIcon />
        </IconButton>

        {/* 图片 */}
        <Box
          component="img"
          src={currentImage.file_url}
          alt={currentImage.title}
          sx={{
            maxWidth: '90%',
            maxHeight: '85vh',
            objectFit: 'contain',
          }}
        />

        {/* 图片信息 */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            p: 3,
          }}
        >
          <Typography variant="h6" gutterBottom>
            {currentImage.title}
          </Typography>
          {currentImage.description && (
            <Typography variant="body2" gutterBottom>
              {currentImage.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            {currentImage.width && currentImage.height && (
              <Typography variant="caption">
                📐 {currentImage.width} × {currentImage.height}
              </Typography>
            )}
            {currentImage.shot_at && (
              <Typography variant="caption">
                📅 {new Date(currentImage.shot_at).toLocaleDateString('zh-CN')}
              </Typography>
            )}
            {currentImage.location && (
              <Typography variant="caption">
                📍 {currentImage.location}
              </Typography>
            )}
          </Box>
          {currentImage.tags && currentImage.tags.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap">
              {currentImage.tags.map((tag) => (
                <Chip
                  key={tag.id}
                  label={tag.name}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mt: 0.5 }}
                />
              ))}
            </Stack>
          )}
          <Typography variant="caption" display="block" sx={{ mt: 1, opacity: 0.7 }}>
            {currentIndex + 1} / {images.length}
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}

