from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, EmailValidator


class User(AbstractUser):
    """用户模型"""
    email = models.EmailField(
        max_length=254,
        unique=True,
        validators=[EmailValidator(message="请输入有效的邮箱地址")]
    )
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[MinLengthValidator(6, message="用户名至少需要6个字符")]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'users'
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.username


class Tag(models.Model):
    """标签模型"""
    SOURCE_CHOICES = [
        ('user', '用户添加'),
        ('exif', 'EXIF信息'),
        ('ai', 'AI识别'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    source = models.CharField(max_length=10, choices=SOURCE_CHOICES, default='user')
    
    class Meta:
        db_table = 'tags'
        verbose_name = '标签'
        verbose_name_plural = '标签'
    
    def __str__(self):
        return f"{self.name} ({self.get_source_display()})"


class Image(models.Model):
    """图片模型"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='images')
    title = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    file_path = models.ImageField(upload_to='images/%Y/%m/%d/', max_length=500)
    thumbnail_path = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', max_length=500)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    shot_at = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    tags = models.ManyToManyField(Tag, through='ImageTag', related_name='images')
    
    class Meta:
        db_table = 'images'
        verbose_name = '图片'
        verbose_name_plural = '图片'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return self.title or f"图片 {self.id}"


class ImageTag(models.Model):
    """图片标签关联模型"""
    image = models.ForeignKey(Image, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'image_tags'
        unique_together = ['image', 'tag']
        verbose_name = '图片标签'
        verbose_name_plural = '图片标签'
    
    def __str__(self):
        return f"{self.image} - {self.tag}"
