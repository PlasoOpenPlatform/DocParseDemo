const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');
const docParseService = require('../services/docParseService');

/**
 * 获取任务状态
 * GET /api/status/task/:taskId
 */
router.get('/task/:taskId', async (req, res) => {
    try {
        const { taskId } = req.params;

        // 从内存存储获取任务信息
        const localTask = storageService.getTask(taskId);
        if (!localTask) {
            return res.status(404).json({
                success: false,
                error: '任务不存在'
            });
        }

        // 可选：从文档解析服务查询最新状态
        const { sync = false } = req.query;
        if (sync === 'true') {
            try {
                const remoteStatus = await docParseService.getTaskStatus(taskId);
                if (remoteStatus.success) {
                    // 同步远程状态到本地
                    const remoteTaskStatus = remoteStatus.data.status;
                    if (remoteTaskStatus !== localTask.status) {
                        console.log(`同步任务状态: ${taskId} ${localTask.status} -> ${remoteTaskStatus}`);
                        storageService.updateTaskStatus(taskId, remoteTaskStatus, remoteStatus.data);
                    }
                }
            } catch (syncError) {
                console.warn('同步远程状态失败:', syncError.message);
                // 继续使用本地状态，不影响响应
            }
        }

        // 获取更新后的任务信息
        const updatedTask = storageService.getTask(taskId);
        const file = storageService.getFile(updatedTask.fileId);

        res.json({
            success: true,
            data: {
                taskId: taskId,
                status: updatedTask.status,
                createTime: updatedTask.createTime,
                updateTime: updatedTask.updateTime,
                file: file ? {
                    id: file.id,
                    originalName: file.originalName,
                    fileName: file.fileName,
                    size: file.size,
                    uploadTime: file.uploadTime
                } : null
            }
        });

    } catch (error) {
        console.error('获取任务状态失败:', error);
        res.status(500).json({
            success: false,
            error: '获取任务状态失败',
            message: error.message
        });
    }
});

/**
 * 获取文件状态
 * GET /api/status/file/:fileId
 */
router.get('/file/:fileId', (req, res) => {
    try {
        const { fileId } = req.params;
        const file = storageService.getFile(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }

        res.json({
            success: true,
            data: {
                fileId: fileId,
                status: file.status,
                originalName: file.originalName,
                fileName: file.fileName,
                size: file.size,
                uploadTime: file.uploadTime,
                updateTime: file.updateTime,
                taskId: file.taskId,
                parseResult: file.parseResult,
                errorMessage: file.errorMessage
            }
        });

    } catch (error) {
        console.error('获取文件状态失败:', error);
        res.status(500).json({
            success: false,
            error: '获取文件状态失败',
            message: error.message
        });
    }
});

/**
 * 批量获取状态
 * POST /api/status/batch
 * Body: { fileIds: [string], taskIds: [string] }
 */
router.post('/batch', (req, res) => {
    try {
        const { fileIds = [], taskIds = [] } = req.body;
        const result = {
            files: {},
            tasks: {}
        };

        // 获取文件状态
        fileIds.forEach(fileId => {
            const file = storageService.getFile(fileId);
            if (file) {
                result.files[fileId] = {
                    status: file.status,
                    updateTime: file.updateTime,
                    taskId: file.taskId,
                    errorMessage: file.errorMessage
                };
            }
        });

        // 获取任务状态
        taskIds.forEach(taskId => {
            const task = storageService.getTask(taskId);
            if (task) {
                result.tasks[taskId] = {
                    status: task.status,
                    updateTime: task.updateTime,
                    fileId: task.fileId
                };
            }
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('批量获取状态失败:', error);
        res.status(500).json({
            success: false,
            error: '批量获取状态失败',
            message: error.message
        });
    }
});

/**
 * 获取系统状态统计
 * GET /api/status/stats
 */
router.get('/stats', (req, res) => {
    try {
        const stats = storageService.getStats();

        // 添加系统运行时间
        const uptime = process.uptime();
        const uptimeFormatted = {
            days: Math.floor(uptime / 86400),
            hours: Math.floor((uptime % 86400) / 3600),
            minutes: Math.floor((uptime % 3600) / 60),
            seconds: Math.floor(uptime % 60)
        };

        res.json({
            success: true,
            data: {
                fileStats: stats,
                system: {
                    uptime: uptime,
                    uptimeFormatted: uptimeFormatted,
                    memory: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('获取系统状态失败:', error);
        res.status(500).json({
            success: false,
            error: '获取系统状态失败',
            message: error.message
        });
    }
});

/**
 * 健康检查
 * GET /api/status/health
 */
router.get('/health', (req, res) => {
    try {
        const stats = storageService.getStats();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            services: {
                storage: 'ok',
                oss: 'ok', // 可以添加实际的OSS连接检查
                docParse: 'ok' // 可以添加实际的文档解析服务检查
            },
            stats: stats
        };

        res.json(health);

    } catch (error) {
        console.error('健康检查失败:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;

