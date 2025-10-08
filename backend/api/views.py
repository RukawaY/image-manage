from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import login, logout
from django.db.models import Q
from django.shortcuts import get_object_or_404
import os

from .models import User, Image, Tag, ImageTag
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserSerializer,
    ImageSerializer, ImageUploadSerializer, TagSerializer
)
from .utils import extract_exif_data, create_thumbnail, edit_image


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """用户注册"""
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': '注册成功',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
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
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


class ImageViewSet(viewsets.ModelViewSet):
    """图片视图集"""
    queryset = Image.objects.all()
    serializer_class = ImageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'location']
    ordering_fields = ['uploaded_at', 'shot_at', 'width', 'height']
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
        added_tags = []
        
        for tag_name in tag_names:
            if tag_name:
                tag, created = Tag.objects.get_or_create(
                    name=tag_name,
                    defaults={'source': 'user'}
                )
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
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """获取热门标签（按使用次数排序）"""
        from django.db.models import Count
        
        tags = Tag.objects.annotate(
            usage_count=Count('images')
        ).order_by('-usage_count')[:20]
        
        serializer = self.get_serializer(tags, many=True)
        return Response(serializer.data)
