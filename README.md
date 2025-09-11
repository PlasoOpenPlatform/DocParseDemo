# 文档解析Demo

这是一个完整的文档解析演示应用，展示了如何集成文档解析服务来处理PPT、Word、PDF等格式的文档。

## 项目概述

### 功能特性

- 📁 **文件上传**：支持拖拽上传和点击上传，支持PPT、Word、PDF格式
- ☁️ **云存储**：自动上传文件到阿里云OSS
- 🔄 **异步解析**：调用文档解析服务进行异步处理
- 📊 **状态监控**：实时展示文件处理状态和系统统计
- 📋 **文件管理**：文件列表展示、详情查看、删除操作
- 🔔 **回调处理**：接收解析服务的状态回调通知

### 技术架构

**前端技术栈：**
- React 18
- Ant Design 5
- Axios
- Moment.js

**后端技术栈：**
- Node.js
- Express
- Multer (文件上传)
- Ali-OSS (阿里云对象存储)

**存储方案：**
- 文件存储：阿里云OSS
- 状态存储：内存存储（生产环境建议使用数据库）

## 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0
- 阿里云OSS账号和配置
- 文档解析服务（dataentry服务）

### 安装步骤

#### 1. 克隆项目

```bash
cd /path/to/your/project
# 项目文件已在 demo 目录中
```

#### 2. 安装后端依赖

```bash
cd demo/backend
npm install
```

#### 3. 申请服务权限

**申请文档解析服务AppId：**
- 联系文档解析服务提供方申请AppId和SecretKey
- 获得服务访问地址和端口信息
- 确认支持的文档类型和解析能力

**配置阿里云OSS：**
- 登录阿里云控制台创建OSS Bucket
- 创建AccessKey（建议使用子账户并授予OSS权限）
- 记录Bucket名称、地域、访问密钥等信息

#### 4. 配置后端环境变量

复制并编辑环境配置文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，配置以下参数：

```bash
# 服务配置
PORT=3001

# OSS配置 - 请替换为实际的阿里云OSS配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=xxx
OSS_ACCESS_KEY_SECRET=xxx
OSS_BUCKET=bucket-name

# 文档解析服务配置 - 请替换为实际的dataentry服务地址和申请的凭据
DOC_PARSE_BASE_URL=https://dev.plaso.cn/dataentry/
APP_ID=your-applied-app-id
SECRET_KEY=your-applied-secret-key

# 回调配置
CALLBACK_BASE_URL=http://localhost:3001
```

**重要说明：**
- `APP_ID` 和 `SECRET_KEY` 需要向文档解析服务提供方申请获取
- OSS配置中的 `accessKeyId` 和 `accessKeySecret` 需要在阿里云控制台创建
- `OSS_BUCKET` 需要提前在阿里云OSS控制台创建
- 建议生产环境使用子账户AccessKey，并仅授予必要的OSS权限

#### 5. 安装前端依赖

```bash
cd ../frontend
npm install
```

#### 6. 启动服务

**启动后端服务：**

```bash
cd ../backend
npm run dev
```

后端服务将在 http://localhost:3001 启动

**启动前端服务：**

```bash
cd ../frontend
npm start
```

前端应用将在 http://localhost:3000 启动

## 使用指南

### 基本操作

#### 1. 文件上传

- 打开浏览器访问 http://localhost:3000
- 在左侧上传区域，可以通过以下方式上传文件：
  - 拖拽文件到上传区域
  - 点击上传区域选择文件
  - 点击"选择文件上传"按钮

#### 2. 支持的文件格式

- **PPT文档**：.ppt, .pptx
- **Word文档**：.doc, .docx
- **PDF文档**：.pdf（新增支持）

#### 3. 文件大小限制

- 最大文件大小：100MB

#### 4. 查看文件状态

上传成功后，文件会出现在右侧的文件列表中，状态包括：

- 🔵 **已上传**：文件已成功上传到OSS
- 🟡 **解析中**：文档解析服务正在处理
- 🟢 **已完成**：解析成功完成
- 🔴 **失败**：解析过程中出现错误

#### 5. 查看详细信息

点击文件列表中的"👁️"图标可以查看文件的详细信息，包括：

- 文件基本信息（名称、大小、时间等）
- 任务ID和状态
- 解析结果（如果已完成）
- 错误信息（如果失败）

#### 6. 删除文件

点击文件列表中的"🗑️"图标可以删除文件，这将：

- 从OSS中删除文件
- 从系统中移除文件记录

### 系统监控

在页面底部的"系统状态监控"面板中，可以查看：

#### 文件处理统计
- 总文件数
- 处理成功率
- 各状态文件数量
- 处理进度

#### 系统信息
- 服务运行时间
- 内存使用情况
- 系统资源状态

## API 接口

### 后端API接口

#### 文件操作接口

**上传文件**
```
POST /api/files/upload
Content-Type: multipart/form-data

Body: 
- file: 文件数据
```

**获取文件列表**
```
GET /api/files/list?status={status}&limit={limit}&offset={offset}
```

**获取文件信息**
```
GET /api/files/{fileId}
```

**删除文件**
```
DELETE /api/files/{fileId}
```

