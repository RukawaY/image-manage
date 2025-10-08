from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Image, Tag, ImageTag


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'is_staff', 'created_at']
    list_filter = ['is_staff', 'is_superuser', 'created_at']
    search_fields = ['username', 'email']
    ordering = ['-created_at']


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'width', 'height', 'shot_at', 'uploaded_at']
    list_filter = ['uploaded_at', 'shot_at']
    search_fields = ['title', 'description', 'location']
    raw_id_fields = ['user']
    readonly_fields = ['uploaded_at', 'width', 'height']
    filter_horizontal = ['tags']


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'source']
    list_filter = ['source']
    search_fields = ['name']


@admin.register(ImageTag)
class ImageTagAdmin(admin.ModelAdmin):
    list_display = ['image', 'tag']
    raw_id_fields = ['image', 'tag']
