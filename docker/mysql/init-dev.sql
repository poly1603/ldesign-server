-- ==============================================
-- LDesign API Server - 开发环境数据库初始化脚本
-- ==============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `ldesign_api_dev` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `ldesign_api_dev`;

-- 创建用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `email` varchar(100) NOT NULL COMMENT '邮箱',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `firstName` varchar(50) DEFAULT NULL COMMENT '名',
  `lastName` varchar(50) DEFAULT NULL COMMENT '姓',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像',
  `isActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `lastLoginAt` datetime DEFAULT NULL COMMENT '最后登录时间',
  `loginAttempts` int NOT NULL DEFAULT '0' COMMENT '登录尝试次数',
  `lockedUntil` datetime DEFAULT NULL COMMENT '锁定到期时间',
  `passwordResetToken` varchar(255) DEFAULT NULL COMMENT '密码重置令牌',
  `passwordResetExpires` datetime DEFAULT NULL COMMENT '密码重置过期时间',
  `emailVerificationToken` varchar(255) DEFAULT NULL COMMENT '邮箱验证令牌',
  `emailVerifiedAt` datetime DEFAULT NULL COMMENT '邮箱验证时间',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_username` (`username`),
  UNIQUE KEY `IDX_email` (`email`),
  KEY `IDX_isActive` (`isActive`),
  KEY `IDX_lastLoginAt` (`lastLoginAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 创建角色表
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL COMMENT '角色名称',
  `code` varchar(50) NOT NULL COMMENT '角色代码',
  `description` text COMMENT '角色描述',
  `isActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `isSystem` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否系统角色',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_role_name` (`name`),
  UNIQUE KEY `IDX_role_code` (`code`),
  KEY `IDX_isActive` (`isActive`),
  KEY `IDX_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色表';

-- 创建权限表
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '权限名称',
  `code` varchar(100) NOT NULL COMMENT '权限代码',
  `description` text COMMENT '权限描述',
  `resource` varchar(100) DEFAULT NULL COMMENT '资源',
  `action` varchar(50) DEFAULT NULL COMMENT '操作',
  `isActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `isSystem` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否系统权限',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_permission_code` (`code`),
  KEY `IDX_resource_action` (`resource`, `action`),
  KEY `IDX_isActive` (`isActive`),
  KEY `IDX_sort` (`sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限表';

-- 创建菜单表
CREATE TABLE IF NOT EXISTS `menus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `parentId` int DEFAULT NULL COMMENT '父级菜单ID',
  `name` varchar(100) NOT NULL COMMENT '菜单名称',
  `title` varchar(100) NOT NULL COMMENT '菜单标题',
  `path` varchar(255) DEFAULT NULL COMMENT '路由路径',
  `component` varchar(255) DEFAULT NULL COMMENT '组件路径',
  `icon` varchar(100) DEFAULT NULL COMMENT '图标',
  `type` enum('menu','button') NOT NULL DEFAULT 'menu' COMMENT '类型：menu-菜单，button-按钮',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否可见',
  `isActive` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否激活',
  `sort` int NOT NULL DEFAULT '0' COMMENT '排序',
  `meta` json DEFAULT NULL COMMENT '元数据',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_parentId` (`parentId`),
  KEY `IDX_type` (`type`),
  KEY `IDX_isVisible` (`isVisible`),
  KEY `IDX_sort` (`sort`),
  CONSTRAINT `FK_menu_parent` FOREIGN KEY (`parentId`) REFERENCES `menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单表';

-- 创建用户角色关联表
CREATE TABLE IF NOT EXISTS `user_roles` (
  `userId` int NOT NULL,
  `roleId` int NOT NULL,
  PRIMARY KEY (`userId`, `roleId`),
  KEY `IDX_user_roles_userId` (`userId`),
  KEY `IDX_user_roles_roleId` (`roleId`),
  CONSTRAINT `FK_user_roles_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_user_roles_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联表';

-- 创建角色权限关联表
CREATE TABLE IF NOT EXISTS `role_permissions` (
  `roleId` int NOT NULL,
  `permissionId` int NOT NULL,
  PRIMARY KEY (`roleId`, `permissionId`),
  KEY `IDX_role_permissions_roleId` (`roleId`),
  KEY `IDX_role_permissions_permissionId` (`permissionId`),
  CONSTRAINT `FK_role_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_role_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- 创建菜单权限关联表
CREATE TABLE IF NOT EXISTS `menu_permissions` (
  `menuId` int NOT NULL,
  `permissionId` int NOT NULL,
  PRIMARY KEY (`menuId`, `permissionId`),
  KEY `IDX_menu_permissions_menuId` (`menuId`),
  KEY `IDX_menu_permissions_permissionId` (`permissionId`),
  CONSTRAINT `FK_menu_permissions_menu` FOREIGN KEY (`menuId`) REFERENCES `menus` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_menu_permissions_permission` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单权限关联表';

-- 创建系统日志表
CREATE TABLE IF NOT EXISTS `system_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL COMMENT '用户ID',
  `username` varchar(50) DEFAULT NULL COMMENT '用户名',
  `action` varchar(100) NOT NULL COMMENT '操作',
  `resource` varchar(100) DEFAULT NULL COMMENT '资源',
  `method` varchar(10) NOT NULL COMMENT '请求方法',
  `url` varchar(500) NOT NULL COMMENT '请求URL',
  `ip` varchar(45) DEFAULT NULL COMMENT 'IP地址',
  `userAgent` text COMMENT '用户代理',
  `requestData` json DEFAULT NULL COMMENT '请求数据',
  `responseData` json DEFAULT NULL COMMENT '响应数据',
  `statusCode` int DEFAULT NULL COMMENT '状态码',
  `duration` int DEFAULT NULL COMMENT '耗时（毫秒）',
  `error` text COMMENT '错误信息',
  `level` enum('info','warn','error','debug') NOT NULL DEFAULT 'info' COMMENT '日志级别',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `IDX_userId` (`userId`),
  KEY `IDX_action` (`action`),
  KEY `IDX_method` (`method`),
  KEY `IDX_statusCode` (`statusCode`),
  KEY `IDX_level` (`level`),
  KEY `IDX_createdAt` (`createdAt`),
  CONSTRAINT `FK_system_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统日志表';

-- 插入初始数据

-- 插入默认角色
INSERT INTO `roles` (`name`, `code`, `description`, `isSystem`, `sort`) VALUES
('超级管理员', 'super_admin', '系统超级管理员，拥有所有权限', 1, 1),
('管理员', 'admin', '系统管理员', 1, 2),
('普通用户', 'user', '普通用户', 1, 3);

-- 插入默认权限
INSERT INTO `permissions` (`name`, `code`, `description`, `resource`, `action`, `isSystem`, `sort`) VALUES
-- 用户管理权限
('查看用户', 'user:read', '查看用户信息', 'user', 'read', 1, 1),
('创建用户', 'user:create', '创建新用户', 'user', 'create', 1, 2),
('编辑用户', 'user:update', '编辑用户信息', 'user', 'update', 1, 3),
('删除用户', 'user:delete', '删除用户', 'user', 'delete', 1, 4),
-- 角色管理权限
('查看角色', 'role:read', '查看角色信息', 'role', 'read', 1, 5),
('创建角色', 'role:create', '创建新角色', 'role', 'create', 1, 6),
('编辑角色', 'role:update', '编辑角色信息', 'role', 'update', 1, 7),
('删除角色', 'role:delete', '删除角色', 'role', 'delete', 1, 8),
-- 权限管理权限
('查看权限', 'permission:read', '查看权限信息', 'permission', 'read', 1, 9),
('创建权限', 'permission:create', '创建新权限', 'permission', 'create', 1, 10),
('编辑权限', 'permission:update', '编辑权限信息', 'permission', 'update', 1, 11),
('删除权限', 'permission:delete', '删除权限', 'permission', 'delete', 1, 12),
-- 菜单管理权限
('查看菜单', 'menu:read', '查看菜单信息', 'menu', 'read', 1, 13),
('创建菜单', 'menu:create', '创建新菜单', 'menu', 'create', 1, 14),
('编辑菜单', 'menu:update', '编辑菜单信息', 'menu', 'update', 1, 15),
('删除菜单', 'menu:delete', '删除菜单', 'menu', 'delete', 1, 16),
-- 系统管理权限
('查看日志', 'log:read', '查看系统日志', 'log', 'read', 1, 17),
('系统配置', 'system:config', '系统配置管理', 'system', 'config', 1, 18);

-- 插入默认菜单
INSERT INTO `menus` (`parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`) VALUES
-- 一级菜单
(NULL, 'dashboard', '仪表盘', '/dashboard', 'Dashboard', 'dashboard', 'menu', 1),
(NULL, 'system', '系统管理', '/system', 'Layout', 'setting', 'menu', 2),
(NULL, 'monitor', '系统监控', '/monitor', 'Layout', 'monitor', 'menu', 3);

-- 获取系统管理菜单ID
SET @system_menu_id = (SELECT id FROM menus WHERE name = 'system');
SET @monitor_menu_id = (SELECT id FROM menus WHERE name = 'monitor');

-- 插入二级菜单
INSERT INTO `menus` (`parentId`, `name`, `title`, `path`, `component`, `icon`, `type`, `sort`) VALUES
-- 系统管理子菜单
(@system_menu_id, 'user', '用户管理', '/system/user', 'system/User', 'user', 'menu', 1),
(@system_menu_id, 'role', '角色管理', '/system/role', 'system/Role', 'role', 'menu', 2),
(@system_menu_id, 'permission', '权限管理', '/system/permission', 'system/Permission', 'permission', 'menu', 3),
(@system_menu_id, 'menu', '菜单管理', '/system/menu', 'system/Menu', 'menu', 'menu', 4),
-- 系统监控子菜单
(@monitor_menu_id, 'log', '系统日志', '/monitor/log', 'monitor/Log', 'log', 'menu', 1);

-- 为超级管理员角色分配所有权限
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 1, id FROM `permissions`;

-- 为管理员角色分配部分权限（除了删除权限）
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 2, id FROM `permissions` WHERE code NOT LIKE '%:delete';

-- 为普通用户角色分配查看权限
INSERT INTO `role_permissions` (`roleId`, `permissionId`)
SELECT 3, id FROM `permissions` WHERE code LIKE '%:read';

-- 插入默认超级管理员用户（密码：admin123）
INSERT INTO `users` (`username`, `email`, `password`, `firstName`, `lastName`, `isActive`) VALUES
('admin', 'admin@ldesign.com', '$2b$12$rQZ8qVqKqVqKqVqKqVqKqOqVqKqVqKqVqKqVqKqVqKqVqKqVqKqVq', 'Super', 'Admin', 1);

-- 为默认用户分配超级管理员角色
INSERT INTO `user_roles` (`userId`, `roleId`) VALUES (1, 1);

-- 创建索引以提高查询性能
CREATE INDEX `IDX_users_username_email` ON `users` (`username`, `email`);
CREATE INDEX `IDX_users_active_login` ON `users` (`isActive`, `lastLoginAt`);
CREATE INDEX `IDX_roles_active_sort` ON `roles` (`isActive`, `sort`);
CREATE INDEX `IDX_permissions_resource_action` ON `permissions` (`resource`, `action`);
CREATE INDEX `IDX_menus_parent_sort` ON `menus` (`parentId`, `sort`);
CREATE INDEX `IDX_system_logs_user_time` ON `system_logs` (`userId`, `createdAt`);

-- 提交事务
COMMIT;

-- 显示初始化完成信息
SELECT 'Database initialization completed successfully!' as message;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as role_count FROM roles;
SELECT COUNT(*) as permission_count FROM permissions;
SELECT COUNT(*) as menu_count FROM menus;