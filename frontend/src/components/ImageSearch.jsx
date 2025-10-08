import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
} from '@mui/material';

export default function ImageSearch({ open, onClose, onSearch }) {
  const [searchForm, setSearchForm] = useState({
    search: '',
    tags: '',
    location: '',
    date_from: '',
    date_to: '',
    shot_from: '',
    shot_to: '',
    min_width: '',
    max_width: '',
    min_height: '',
    max_height: '',
    ordering: '-uploaded_at',
  });

  const handleChange = (e) => {
    setSearchForm({ ...searchForm, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    // 过滤空值
    const params = {};
    Object.keys(searchForm).forEach((key) => {
      if (searchForm[key]) {
        params[key] = searchForm[key];
      }
    });
    onSearch(params);
  };

  const handleReset = () => {
    setSearchForm({
      search: '',
      tags: '',
      location: '',
      date_from: '',
      date_to: '',
      shot_from: '',
      shot_to: '',
      min_width: '',
      max_width: '',
      min_height: '',
      max_height: '',
      ordering: '-uploaded_at',
    });
    onSearch({});
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>搜索图片</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="关键词"
                name="search"
                value={searchForm.search}
                onChange={handleChange}
                helperText="搜索标题、描述或地点"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="标签ID"
                name="tags"
                value={searchForm.tags}
                onChange={handleChange}
                helperText="多个标签用逗号分隔"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="地点"
                name="location"
                value={searchForm.location}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="上传日期（从）"
                name="date_from"
                type="date"
                value={searchForm.date_from}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="上传日期（到）"
                name="date_to"
                type="date"
                value={searchForm.date_to}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="拍摄日期（从）"
                name="shot_from"
                type="date"
                value={searchForm.shot_from}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="拍摄日期（到）"
                name="shot_to"
                type="date"
                value={searchForm.shot_to}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="最小宽度"
                name="min_width"
                type="number"
                value={searchForm.min_width}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="最大宽度"
                name="max_width"
                type="number"
                value={searchForm.max_width}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="最小高度"
                name="min_height"
                type="number"
                value={searchForm.min_height}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                label="最大高度"
                name="max_height"
                type="number"
                value={searchForm.max_height}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>排序方式</InputLabel>
                <Select
                  name="ordering"
                  value={searchForm.ordering}
                  onChange={handleChange}
                  label="排序方式"
                >
                  <MenuItem value="-uploaded_at">上传时间（新到旧）</MenuItem>
                  <MenuItem value="uploaded_at">上传时间（旧到新）</MenuItem>
                  <MenuItem value="-shot_at">拍摄时间（新到旧）</MenuItem>
                  <MenuItem value="shot_at">拍摄时间（旧到新）</MenuItem>
                  <MenuItem value="-width">宽度（大到小）</MenuItem>
                  <MenuItem value="width">宽度（小到大）</MenuItem>
                  <MenuItem value="-height">高度（大到小）</MenuItem>
                  <MenuItem value="height">高度（小到大）</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleReset}>重置</Button>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSearch} variant="contained">
          搜索
        </Button>
      </DialogActions>
    </Dialog>
  );
}

