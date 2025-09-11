// 加载环境变量
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

// 导入路由
const fileRoutes = require('./routes/fileRoutes');
const callbackRoutes = require('./routes/callbackRoutes');
const statusRoutes = require('./routes/statusRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 创建uploads目录用于临时存储
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// 路由配置
app.use('/api/files', fileRoutes);
app.use('/api/callback', callbackRoutes);
app.use('/api/status', statusRoutes);

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'docparse-demo-backend'
    });
});

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal Server Error',
        message: error.message
    });
});

// 404处理
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} not found`
    });
});

app.listen(PORT, () => {
    console.log(`文档解析Demo后端服务运行在端口 ${PORT}`);
    console.log(`健康检查地址: http://localhost:${PORT}/health`);
});

module.exports = app;

