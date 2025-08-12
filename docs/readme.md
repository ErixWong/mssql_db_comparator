# Database Comparison Tool

## Technology Stack
- **Frontend**: Bootstrap 5.3 + Vue 3
- **Backend**: Node.js + Koa with ESM modules
- **Database**: Microsoft SQL Server (MSSQL)

## Project Objective
For two given database connections, list and compare their respective table structures and field definitions, presenting the comparison results in a user-friendly interface.

## Development Credits
Most of the code in this project was developed by GLM-4.5 using the Kilo code development tool. Some of the more difficult debugging was completed by Claude Sonnet-3.7, and parts that AI could not solve were debugged manually. Thanks to z.ai for the one trillion token gift package!

## Directory Structure
- **Frontend directory**: wwwroot
- **Backend directory**: backend
- **Backend listening port**: 10298

## Interface Design
The interface should follow a diff-style layout with the screen divided into left and right sections, displaying the contents of databases A and B respectively.

### Database Connection
The top panel should contain connection forms for both databases, including parameters such as:
- Host
- Username
- Password
- Database name
- Encryption
- Port number
- Connection timeout
- Instance name

### Comparison Scope
A comparison scope menu with grouped checkboxes should be provided, allowing users to select which database objects to compare:
- Tables
- Fields
- Primary keys
- Foreign keys
- Indexes
- Constraints
- Triggers
- Stored procedures
- Database language encoding

Each group should have a select all/deselect all option.

### Display Rules
- For tables that exist only in database A, display them only in the left section with the corresponding right section left blank.
- Identical tables should be collapsed by default, with expand buttons provided for detailed viewing.

### Difference Highlighting
When a table exists in both databases but field definitions differ (such as data type, length, nullability, etc.), highlight these differences with background colors:
- **Light red background**: Objects that exist only in database A
- **Light blue background**: Objects that exist only in database B
- **Light yellow background**: Objects that exist in both databases but have different definitions

### Default Display State
All differences should be expanded by default, while identical items should be collapsed by default.

---

# 数据库比较工具

## 技术栈
- **前端**: Bootstrap 5.3 + Vue 3
- **后端**: Node.js + Koa with ESM modules
- **数据库**: Microsoft SQL Server (MSSQL)

## 项目目标
对于给定的两个数据库连接，分别列出各自的表结构和字段定义，并进行比较，以用户友好的界面呈现比较结果。

## 开发致谢
本项目绝大多数代码由 GLM-4.5开发完成，使用Kilo code开发工具。部分难度较高的调试由claude sonnet-3.7完成，AI解决不了的部分由人工debug完成。感谢z.ai的一万亿token大礼包！

## 目录结构
- **前端目录**: wwwroot
- **后端目录**: backend
- **后端监听端口**: 10298

## 界面设计
界面应采用diff风格布局，屏幕分为左右两个部分，分别显示数据库A和数据库B的内容。

### 数据库连接
顶部面板应包含两个数据库的连接表单，包括以下参数：
- 主机
- 用户名
- 密码
- 数据库名称
- 加密
- 端口号
- 连接超时
- 实例名称

### 比较范围
应提供带分组复选框的比较范围菜单，允许用户选择要比较的数据库对象：
- 表
- 字段
- 主键
- 外键
- 索引
- 约束
- 触发器
- 存储过程
- 数据库语言编码

每个分组应提供全选/取消全选选项。

### 显示规则
- 对于仅存在于数据库A中的表，只在左侧部分显示，相应的右侧部分留空。
- 相同的表应默认折叠，提供展开按钮以供详细查看。

### 差异高亮
当表在两个数据库中都存在但字段定义不同（如数据类型、长度、可空性等）时，使用背景色高亮显示这些差异：
- **浅红色背景**: 仅存在于数据库A的对象
- **浅蓝色背景**: 仅存在于数据库B的对象
- **浅黄色背景**: 在两个数据库中都存在但定义不同的对象

### 默认显示状态
所有差异项应默认展开，而相同项应默认折叠。