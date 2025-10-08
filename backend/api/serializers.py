from rest_framework import serializers
from django.contrib.auth import authenticate
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User, Image, Tag, ImageTag, Favorite


class UserRegisterSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(
        write_only=True, 
        min_length=6,
        error_messages={
            'min_length': '密码至少需要6个字符',
            'required': '密码不能为空'
        }
    )
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'password_confirm']
        extra_kwargs = {
            'username': {
                'min_length': 6,
                'error_messages': {
                    'min_length': '用户名至少需要6个字符',
                    'unique': '该用户名已被使用'
                }
            },
            'email': {
                'error_messages': {
                    'unique': '该邮箱已被注册',
                    'invalid': '请输入有效的邮箱地址'
                }
            }
        }
    
    def validate_username(self, value):
        if len(value.encode('utf-8')) < 6:
            raise serializers.ValidationError("用户名至少需要6个字节")
        return value
    
    def validate_password(self, value):
        if len(value.encode('utf-8')) < 6:
            raise serializers.ValidationError("密码至少需要6个字节")
        return value
    
    def validate_email(self, value):
        try:
            validate_email(value)
        except ValidationError:
            raise serializers.ValidationError("请输入有效的邮箱地址")
        return value
    
    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': '两次密码输入不一致'})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('用户名或密码错误')
            if not user.is_active:
                raise serializers.ValidationError('该账户已被禁用')
        else:
            raise serializers.ValidationError('必须提供用户名和密码')
        
        data['user'] = user
        return data


class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    avatar_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'avatar_url', 'bio', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_avatar_url(self, obj):
        request = self.context.get('request')
        if obj.avatar and request:
            return request.build_absolute_uri(obj.avatar.url)
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """用户信息更新序列化器"""
    old_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=6)
    new_password_confirm = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'avatar', 'bio', 'old_password', 'new_password', 'new_password_confirm']
    
    def validate(self, data):
        # 如果要修改密码
        if data.get('new_password'):
            if not data.get('old_password'):
                raise serializers.ValidationError({'old_password': '修改密码时必须提供原密码'})
            if data.get('new_password') != data.get('new_password_confirm'):
                raise serializers.ValidationError({'new_password_confirm': '两次密码输入不一致'})
            
            # 验证原密码
            user = self.instance
            if not user.check_password(data['old_password']):
                raise serializers.ValidationError({'old_password': '原密码错误'})
        
        return data
    
    def update(self, instance, validated_data):
        # 处理密码更新
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('new_password_confirm', None)
        validated_data.pop('old_password', None)
        
        # 更新其他字段
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # 更新密码
        if new_password:
            instance.set_password(new_password)
        
        instance.save()
        return instance


class TagSerializer(serializers.ModelSerializer):
    """标签序列化器"""
    class Meta:
        model = Tag
        fields = ['id', 'name', 'source']
        read_only_fields = ['id']


class ImageSerializer(serializers.ModelSerializer):
    """图片序列化器"""
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    user = UserSerializer(read_only=True)
    file_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    
    class Meta:
        model = Image
        fields = [
            'id', 'user', 'title', 'description', 'file_path', 'thumbnail_path',
            'file_url', 'thumbnail_url', 'width', 'height', 'shot_at', 
            'location', 'uploaded_at', 'tags', 'tag_ids', 'is_favorited'
        ]
        read_only_fields = ['id', 'user', 'uploaded_at', 'width', 'height', 'thumbnail_path']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file_path and request:
            return request.build_absolute_uri(obj.file_path.url)
        return None
    
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail_path and request:
            return request.build_absolute_uri(obj.thumbnail_path.url)
        return None
    
    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, image=obj).exists()
        return False
    
    def create(self, validated_data):
        tag_ids = validated_data.pop('tag_ids', [])
        image = Image.objects.create(**validated_data)
        
        # 添加标签
        if tag_ids:
            tags = Tag.objects.filter(id__in=tag_ids)
            image.tags.set(tags)
        
        return image
    
    def update(self, instance, validated_data):
        tag_ids = validated_data.pop('tag_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 更新标签
        if tag_ids is not None:
            tags = Tag.objects.filter(id__in=tag_ids)
            instance.tags.set(tags)
        
        return instance


class ImageUploadSerializer(serializers.ModelSerializer):
    """图片上传序列化器"""
    file = serializers.ImageField(write_only=True, source='file_path')
    
    class Meta:
        model = Image
        fields = ['file', 'title', 'description']

