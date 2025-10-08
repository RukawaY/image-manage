"""
Django管理命令：重新生成所有图片的缩略图
使用方法: python manage.py regenerate_thumbnails
"""
from django.core.management.base import BaseCommand
from api.models import Image
from api.utils import create_thumbnail
import os


class Command(BaseCommand):
    help = '重新生成所有图片的缩略图'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='强制重新生成所有缩略图，即使已存在',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        images = Image.objects.all()
        total = images.count()
        
        self.stdout.write(f'找到 {total} 张图片')
        
        success_count = 0
        skip_count = 0
        error_count = 0
        
        for i, image in enumerate(images, 1):
            self.stdout.write(f'处理 {i}/{total}: {image.title}')
            
            # 检查原图是否存在
            if not os.path.exists(image.file_path.path):
                self.stdout.write(self.style.ERROR(f'  原图不存在: {image.file_path.path}'))
                error_count += 1
                continue
            
            # 如果不是强制模式，且缩略图已存在，则跳过
            if not force and image.thumbnail_path and os.path.exists(image.thumbnail_path.path):
                self.stdout.write(self.style.WARNING(f'  缩略图已存在，跳过'))
                skip_count += 1
                continue
            
            try:
                # 生成新的缩略图
                thumbnail = create_thumbnail(image.file_path.path)
                
                if thumbnail:
                    # 删除旧缩略图
                    if image.thumbnail_path:
                        try:
                            if os.path.exists(image.thumbnail_path.path):
                                os.remove(image.thumbnail_path.path)
                        except Exception as e:
                            self.stdout.write(self.style.WARNING(f'  删除旧缩略图失败: {str(e)}'))
                    
                    # 保存新缩略图
                    thumbnail_name = f"thumb_{os.path.basename(image.file_path.name)}"
                    image.thumbnail_path.save(thumbnail_name, thumbnail, save=True)
                    
                    self.stdout.write(self.style.SUCCESS(f'  ✓ 缩略图已生成'))
                    success_count += 1
                else:
                    self.stdout.write(self.style.ERROR(f'  生成缩略图失败'))
                    error_count += 1
                    
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'  错误: {str(e)}'))
                error_count += 1
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'处理完成！'))
        self.stdout.write(f'成功: {success_count}')
        self.stdout.write(f'跳过: {skip_count}')
        self.stdout.write(f'失败: {error_count}')

