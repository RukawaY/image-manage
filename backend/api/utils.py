"""
图片处理工具函数
处理EXIF信息提取、缩略图生成等
"""
import os
from PIL import Image as PILImage
from PIL import ImageOps
import piexif
from datetime import datetime
from io import BytesIO
from django.core.files.base import ContentFile


def extract_exif_data(image_path):
    """
    提取图片EXIF信息
    返回: {
        'shot_at': datetime,
        'location': str,
        'width': int,
        'height': int,
        'tags': list
    }
    """
    exif_data = {
        'shot_at': None,
        'location': None,
        'width': None,
        'height': None,
        'tags': []
    }
    
    try:
        img = PILImage.open(image_path)
        
        # 获取图片尺寸
        exif_data['width'] = img.width
        exif_data['height'] = img.height
        
        # 自动旋转图片（根据EXIF的Orientation标签）
        img = ImageOps.exif_transpose(img)
        
        # 提取EXIF信息
        exif_dict = piexif.load(img.info.get('exif', b''))
        
        # 提取拍摄时间
        if '0th' in exif_dict and piexif.ImageIFD.DateTime in exif_dict['0th']:
            datetime_str = exif_dict['0th'][piexif.ImageIFD.DateTime].decode('utf-8')
            try:
                exif_data['shot_at'] = datetime.strptime(datetime_str, '%Y:%m:%d %H:%M:%S')
            except:
                pass
        
        # 提取GPS位置信息
        if 'GPS' in exif_dict:
            gps_info = exif_dict['GPS']
            if piexif.GPSIFD.GPSLatitude in gps_info and piexif.GPSIFD.GPSLongitude in gps_info:
                lat = convert_to_degrees(gps_info[piexif.GPSIFD.GPSLatitude])
                lon = convert_to_degrees(gps_info[piexif.GPSIFD.GPSLongitude])
                
                # 判断南北纬和东西经
                if piexif.GPSIFD.GPSLatitudeRef in gps_info:
                    lat_ref = gps_info[piexif.GPSIFD.GPSLatitudeRef].decode('utf-8')
                    if lat_ref == 'S':
                        lat = -lat
                
                if piexif.GPSIFD.GPSLongitudeRef in gps_info:
                    lon_ref = gps_info[piexif.GPSIFD.GPSLongitudeRef].decode('utf-8')
                    if lon_ref == 'W':
                        lon = -lon
                
                exif_data['location'] = f"{lat:.6f}, {lon:.6f}"
        
        # 提取相机信息作为标签
        if 'Exif' in exif_dict:
            # 相机型号
            if piexif.ExifIFD.LensMake in exif_dict['Exif']:
                camera_make = exif_dict['Exif'][piexif.ExifIFD.LensMake].decode('utf-8', errors='ignore')
                exif_data['tags'].append(camera_make)
            
            if piexif.ExifIFD.LensModel in exif_dict['Exif']:
                camera_model = exif_dict['Exif'][piexif.ExifIFD.LensModel].decode('utf-8', errors='ignore')
                exif_data['tags'].append(camera_model)
        
        # 添加分辨率标签
        if exif_data['width'] and exif_data['height']:
            megapixels = (exif_data['width'] * exif_data['height']) / 1000000
            exif_data['tags'].append(f"{megapixels:.1f}MP")
            
            # 添加方向标签
            if exif_data['width'] > exif_data['height']:
                exif_data['tags'].append('横向')
            else:
                exif_data['tags'].append('纵向')
        
    except Exception as e:
        print(f"提取EXIF信息失败: {str(e)}")
    
    return exif_data


def convert_to_degrees(value):
    """
    将GPS坐标转换为度数
    """
    d = float(value[0][0]) / float(value[0][1])
    m = float(value[1][0]) / float(value[1][1])
    s = float(value[2][0]) / float(value[2][1])
    return d + (m / 60.0) + (s / 3600.0)


def create_thumbnail(image_file, target_size=(400, 300), aspect_ratio=(4, 3)):
    """
    创建缩略图 - 中心裁剪为4:3比例后缩放到指定大小
    返回: ContentFile对象
    """
    try:
        img = PILImage.open(image_file)
        
        # 自动旋转图片
        img = ImageOps.exif_transpose(img)
        
        # 转换RGBA为RGB（如果需要）
        if img.mode in ('RGBA', 'LA', 'P'):
            background = PILImage.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        
        # 计算目标宽高比
        target_ratio = aspect_ratio[0] / aspect_ratio[1]  # 4:3 = 1.333...
        current_ratio = img.width / img.height
        
        # 中心裁剪为4:3比例
        if current_ratio > target_ratio:
            # 图片太宽，裁剪左右
            new_width = int(img.height * target_ratio)
            left = (img.width - new_width) // 2
            img = img.crop((left, 0, left + new_width, img.height))
        elif current_ratio < target_ratio:
            # 图片太高，裁剪上下
            new_height = int(img.width / target_ratio)
            top = (img.height - new_height) // 2
            img = img.crop((0, top, img.width, top + new_height))
        
        # 缩放到目标尺寸
        img = img.resize(target_size, PILImage.Resampling.LANCZOS)
        
        # 保存到内存
        thumb_io = BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        thumb_io.seek(0)
        
        return ContentFile(thumb_io.read())
    
    except Exception as e:
        print(f"生成缩略图失败: {str(e)}")
        return None


def edit_image(image_path, operations):
    """
    编辑图片
    operations: {
        'crop': {'left': int, 'top': int, 'right': int, 'bottom': int},
        'brightness': float,  # 0.5-1.5
        'contrast': float,    # 0.5-1.5
        'saturation': float,  # 0.0-2.0
    }
    """
    try:
        img = PILImage.open(image_path)
        
        # 裁剪
        if 'crop' in operations:
            crop_data = operations['crop']
            img = img.crop((
                crop_data['left'],
                crop_data['top'],
                crop_data['right'],
                crop_data['bottom']
            ))
        
        # 亮度调整
        if 'brightness' in operations:
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(operations['brightness'])
        
        # 对比度调整
        if 'contrast' in operations:
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(operations['contrast'])
        
        # 饱和度调整
        if 'saturation' in operations:
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(operations['saturation'])
        
        # 保存到内存
        output = BytesIO()
        img.save(output, format='JPEG', quality=90)
        output.seek(0)
        
        return ContentFile(output.read())
    
    except Exception as e:
        print(f"编辑图片失败: {str(e)}")
        return None

