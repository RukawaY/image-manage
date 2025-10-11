import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Chip,
  Stack,
  Box,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Crop as CropIcon,
  Label as LabelIcon,
} from '@mui/icons-material';

export default function ImageCard({ image, onFavorite, onDelete, onEdit, onCrop, onEditTags, onClick }) {
  return (
    <Card
      sx={{
        width: 320,
        height: 400,
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: 320,
          height: 240,
          overflow: 'hidden',
          bgcolor: 'grey.200',
        }}
        onClick={onClick}
      >
        <CardMedia
          component="img"
          image={image.thumbnail_url || image.file_url}
          alt={image.title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
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
            {image.tags.slice(0, 3).map((tag) => (
              <Chip key={tag.id} label={tag.name} size="small" sx={{ mt: 0.5 }} />
            ))}
            {image.tags.length > 3 && (
              <Chip label={`+${image.tags.length - 3}`} size="small" sx={{ mt: 0.5 }} />
            )}
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {/* 收藏按钮 */}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onFavorite(image);
            }}
            color={image.is_favorited ? 'error' : 'default'}
            title="收藏"
          >
            {image.is_favorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          
          {/* 编辑图片按钮 */}
          {onEdit && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(image);
              }}
              title="编辑图片"
            >
              <EditIcon />
            </IconButton>
          )}
          
          {/* 裁切按钮 */}
          {onCrop && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onCrop(image);
              }}
              title="裁切"
            >
              <CropIcon />
            </IconButton>
          )}
          
          {/* 修改标签按钮 */}
          {onEditTags && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditTags(image);
              }}
              title="修改标签"
            >
              <LabelIcon />
            </IconButton>
          )}
        </Box>
        
        {/* 删除按钮 */}
        {onDelete && (
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image);
            }}
            title="删除"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </CardActions>
    </Card>
  );
}

