#!/usr/bin/env python3
"""
EXIF信息读取脚本
用法: python read_exif.py <图片路径>
"""

import sys
import os
from PIL import Image
import piexif
from datetime import datetime


def format_gps_coordinate(coord_tuple, ref):
    """将GPS坐标从度分秒格式转换为十进制"""
    if not coord_tuple or not ref:
        return None
    
    try:
        # 安全地计算，避免除以0
        degrees = coord_tuple[0][0] / coord_tuple[0][1] if coord_tuple[0][1] != 0 else 0
        minutes = coord_tuple[1][0] / coord_tuple[1][1] if coord_tuple[1][1] != 0 else 0
        seconds = coord_tuple[2][0] / coord_tuple[2][1] if coord_tuple[2][1] != 0 else 0
        
        decimal = degrees + (minutes / 60) + (seconds / 3600)
        
        # 南纬和西经是负数
        if ref in ['S', 'W']:
            decimal = -decimal
        
        return decimal
    except (IndexError, TypeError, ZeroDivisionError):
        return None


def safe_divide(numerator, denominator, default=0):
    """安全除法，避免除以0"""
    try:
        return numerator / denominator if denominator != 0 else default
    except (TypeError, ZeroDivisionError):
        return default


def parse_exif_data(exif_dict):
    """解析EXIF字典，返回人类可读的信息"""
    result = {}
    
    # 0th IFD (主要图像信息)
    if "0th" in exif_dict:
        ifd = exif_dict["0th"]
        
        # 相机制造商和型号
        if piexif.ImageIFD.Make in ifd:
            result['相机制造商'] = ifd[piexif.ImageIFD.Make].decode('utf-8', errors='ignore').strip('\x00')
        if piexif.ImageIFD.Model in ifd:
            result['相机型号'] = ifd[piexif.ImageIFD.Model].decode('utf-8', errors='ignore').strip('\x00')
        
        # 方向
        if piexif.ImageIFD.Orientation in ifd:
            orientation_map = {
                1: "正常",
                3: "旋转180度",
                6: "逆时针旋转90度",
                8: "顺时针旋转90度"
            }
            result['方向'] = orientation_map.get(ifd[piexif.ImageIFD.Orientation], f"未知 ({ifd[piexif.ImageIFD.Orientation]})")
        
        # 软件
        if piexif.ImageIFD.Software in ifd:
            result['软件'] = ifd[piexif.ImageIFD.Software].decode('utf-8', errors='ignore').strip('\x00')
        
        # 修改时间
        if piexif.ImageIFD.DateTime in ifd:
            result['修改时间'] = ifd[piexif.ImageIFD.DateTime].decode('utf-8', errors='ignore')
    
    # Exif IFD (详细拍摄信息)
    if "Exif" in exif_dict:
        ifd = exif_dict["Exif"]
        
        # 拍摄时间
        if piexif.ExifIFD.DateTimeOriginal in ifd:
            result['拍摄时间'] = ifd[piexif.ExifIFD.DateTimeOriginal].decode('utf-8', errors='ignore')
        
        # 曝光时间
        if piexif.ExifIFD.ExposureTime in ifd:
            try:
                exposure = ifd[piexif.ExifIFD.ExposureTime]
                if exposure[1] != 0:
                    result['曝光时间'] = f"{exposure[0]}/{exposure[1]} 秒"
            except (IndexError, TypeError, ZeroDivisionError):
                pass
        
        # 光圈
        if piexif.ExifIFD.FNumber in ifd:
            try:
                f_number = ifd[piexif.ExifIFD.FNumber]
                f_value = safe_divide(f_number[0], f_number[1])
                if f_value > 0:
                    result['光圈'] = f"f/{f_value:.1f}"
            except (IndexError, TypeError):
                pass
        
        # ISO
        if piexif.ExifIFD.ISOSpeedRatings in ifd:
            result['ISO'] = ifd[piexif.ExifIFD.ISOSpeedRatings]
        
        # 焦距
        if piexif.ExifIFD.FocalLength in ifd:
            try:
                focal = ifd[piexif.ExifIFD.FocalLength]
                focal_length = safe_divide(focal[0], focal[1])
                if focal_length > 0:
                    result['焦距'] = f"{focal_length:.1f}mm"
            except (IndexError, TypeError):
                pass
        
        # 闪光灯
        if piexif.ExifIFD.Flash in ifd:
            flash = ifd[piexif.ExifIFD.Flash]
            result['闪光灯'] = "开启" if (flash & 0x1) else "关闭"
        
        # 白平衡
        if piexif.ExifIFD.WhiteBalance in ifd:
            wb_map = {0: "自动", 1: "手动"}
            result['白平衡'] = wb_map.get(ifd[piexif.ExifIFD.WhiteBalance], "未知")
        
        # 镜头型号
        if piexif.ExifIFD.LensModel in ifd:
            result['镜头型号'] = ifd[piexif.ExifIFD.LensModel].decode('utf-8', errors='ignore').strip('\x00')
        
        # 图像尺寸
        if piexif.ExifIFD.PixelXDimension in ifd and piexif.ExifIFD.PixelYDimension in ifd:
            width = ifd[piexif.ExifIFD.PixelXDimension]
            height = ifd[piexif.ExifIFD.PixelYDimension]
            result['图像尺寸'] = f"{width} × {height}"
    
    # GPS IFD (位置信息)
    if "GPS" in exif_dict:
        ifd = exif_dict["GPS"]
        
        # 调试：打印GPS信息
        print("\n🌍 GPS数据调试:")
        print(f"GPS IFD keys: {list(ifd.keys())}")
        gps_key_names = {
            0: 'GPSVersionID',
            1: 'GPSLatitudeRef', 
            2: 'GPSLatitude',
            3: 'GPSLongitudeRef',
            4: 'GPSLongitude',
            5: 'GPSAltitudeRef',
            6: 'GPSAltitude',
            7: 'GPSTimeStamp',
            27: 'GPSProcessingMethod',
            29: 'GPSDateStamp'
        }
        for key, value in ifd.items():
            key_name = gps_key_names.get(key, f'Unknown({key})')
            try:
                print(f"  {key_name}: {value}")
            except:
                print(f"  {key_name}: [无法显示]")
        
        # 纬度
        if piexif.GPSIFD.GPSLatitude in ifd and piexif.GPSIFD.GPSLatitudeRef in ifd:
            lat = format_gps_coordinate(
                ifd[piexif.GPSIFD.GPSLatitude],
                ifd[piexif.GPSIFD.GPSLatitudeRef].decode('utf-8')
            )
            # 只有当纬度不为0时才显示
            if lat is not None and abs(lat) > 0.000001:
                result['纬度'] = f"{lat:.6f}°"
        
        # 经度
        if piexif.GPSIFD.GPSLongitude in ifd and piexif.GPSIFD.GPSLongitudeRef in ifd:
            lon = format_gps_coordinate(
                ifd[piexif.GPSIFD.GPSLongitude],
                ifd[piexif.GPSIFD.GPSLongitudeRef].decode('utf-8')
            )
            # 只有当经度不为0时才显示
            if lon is not None and abs(lon) > 0.000001:
                result['经度'] = f"{lon:.6f}°"
        
        # 海拔
        if piexif.GPSIFD.GPSAltitude in ifd:
            try:
                altitude = ifd[piexif.GPSIFD.GPSAltitude]
                alt_value = safe_divide(altitude[0], altitude[1])
                if alt_value > 0:
                    result['海拔'] = f"{alt_value:.1f}米"
            except (IndexError, TypeError):
                pass
    
    return result


