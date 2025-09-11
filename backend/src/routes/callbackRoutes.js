const express = require('express');
const router = express.Router();
const storageService = require('../services/storageService');

/**
 * 文档解析回调接口
 * POST /api/callback/document
 * 
 * 这个接口会被dataentry服务调用，通知解析结果
 */
router.post('/document', (req, res) => {
    try {
        console.log('收到文档解析回调:', req.body);

        const body = req.body || {};
        const taskId = body.taskId || body.id || body.task_id || body.taskID;
        const rawStatus = body.status !== undefined ? body.status : (body.taskStatus !== undefined ? body.taskStatus : body.state);
        const result = body.result || body.data || null;
        const error = body.error || body.msg || body.message || null;

        if (!taskId) {
            return res.status(400).json({
                success: false,
                error: '缺少taskId参数'
            });
        }

        const task = storageService.getTask(taskId);
        if (!task) {
            console.warn(`收到未知任务的回调: ${taskId}`);
            return res.status(404).json({
                success: false,
                error: '任务不存在'
            });
        }

        // 归一化状态（dataentry: WAIT=0, PENDING=1, RUNNING=2, JOBSUCC=3, JOBFAILED=4, DONE=100, FAILED=101, REPEAT=1011）
        const toLocalStatus = (s) => {
            if (s === null || s === undefined) return 'parsing';

            // 数值或可转为数值
            const n = Number(s);
            if (!Number.isNaN(n)) {
                switch (n) {
                    case 0: // WAIT
                    case 1: // PENDING
                    case 2: // RUNNING
                        return 'parsing';
                    case 3: // JOBSUCC
                    case 100: // DONE
                        return 'completed';
                    case 4: // JOBFAILED
                    case 101: // FAILED
                        return 'failed';
                    case 1011: // REPEAT（重复任务），按完成处理
                        return 'completed';
                    default:
                        return 'parsing';
                }
            }

            // 字符串状态
            const up = String(s).toUpperCase();
            if (['JOBSUCC', 'SUCCESS', 'COMPLETED', 'DONE', 'FINISHED', 'REPEAT'].includes(up)) return 'completed';
            if (['JOBFAILED', 'FAILED', 'ERROR'].includes(up)) return 'failed';
            if (['PROCESSING', 'RUNNING', 'WAIT', 'WAITING', 'PARSING', 'PENDING'].includes(up)) return 'parsing';
            return 'parsing';
        };

        const localStatus = toLocalStatus(rawStatus);

        switch (localStatus) {
            case 'completed':
                storageService.updateTaskStatus(taskId, 'completed', result || { rawCallback: body });
                break;
            case 'failed':
                storageService.updateTaskStatus(taskId, 'failed', { error: error || '文档解析失败', rawCallback: body });
                break;
            default:
                storageService.updateTaskStatus(taskId, 'parsing');
        }

        return res.json({ success: true, message: '回调处理成功', taskId });
    } catch (error) {
        console.error('处理文档解析回调失败:', error);
        res.status(500).json({
            success: false,
            error: '回调处理失败',
            message: error.message
        });
    }
});

/**
 * 通用回调接口 (用于测试)
 * POST /api/callback/test
 */
router.post('/test', (req, res) => {
    console.log('收到测试回调:', {
        headers: req.headers,
        body: req.body,
        query: req.query
    });

    res.json({
        success: true,
        message: '测试回调接收成功',
        timestamp: new Date().toISOString(),
        data: req.body
    });
});

/**
 * 手动触发状态更新 (用于测试)
 * POST /api/callback/manual/:taskId
 */
router.post('/manual/:taskId', (req, res) => {
    try {
        const { taskId } = req.params;
        const { status, result, error } = req.body;

        console.log(`手动更新任务状态: ${taskId} -> ${status}`);

        const task = storageService.getTask(taskId);
        if (!task) {
            return res.status(404).json({
                success: false,
                error: '任务不存在'
            });
        }

        // 更新状态
        storageService.updateTaskStatus(taskId, status, {
            parseResult: result,
            error: error,
            manualUpdate: true,
            updateTime: new Date().toISOString()
        });

        res.json({
            success: true,
            message: '状态更新成功',
            taskId: taskId,
            newStatus: status
        });

    } catch (error) {
        console.error('手动更新状态失败:', error);
        res.status(500).json({
            success: false,
            error: '状态更新失败',
            message: error.message
        });
    }
});

module.exports = router;

