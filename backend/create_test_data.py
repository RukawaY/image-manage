"""
测试数据创建脚本
用于创建一些示例用户和标签
"""

import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from api.models import User, Tag


def create_test_data():
    print("开始创建测试数据...")
    
    # 创建测试用户
    if not User.objects.filter(username='testuser').exists():
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='test123456'
        )
        print(f"✓ 创建测试用户: {user.username}")
    else:
        print("✓ 测试用户已存在")
    
    # 创建常用标签
    default_tags = [
        ('风景', 'user'),
        ('人物', 'user'),
        ('动物', 'user'),
        ('建筑', 'user'),
        ('美食', 'user'),
        ('旅行', 'user'),
        ('自然', 'user'),
        ('城市', 'user'),
        ('夜景', 'user'),
        ('黑白', 'user'),
        ('艺术', 'user'),
        ('运动', 'user'),
        ('家庭', 'user'),
        ('节日', 'user'),
        ('宠物', 'user'),
    ]
    
    created_count = 0
    for tag_name, source in default_tags:
        tag, created = Tag.objects.get_or_create(
            name=tag_name,
            defaults={'source': source}
        )
        if created:
            created_count += 1
            print(f"✓ 创建标签: {tag_name}")
    
    if created_count == 0:
        print("✓ 所有标签已存在")
    else:
        print(f"✓ 创建了 {created_count} 个新标签")
    
    print("\n测试数据创建完成！")
    print("\n可以使用以下账号登录:")
    print("用户名: testuser")
    print("密码: test123456")


if __name__ == '__main__':
    create_test_data()