def read_exif(image_path):
    """读取图片的EXIF信息"""
    if not os.path.exists(image_path):
        print(f"错误: 文件不存在 - {image_path}")
        return None
    
    try:
        # 使用PIL打开图片
        img = Image.open(image_path)
        
        # 获取基本信息
        print("=" * 60)
        print(f"文件路径: {image_path}")
        print(f"文件大小: {os.path.getsize(image_path) / 1024:.2f} KB")
        print(f"图片格式: {img.format}")
        print(f"图片模式: {img.mode}")
        print(f"图片尺寸: {img.size[0]} × {img.size[1]} 像素")
        print("=" * 60)
        
        # 获取EXIF数据
        exif_data = img.info.get('exif')
        
        if exif_data:
            # 解析EXIF数据
            exif_dict = piexif.load(exif_data)
            parsed_data = parse_exif_data(exif_dict)
            
            if parsed_data:
                print("\n📷 EXIF信息:")
                print("-" * 60)
                for key, value in parsed_data.items():
                    print(f"{key:15}: {value}")
                print("-" * 60)
            else:
                print("\n⚠️  未找到可解析的EXIF信息")
        else:
            print("\n⚠️  该图片不包含EXIF信息")
        
        img.close()
        return True
        
    except piexif.InvalidImageDataError:
        print(f"错误: 无效的图片数据或EXIF格式")
        return False
    except Exception as e:
        print(f"错误: {type(e).__name__} - {str(e)}")
        return False


def main():
    if len(sys.argv) < 2:
        print("用法: python read_exif.py <图片路径>")
        print("\n示例:")
        print("  python read_exif.py photo.jpg")
        print("  python read_exif.py /path/to/image.png")
        sys.exit(1)
    
    image_path = sys.argv[1]
    read_exif(image_path)


if __name__ == "__main__":
    main()

