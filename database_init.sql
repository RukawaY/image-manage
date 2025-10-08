-- 图片管理系统 - 数据库初始化脚本
-- 注意：Django会通过migration自动创建表结构，此文件仅供参考

-- 创建数据库
CREATE DATABASE IF NOT EXISTS image_manage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE image_manage;

-- 注意：以下表结构由Django自动创建，这里仅作为参考

-- ----------------------------
-- 1. 用户表 (users) - Django会创建为api_user
-- ----------------------------
-- Django使用自定义User模型，继承自AbstractUser
-- 包含字段：id, username, email, password, created_at等

-- ----------------------------
-- 2. 图片信息表 (images) - Django会创建为api_image
-- ----------------------------
-- CREATE TABLE `api_image` (
--   `id` bigint NOT NULL AUTO_INCREMENT,
--   `title` varchar(255) DEFAULT NULL,
--   `description` longtext,
--   `file_path` varchar(500) NOT NULL,
--   `thumbnail_path` varchar(500) NOT NULL,
--   `width` int DEFAULT NULL,
--   `height` int DEFAULT NULL,
--   `shot_at` datetime(6) DEFAULT NULL,
--   `location` varchar(255) DEFAULT NULL,
--   `uploaded_at` datetime(6) NOT NULL,
--   `user_id` bigint NOT NULL,
--   PRIMARY KEY (`id`),
--   KEY `api_image_user_id_idx` (`user_id`),
--   CONSTRAINT `api_image_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `api_user` (`id`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 3. 标签表 (tags) - Django会创建为api_tag
-- ----------------------------
-- CREATE TABLE `api_tag` (
--   `id` bigint NOT NULL AUTO_INCREMENT,
--   `name` varchar(100) NOT NULL,
--   `source` varchar(10) NOT NULL DEFAULT 'user',
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `name` (`name`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 4. 图片与标签关联表 (image_tags) - Django会创建为api_imagetag
-- ----------------------------
-- CREATE TABLE `api_imagetag` (
--   `id` bigint NOT NULL AUTO_INCREMENT,
--   `image_id` bigint NOT NULL,
--   `tag_id` bigint NOT NULL,
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `api_imagetag_image_id_tag_id_unique` (`image_id`, `tag_id`),
--   KEY `api_imagetag_tag_id_idx` (`tag_id`),
--   CONSTRAINT `api_imagetag_image_id_fk` FOREIGN KEY (`image_id`) REFERENCES `api_image` (`id`) ON DELETE CASCADE,
--   CONSTRAINT `api_imagetag_tag_id_fk` FOREIGN KEY (`tag_id`) REFERENCES `api_tag` (`id`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 插入测试数据（可选）
-- ----------------------------
-- 注意：需要先通过Django创建用户，然后才能插入图片数据
-- 可以使用Django admin或者API来创建测试数据

-- 示例：插入一些常用标签
-- INSERT INTO api_tag (name, source) VALUES
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

