#!/usr/bin/env python3
"""
生成球球terra的PWA图标
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """创建指定尺寸的应用图标"""
    # 创建新图像
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # 背景渐变色（模拟）
    for y in range(size):
        alpha = int(255 * (1 - y / size * 0.3))
        color = (74, 158, 255, alpha)
        draw.line([(0, y), (size, y)], fill=color)
    
    # 绘制地球轮廓
    center = size // 2
    radius = int(size * 0.35)
    
    # 地球背景
    draw.ellipse([center - radius, center - radius, 
                  center + radius, center + radius], 
                 fill=(30, 144, 255, 200))
    
    # 绘制大陆（简化版本）
    continent_color = (34, 139, 34, 180)
    
    # 亚洲
    draw.ellipse([center - radius//2, center - radius//3,
                  center + radius//2, center + radius//4],
                 fill=continent_color)
    
    # 美洲
    draw.ellipse([center - radius, center - radius//4,
                  center - radius//3, center + radius//2],
                 fill=continent_color)
    
    # 非洲
    draw.ellipse([center - radius//4, center - radius//6,
                  center + radius//4, center + radius//2],
                 fill=continent_color)
    
    # 保存图像
    img.save(filename, 'PNG')
    print(f"已创建 {filename} ({size}x{size})")

def main():
    """主函数"""
    print("🌍 正在生成球球terra PWA图标...")
    
    # 创建不同尺寸的图标
    icons = [
        (192, 'icon-192x192.png'),
        (512, 'icon-512x512.png'),
    ]
    
    for size, filename in icons:
        create_icon(size, filename)
    
    print("✅ 图标生成完成！")

if __name__ == '__main__':
    main() 