**获取统计信息**
```
GET /api/files/stats
```

#### 状态查询接口

**获取任务状态**
```
GET /api/status/task/{taskId}?sync={true|false}
```

**获取文件状态**
```
GET /api/status/file/{fileId}
```

**批量获取状态**
```
POST /api/status/batch
Body: {
  "fileIds": ["id1", "id2"],
  "taskIds": ["taskId1", "taskId2"]
}
```

**获取系统状态**
```
GET /api/status/stats
```

**健康检查**
```
GET /api/status/health
```

#### 回调接口

**文档解析回调**
```
POST /api/callback/document
Body: {
  "taskId": "string",
  "status": "SUCCESS|FAILED|PROCESSING",
  "result": {},
  "error": "string"
}
```

## 配置说明

### 后端配置

配置文件位置：`demo/backend/src/config/index.js`

主要配置项：

```javascript
{
  // OSS配置
  oss: {
    region: 'oss-cn-hangzhou',
    accessKeyId: '',
    accessKeySecret: '',
    bucket: 'bucket-name',
    pathPrefix: 'docparse-demo/'
  },
  
  // 文档解析服务配置
  docParseService: {
    baseUrl: 'http://your-dataentry-service.com',
    port: 80,
    auth: {
      appId: 'your-applied-app-id',
      secretKey: 'your-applied-secret-key'
    }
  },
  
  // 支持的文件类型
  supportedFileTypes: {
    PPT: ['.ppt', '.pptx'],
    DOC: ['.doc', '.docx'],
    PDF: ['.pdf']
  },

  // 任务类型映射 (对应dataentry服务中的TASK_TYPE)
  taskTypes: {
    EXTERNAL_PPT: 4,
    EXTERNAL_DOC: 5,
    EXTERNAL_PPT_MICROSOFT: 7,
    EXTERNAL_PDF: 8
  }
}
```

**OSS服务完整配置格式：**

文档解析服务调用时需要传递完整的OSS配置，格式如下：

```json
{
  "ossConfig": {
    "accessKeyId": "",
    "accessKeySecret": "",
    "bucket": "bucket-name",
    "region": "oss-cn-hangzhou",
    "internal": false,
    "endpoint": "https://oss-cn-hangzhou.aliyuncs.com"
  }
}
```

**配置说明：**
- `accessKeyId` / `accessKeySecret`: 阿里云访问密钥，需在阿里云控制台创建
- `bucket`: OSS存储桶名称，需提前创建
- `region`: OSS地域，如 `oss-cn-hangzhou`
- `internal`: 是否使用内网访问，通常设为 `false`
- `endpoint`: OSS访问端点，格式为 `https://oss-{region}.aliyuncs.com`

### 前端配置

前端通过代理配置连接后端：

```json
{
  "proxy": "http://localhost:3001"
}
```

## 部署指南

### 开发环境部署

按照"快速开始"章节的步骤即可在开发环境中运行。

### 生产环境部署

#### 1. 构建前端

```bash
cd demo/frontend
npm run build
```

#### 2. 配置生产环境变量

编辑后端的 `.env` 文件，设置生产环境的配置。

#### 3. 启动后端服务

```bash
cd demo/backend
npm start
```

#### 4. 配置反向代理

使用Nginx等反向代理服务器：

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/demo/frontend/build;
        try_files $uri $uri/ /index.html;
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 故障排除

### 常见问题

#### 1. 文件上传失败

**可能原因：**
- OSS配置错误
- 网络连接问题
- 文件格式不支持
- 文件大小超限

**解决方法：**
- 检查OSS配置是否正确
- 确认网络连接正常
- 检查文件格式和大小

#### 2. 文档解析失败

**可能原因：**
- 文档解析服务未启动
- 服务地址配置错误
- AppId/SecretKey未申请或配置错误
- OSS配置不正确
- 文档格式问题

**解决方法：**
- 确认dataentry服务正常运行
- 检查服务地址和端口配置
- 联系服务提供方申请有效的AppId和SecretKey
- 验证OSS配置中的accessKeyId、accessKeySecret、bucket等信息
- 确保OSS bucket已创建且具有读写权限
- 尝试使用其他文档

#### 3. AppId申请相关问题

**申请流程：**
- 联系文档解析服务提供方
- 提供业务需求和预期使用量
- 获得专用的AppId和SecretKey
- 获得服务访问地址和技术支持联系方式

**常见问题：**
- AppId未激活：联系服务方激活账户
- 权限不足：确认AppId具有文档解析权限
- 配额限制：检查并发解析数量限制

#### 4. 回调未收到

**可能原因：**
- 回调URL配置错误
- 网络防火墙阻止
- 服务端口未开放

**解决方法：**
- 检查回调URL配置
- 确认端口3001可访问
- 检查防火墙设置

### 调试方法

#### 1. 查看后端日志

```bash
cd demo/backend
npm run dev
# 查看控制台输出
```

#### 2. 查看前端调试信息

- 打开浏览器开发者工具
- 查看Console和Network标签
- 检查API请求和响应

#### 3. 测试API接口

```bash
# 健康检查
curl http://localhost:3001/api/status/health

# 获取文件列表
curl http://localhost:3001/api/files/list
```
