-- 图片管理系统 - 数据库初始化脚本
-- 注意：Django会通过migration自动创建表结构，此文件仅供参考

-- 创建数据库
CREATE DATABASE IF NOT EXISTS image_manage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE image_manage;

-- 注意：以下表结构由Django自动创建，这里仅作为参考

----------------------------
1. 用户表 (users)
----------------------------
Django使用自定义User模型，继承自AbstractUser
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `password` varchar(128) NOT NULL,
  `first_name` varchar(150) DEFAULT NULL,
  `last_name` varchar(150) DEFAULT NULL,
  `is_staff` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_superuser` tinyint(1) NOT NULL DEFAULT '0',
  `date_joined` datetime(6) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `avatar` varchar(100) DEFAULT NULL,
  `bio` longtext,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
2. 图片信息表 (images)
----------------------------
CREATE TABLE `images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `description` longtext,
  `file_path` varchar(500) NOT NULL,
  `thumbnail_path` varchar(500) NOT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `shot_at` datetime(6) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `uploaded_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `images_user_id_idx` (`user_id`),
  CONSTRAINT `images_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
3. 标签表 (tags)
----------------------------
CREATE TABLE `tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `source` varchar(10) NOT NULL DEFAULT 'user',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
4. 图片与标签关联表 (image_tags)
----------------------------
CREATE TABLE `image_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `image_id` bigint NOT NULL,
  `tag_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `image_tags_image_id_tag_id_unique` (`image_id`, `tag_id`),
  KEY `image_tags_tag_id_idx` (`tag_id`),
  CONSTRAINT `image_tags_image_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE,
  CONSTRAINT `image_tags_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
5. 收藏表 (favorites)
----------------------------
CREATE TABLE `favorites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `image_id` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `favorites_user_id_image_id_unique` (`user_id`, `image_id`),
  KEY `favorites_user_id_idx` (`user_id`),
  KEY `favorites_image_id_idx` (`image_id`),
  CONSTRAINT `favorites_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `favorites_image_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
6. 相册表 (albums)
----------------------------
CREATE TABLE `albums` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` longtext,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `albums_user_id_idx` (`user_id`),
  CONSTRAINT `albums_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

----------------------------
7. 相册图片关联表 (album_images)
----------------------------
CREATE TABLE `album_images` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `album_id` bigint NOT NULL,
  `image_id` bigint NOT NULL,
  `added_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `album_images_album_id_image_id_unique` (`album_id`, `image_id`),
  KEY `album_images_album_id_idx` (`album_id`),
  KEY `album_images_image_id_idx` (`image_id`),
  CONSTRAINT `album_images_album_id_fk` FOREIGN KEY (`album_id`) REFERENCES `albums` (`id`) ON DELETE CASCADE,
  CONSTRAINT `album_images_image_id_fk` FOREIGN KEY (`image_id`) REFERENCES `images` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 插入测试数据（可选）
-- ----------------------------
-- 注意：需要先通过Django创建用户，然后才能插入图片数据
-- 可以使用Django admin或者API来创建测试数据

-- 示例：插入一些常用标签
-- INSERT INTO tags (name, source) VALUES
-- ('风景', 'user'),
-- ('人物', 'user'),
-- ('动物', 'user'),
-- ('建筑', 'user'),
-- ('美食', 'user'),
-- ('旅行', 'user'),
-- ('自然', 'user'),
-- ('城市', 'user'),
-- ('夜景', 'user'),
-- ('黑白', 'user');

