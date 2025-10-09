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
        shot_datetime = None
        if '0th' in exif_dict and piexif.ImageIFD.DateTime in exif_dict['0th']:
            datetime_str = exif_dict['0th'][piexif.ImageIFD.DateTime].decode('utf-8')
            try:
                shot_datetime = datetime.strptime(datetime_str, '%Y:%m:%d %H:%M:%S')
                exif_data['shot_at'] = shot_datetime
            except:
                pass
        
        # 添加日期标签（如果有拍摄时间就用拍摄时间，否则用当前时间）
        if shot_datetime:
            exif_data['tags'].append(shot_datetime.strftime('%Y.%m.%d'))
        else:
            # 如果没有拍摄时间，使用当前上传时间
            exif_data['tags'].append(datetime.now().strftime('%Y.%m.%d'))
        
        # 提取GPS位置信息
        has_location = False
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
                
                # 添加地理位置标签
                # 根据坐标范围判断大致区域
                if 18 <= lat <= 54 and 73 <= lon <= 135:
                    exif_data['tags'].append("中国")
                elif 24 <= lat <= 46 and 122 <= lon <= 146:
                    exif_data['tags'].append("日本")
                elif 33 <= lat <= 43 and 124 <= lon <= 132:
                    exif_data['tags'].append("韩国")
                elif 25 <= lat <= 49 and -125 <= lon <= -66:
                    exif_data['tags'].append("美国")
                elif 41 <= lat <= 51 and -5 <= lon <= 10:
                    exif_data['tags'].append("欧洲")
                else:
                    # 其他地区显示坐标
                    exif_data['tags'].append(f"位置: {lat:.2f}°, {lon:.2f}°")
                has_location = True
        
        # 如果没有GPS信息，添加"未知位置"标签
        if not has_location:
            exif_data['tags'].append("未知位置")
        
        # 提取相机信息作为标签
        if 'Exif' in exif_dict:
            # 相机型号
            if piexif.ExifIFD.LensMake in exif_dict['Exif']:
                camera_make = exif_dict['Exif'][piexif.ExifIFD.LensMake].decode('utf-8', errors='ignore').strip()
                if camera_make:
                    exif_data['tags'].append(camera_make)
            
            if piexif.ExifIFD.LensModel in exif_dict['Exif']:
                camera_model = exif_dict['Exif'][piexif.ExifIFD.LensModel].decode('utf-8', errors='ignore').strip()
                if camera_model:
                    exif_data['tags'].append(camera_model)
        
        # 添加分辨率标签（格式：4000x3000）
        if exif_data['width'] and exif_data['height']:
            exif_data['tags'].append(f"{exif_data['width']}x{exif_data['height']}")
        
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


def create_thumbnail(image_file, target_size=(4096, 3072), aspect_ratio=(4, 3)):
    """
    创建缩略图 - 中心裁剪为4:3比例后缩放到指定大小(4096x3072)
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

