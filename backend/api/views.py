from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
import os
from datetime import datetime

from .models import User, Image, Tag, ImageTag, Favorite, Album, AlbumImage
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserSerializer, UserUpdateSerializer,
    ImageSerializer, ImageUploadSerializer, TagSerializer, AlbumSerializer, AlbumDetailSerializer
)
from .utils import extract_exif_data, create_thumbnail, edit_image
from .ai_service import analyze_image_with_ai, ai_search_images


@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie  # 确保设置CSRF cookie
def register_view(request):
    """用户注册"""
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)  # 注册后自动登录
        return Response({
            'message': '注册成功',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@ensure_csrf_cookie  # 确保设置CSRF cookie
def login_view(request):
    """用户登录"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        return Response({
            'message': '登录成功',
            'user': UserSerializer(user).data
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """用户登出"""
    logout(request)
    return Response({'message': '已退出登录'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    """获取当前用户信息"""
    serializer = UserSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_view(request):
    """更新用户信息"""
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': '更新成功',
            'user': UserSerializer(request.user, context={'request': request}).data
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar_view(request):
    """上传头像"""
    if 'avatar' not in request.FILES:
        return Response({'error': '请选择头像文件'}, status=status.HTTP_400_BAD_REQUEST)
    
    user = request.user
    user.avatar = request.FILES['avatar']
    user.save()
    
    return Response({
        'message': '头像上传成功',
        'user': UserSerializer(user, context={'request': request}).data
    })


class ImageViewSet(viewsets.ModelViewSet):
    """图片视图集"""
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location', 'tags__name']
    ordering_fields = ['uploaded_at', 'shot_at', 'width', 'height', 'title']
    ordering = ['-uploaded_at']
    
    def get_queryset(self):
        """自定义查询集"""
        queryset = Image.objects.all()
        
        # 只显示当前用户的图片
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        
        # 按标签过滤
        tag_ids = self.request.query_params.get('tags', None)
        if tag_ids:
            tag_id_list = [int(tid) for tid in tag_ids.split(',')]
            queryset = queryset.filter(tags__id__in=tag_id_list).distinct()
        
        # 按日期范围过滤
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            queryset = queryset.filter(uploaded_at__gte=date_from)
        if date_to:
            queryset = queryset.filter(uploaded_at__lte=date_to)
        
        # 按拍摄时间过滤
        shot_from = self.request.query_params.get('shot_from', None)
        shot_to = self.request.query_params.get('shot_to', None)
        if shot_from:
            queryset = queryset.filter(shot_at__gte=shot_from)
        if shot_to:
            queryset = queryset.filter(shot_at__lte=shot_to)
        
        # 按地点过滤
        location = self.request.query_params.get('location', None)
        if location:
            queryset = queryset.filter(location__icontains=location)
        
        # 按分辨率过滤
        min_width = self.request.query_params.get('min_width', None)
        max_width = self.request.query_params.get('max_width', None)
        min_height = self.request.query_params.get('min_height', None)
        max_height = self.request.query_params.get('max_height', None)
        
        if min_width:
            queryset = queryset.filter(width__gte=int(min_width))
        if max_width:
            queryset = queryset.filter(width__lte=int(max_width))
        if min_height:
            queryset = queryset.filter(height__gte=int(min_height))
        if max_height:
            queryset = queryset.filter(height__lte=int(max_height))
        
        return queryset
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """上传图片"""
        if 'file' not in request.FILES:
            return Response(
                {'error': '请选择要上传的图片'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        
        # 创建图片对象
        image = Image(
            user=request.user,
            title=title or file.name,
            description=description,
            file_path=file
        )
        image.save()
        
        # 提取EXIF信息
        try:
            exif_data = extract_exif_data(image.file_path.path)
            
            # 更新图片信息
            image.width = exif_data['width']
            image.height = exif_data['height']
            image.shot_at = exif_data['shot_at']
            image.location = exif_data['location']
            
            # 生成缩略图
            thumbnail = create_thumbnail(image.file_path.path)
            if thumbnail:
                thumbnail_name = f"thumb_{os.path.basename(image.file_path.name)}"
                image.thumbnail_path.save(thumbnail_name, thumbnail, save=False)
            
            image.save()
            
            # 创建EXIF标签
            for tag_name in exif_data['tags']:
                if tag_name:
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        defaults={'source': 'exif'}
                    )
                    image.tags.add(tag)
        
        except Exception as e:
            print(f"处理图片信息失败: {str(e)}")
        
        serializer = self.get_serializer(image, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def batch_upload(self, request):
        """批量上传图片"""
        files = request.FILES.getlist('files')
        if not files:
            return Response(
                {'error': '请选择要上传的图片'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取每个图片的元数据（JSON格式）
        import json
        metadata_str = request.data.get('metadata', '[]')
        try:
            metadata_list = json.loads(metadata_str) if isinstance(metadata_str, str) else metadata_str
        except:
            metadata_list = []
        
        uploaded_images = []
        errors = []
        
        for idx, file in enumerate(files):
            try:
                # 获取对应的元数据
                metadata = metadata_list[idx] if idx < len(metadata_list) else {}
                title = metadata.get('title', file.name)
                description = metadata.get('description', '')
                tag_names = metadata.get('tags', [])
                
                # 创建图片对象
                image = Image(
                    user=request.user,
                    title=title,
                    description=description,
                    file_path=file
                )
                image.save()
                
                # 提取EXIF信息
                try:
                    exif_data = extract_exif_data(image.file_path.path)
                    
                    # 更新图片信息
                    image.width = exif_data['width']
                    image.height = exif_data['height']
                    image.shot_at = exif_data['shot_at']
                    image.location = exif_data['location']
                    
                    # 生成缩略图
                    thumbnail = create_thumbnail(image.file_path.path)
                    if thumbnail:
                        thumbnail_name = f"thumb_{os.path.basename(image.file_path.name)}"
                        image.thumbnail_path.save(thumbnail_name, thumbnail, save=False)
                    
                    image.save()
                    
                    # 创建EXIF标签
                    for tag_name in exif_data['tags']:
                        if tag_name:
                            tag, created = Tag.objects.get_or_create(
                                name=tag_name,
                                defaults={'source': 'exif'}
                            )
                            image.tags.add(tag)
                
                except Exception as e:
                    print(f"处理图片EXIF信息失败: {str(e)}")
                
                # 添加用户指定的标签
                for tag_name in tag_names:
                    if tag_name:
                        tag, created = Tag.objects.get_or_create(
                            name=tag_name,
                            defaults={'source': 'user'}
                        )
                        image.tags.add(tag)
                
                uploaded_images.append(image)
                
            except Exception as e:
                errors.append({
                    'file': file.name,
                    'error': str(e)
                })
        
        # 序列化返回
        serializer = self.get_serializer(uploaded_images, many=True, context={'request': request})
        
        return Response({
            'message': f'成功上传 {len(uploaded_images)} 张图片',
            'uploaded': len(uploaded_images),
            'failed': len(errors),
            'images': serializer.data,
            'errors': errors
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def edit(self, request, pk=None):
        """编辑图片"""
        image = self.get_object()
        
        # 检查权限
        if image.user != request.user and not request.user.is_staff:
            return Response(
                {'error': '您没有权限编辑此图片'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        operations = request.data.get('operations', {})
        
        # 执行编辑操作
        edited_file = edit_image(image.file_path.path, operations)
        if edited_file:
            # 保存编辑后的图片
            filename = os.path.basename(image.file_path.name)
            image.file_path.save(filename, edited_file, save=False)
            
            # 重新生成缩略图
            thumbnail = create_thumbnail(image.file_path.path)
            if thumbnail:
                thumbnail_name = f"thumb_{filename}"
                image.thumbnail_path.save(thumbnail_name, thumbnail, save=False)
            
            # 更新尺寸信息
            from PIL import Image as PILImage
            img = PILImage.open(image.file_path.path)
            image.width = img.width
            image.height = img.height
            
            image.save()
            
            serializer = self.get_serializer(image, context={'request': request})
            return Response(serializer.data)
        
        return Response(
            {'error': '编辑图片失败'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    @action(detail=True, methods=['post'])
    def add_tags(self, request, pk=None):
        """为图片添加标签"""
        image = self.get_object()
        
        # 检查权限
        if image.user != request.user and not request.user.is_staff:
            return Response(
                {'error': '您没有权限修改此图片'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tag_names = request.data.get('tags', [])
        tag_source = request.data.get('source', 'user')  # 默认为用户标签，可以是 'ai' 或 'user'
        added_tags = []
        
        for tag_name in tag_names:
            if tag_name:
                # 先尝试获取已存在的标签
                tag = Tag.objects.filter(name=tag_name).first()
                if not tag:
                    # 如果不存在，创建新标签
                    tag = Tag.objects.create(name=tag_name, source=tag_source)
                image.tags.add(tag)
                added_tags.append(tag)
        
        serializer = self.get_serializer(image, context={'request': request})
        return Response({
            'message': f'已添加 {len(added_tags)} 个标签',
            'image': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def remove_tags(self, request, pk=None):
        """移除图片标签"""
        image = self.get_object()
        
        # 检查权限
        if image.user != request.user and not request.user.is_staff:
            return Response(
                {'error': '您没有权限修改此图片'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tag_ids = request.data.get('tag_ids', [])
        tags = Tag.objects.filter(id__in=tag_ids)
        image.tags.remove(*tags)
        
        serializer = self.get_serializer(image, context={'request': request})
        return Response({
            'message': f'已移除 {len(tag_ids)} 个标签',
            'image': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """收藏图片"""
        image = self.get_object()
        favorite, created = Favorite.objects.get_or_create(user=request.user, image=image)
        
        if created:
            return Response({'message': '收藏成功', 'is_favorited': True})
        else:
            return Response({'message': '已经收藏过了', 'is_favorited': True})
    
    @action(detail=True, methods=['post'])
    def unfavorite(self, request, pk=None):
        """取消收藏"""
        image = self.get_object()
        deleted_count, _ = Favorite.objects.filter(user=request.user, image=image).delete()
        
        if deleted_count > 0:
            return Response({'message': '已取消收藏', 'is_favorited': False})
        else:
            return Response({'message': '未收藏过此图片', 'is_favorited': False})
    
    @action(detail=False, methods=['get'])
    def favorites(self, request):
        """获取用户收藏的图片列表"""
        favorites = Favorite.objects.filter(user=request.user).select_related('image')
        images = [f.image for f in favorites]
        
        # 应用分页
        page = self.paginate_queryset(images)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(images, many=True, context={'request': request})
        return Response(serializer.data)
    
    def perform_destroy(self, instance):
        """删除图片时同时删除文件"""
        # 删除物理文件
        if instance.file_path:
            if os.path.isfile(instance.file_path.path):
                os.remove(instance.file_path.path)
        if instance.thumbnail_path:
            if os.path.isfile(instance.thumbnail_path.path):
                os.remove(instance.thumbnail_path.path)
        
        instance.delete()


class TagViewSet(viewsets.ModelViewSet):
    """标签视图集"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
    
    def create(self, request, *args, **kwargs):
        """创建标签（如果已存在则返回现有标签）"""
        tag_name = request.data.get('name', '').strip()
        if not tag_name:
            return Response(
                {'error': '标签名称不能为空'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 尝试获取已存在的标签
        tag = Tag.objects.filter(name=tag_name).first()
        if tag:
            serializer = self.get_serializer(tag)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        # 创建新标签
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """获取热门标签（按使用次数排序）"""
        # 只显示当前用户图片的标签
        user_images = Image.objects.filter(user=request.user)
        tags = Tag.objects.filter(images__in=user_images).annotate(
            usage_count=Count('images')
        ).filter(usage_count__gt=0).order_by('-usage_count').distinct()[:10]
        
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def all_tags(self, request):
        """获取所有标签（按名称排序）"""
        # 只显示当前用户图片的标签
        user_images = Image.objects.filter(user=request.user)
        tags = Tag.objects.filter(images__in=user_images).annotate(
            usage_count=Count('images')
        ).filter(usage_count__gt=0).order_by('name').distinct()
        
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_analyze_image(request):
    """AI分析图片，生成描述和标签"""
    if 'image' not in request.FILES:
        return Response(
            {'error': '请提供图片文件'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # 保存临时图片
        image_file = request.FILES['image']
        temp_image = Image(user=request.user, file_path=image_file)
        temp_image.save()
        
        # 调用AI分析
        result = analyze_image_with_ai(temp_image.file_path.path)
        
        # 删除临时图片
        if os.path.isfile(temp_image.file_path.path):
            os.remove(temp_image.file_path.path)
        temp_image.delete()
        
        return Response(result)
        
    except Exception as e:
        return Response(
            {'error': f'AI分析失败: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_search_images_view(request):
    """AI检索图片"""
    query = request.data.get('query', '')
    if not query:
        return Response(
            {'error': '请提供搜索关键词'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # 获取用户的所有图片信息
        user_images = Image.objects.filter(user=request.user).values('id', 'title', 'description')
        images_data = [
            {
                'id': img['id'],
                'title': img['title'] or '无标题',
                'description': img['description'] or '无描述'
            }
            for img in user_images
        ]
        
        # 调用AI检索
        image_ids = ai_search_images(query, images_data)
        
        # 获取对应的图片对象
        images = Image.objects.filter(id__in=image_ids, user=request.user)
        
        # 按照AI返回的顺序排序
        images_dict = {img.id: img for img in images}
        sorted_images = [images_dict[img_id] for img_id in image_ids if img_id in images_dict]
        
        # 序列化返回
        serializer = ImageSerializer(sorted_images, many=True, context={'request': request})
        return Response({
            'query': query,
            'results': serializer.data,
            'count': len(serializer.data)
        })
        
    except Exception as e:
        return Response(
            {'error': f'AI检索失败: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class AlbumViewSet(viewsets.ModelViewSet):
    """相册视图集"""
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'updated_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """只显示当前用户的相册"""
        return Album.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        """根据action选择序列化器"""
        if self.action == 'retrieve':
            return AlbumDetailSerializer
        return AlbumSerializer
    
    def perform_create(self, serializer):
        """创建相册时自动设置用户"""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_images(self, request, pk=None):
        """向相册批量添加图片"""
        album = self.get_object()
        image_ids = request.data.get('image_ids', [])
        
        if not image_ids:
            return Response(
                {'error': '请提供要添加的图片ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 只能添加当前用户的图片
        images = Image.objects.filter(id__in=image_ids, user=request.user)
        album.images.add(*images)
        
        serializer = self.get_serializer(album)
        return Response({
            'message': f'已添加 {len(images)} 张图片',
            'album': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def remove_images(self, request, pk=None):
        """从相册批量移除图片"""
        album = self.get_object()
        image_ids = request.data.get('image_ids', [])
        
        if not image_ids:
            return Response(
                {'error': '请提供要移除的图片ID'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        images = Image.objects.filter(id__in=image_ids)
        album.images.remove(*images)
        
        serializer = self.get_serializer(album)
        return Response({
            'message': f'已移除 {len(image_ids)} 张图片',
            'album': serializer.data
        })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics_view(request):
    """获取用户数据统计"""
    from collections import defaultdict
    from datetime import datetime
    
    user = request.user
    
    # 获取用户的所有图片
    user_images = Image.objects.filter(user=user)
    
    # 图片总数
    total_images = user_images.count()
    
    # 相册总数
    total_albums = Album.objects.filter(user=user).count()
    
    # 总占用空间（字节）
    total_size = 0
    for image in user_images:
        try:
            if image.file_path and os.path.isfile(image.file_path.path):
                total_size += os.path.getsize(image.file_path.path)
        except:
            pass
    
    # 使用 Python 代码统计年份和月份，避免 SQLite 时区问题
    yearly_counts = defaultdict(int)
    monthly_counts = defaultdict(int)
    
    for image in user_images:
        if image.uploaded_at:
            # 转换为本地时间
            local_time = image.uploaded_at
            if hasattr(local_time, 'astimezone'):
                local_time = local_time.astimezone()
            
            # 统计年份
            year = local_time.year
            yearly_counts[year] += 1
            
            # 统计月份
            month = local_time.strftime('%Y-%m')
            monthly_counts[month] += 1
    
    # 格式化统计数据
    yearly_data = [
        {'year': year, 'count': count}
        for year, count in sorted(yearly_counts.items())
    ]
    
    monthly_data = [
        {'month': month, 'count': count}
        for month, count in sorted(monthly_counts.items())
    ]
    
    return Response({
        'total_images': total_images,
        'total_albums': total_albums,
        'total_size': total_size,
        'total_size_mb': round(total_size / (1024 * 1024), 2),
        'yearly_stats': yearly_data,
        'monthly_stats': monthly_data[-12:]  # 最近12个月
    })
