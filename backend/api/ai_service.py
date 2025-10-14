"""
AI服务模块 - 使用Google Gemini API进行图片分析
"""
import google.generativeai as genai
from django.conf import settings
from PIL import Image
import io
import json


# 配置Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)


def analyze_image_with_ai(image_path):
    """
    使用AI分析图片，同时生成描述和标签
    
    Args:
        image_path: 图片文件路径
        
    Returns:
        dict: 包含description和tags的字典
        {
            'description': '图片描述',
            'tags': ['标签1', '标签2', '标签3', '标签4']
        }
    """
    try:
        # 加载图片
        img = Image.open(image_path)
        
        # 转换为RGB模式（如果需要）
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 创建模型
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # 构建提示词
        prompt = """请分析这张图片，并以JSON格式返回以下信息：
1. description: 用一句简短精炼的中文描述这张图片的主要内容（不超过40个字）
2. tags: 提供4个最相关的中文标签，可以包括但不限于：风景、人物、动物、建筑、食物、植物、交通工具、运动、艺术、自然等

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
    "description": "图片描述",
    "tags": ["标签1", "标签2", "标签3", "标签4"]
}"""
        
        # 调用API
        response = model.generate_content([prompt, img])
        
        # 解析响应
        response_text = response.text.strip()
        
        # 尝试提取JSON（处理可能的markdown代码块）
        if '```json' in response_text:
            json_start = response_text.find('```json') + 7
            json_end = response_text.find('```', json_start)
            response_text = response_text[json_start:json_end].strip()
        elif '```' in response_text:
            json_start = response_text.find('```') + 3
            json_end = response_text.find('```', json_start)
            response_text = response_text[json_start:json_end].strip()
        
        # 解析JSON
        result = json.loads(response_text)
        
        # 验证结果格式
        if 'description' not in result or 'tags' not in result:
            raise ValueError("AI返回的结果格式不正确")
        
        # 确保tags是列表且有4个元素
        if not isinstance(result['tags'], list):
            result['tags'] = []
        
        # 限制标签数量为4个
        result['tags'] = result['tags'][:4]
        
        # 如果标签不足4个，用默认标签填充
        while len(result['tags']) < 4:
            default_tags = ['图片', '照片', '记录', '回忆']
            for tag in default_tags:
                if tag not in result['tags'] and len(result['tags']) < 4:
                    result['tags'].append(tag)
        
        return result
        
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {str(e)}")
        print(f"原始响应: {response_text}")
        # 返回默认值
        return {
            'description': '这是一张图片',
            'tags': ['图片', '照片', '记录', '回忆']
        }
    except Exception as e:
        print(f"AI分析图片失败: {str(e)}")
        # 返回默认值
        return {
            'description': '这是一张图片',
            'tags': ['图片', '照片', '记录', '回忆']
        }


def ai_search_images(query, images_data):
    """
    使用AI检索图片
    
    Args:
        query: 用户的自然语言查询
        images_data: 图片数据列表，每个元素包含id, title, description
        
    Returns:
        list: 置信度最高的3张图片的ID列表
    """
    try:
        # 创建模型
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # 构建图片信息
        images_info = []
        for img in images_data:
            info = f"图片ID: {img['id']}, 标题: {img['title']}, 描述: {img['description']}"
            images_info.append(info)
        
        images_text = '\n'.join(images_info)
        
        # 构建提示词
        prompt = f"""用户想要搜索: "{query}"

以下是所有可用的图片信息：
{images_text}

请根据用户的搜索需求，从上述图片中选择最相关的3张图片。
请以JSON格式返回图片ID列表，按相关性从高到低排序。

格式示例：
{{
    "image_ids": [123, 456, 789]
}}

如果没有相关的图片，请返回空列表。
只返回JSON，不要包含任何其他文字。"""
        
        # 调用API
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # 尝试提取JSON
        if '```json' in response_text:
            json_start = response_text.find('```json') + 7
            json_end = response_text.find('```', json_start)
            response_text = response_text[json_start:json_end].strip()
        elif '```' in response_text:
            json_start = response_text.find('```') + 3
            json_end = response_text.find('```', json_start)
            response_text = response_text[json_start:json_end].strip()
        
        # 解析JSON
        result = json.loads(response_text)
        
        # 验证并返回结果
        if 'image_ids' in result and isinstance(result['image_ids'], list):
            # 限制最多返回3个
            return result['image_ids'][:3]
        
        return []
        
    except Exception as e:
        print(f"AI检索图片失败: {str(e)}")
        return []

