const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const ossService = require('../services/ossService');
const docParseService = require('../services/docParseService');
const storageService = require('../services/storageService');
const config = require('../config');

// 配置multer用于文件上传
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB
    },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const supportedTypes = [
            ...config.supportedFileTypes.PPT,
            ...config.supportedFileTypes.DOC,
            ...config.supportedFileTypes.PDF
        ];

        if (supportedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error(`不支持的文件类型: ${ext}。支持的类型: ${supportedTypes.join(', ')}`));
        }
    }
});

/**
 * 文件上传接口
 * POST /api/files/upload
 */
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: '请选择要上传的文件'
            });
        }

        const { originalname, path: tempPath, size } = req.file;
        // 修正中文文件名在部分环境下被按 latin1 解码导致的乱码问题
        let originalName = originalname;
        try {
            originalName = Buffer.from(originalname, 'latin1').toString('utf8');
        } catch (e) {
            // 忽略转换错误，回退使用原始名称
        }
        console.log(`开始处理文件上传: ${originalName} (${size} bytes)`);

        // 1. 上传文件到OSS
        const ossResult = await ossService.uploadFile(tempPath, originalName);

        if (!ossResult.success) {
            throw new Error('文件上传到OSS失败');
        }

        // 2. 添加文件记录到内存存储
        const fileId = storageService.addFile(ossResult);

        // 3. 调用文档解析服务
        const fileExtension = path.extname(originalName);
        const callbackUrl = `${config.callback.baseUrl}${config.callback.path}`;

        try {
            const parseResult = await docParseService.parseDocument({
                sourcePath: `oss://${config.oss.bucket}/${ossResult.ossKey}`,
                fileName: originalname,
                fileExtension: fileExtension,
                callbackUrl: callbackUrl
            });

            if (parseResult.success) {
                // 更新文件任务信息
                storageService.updateFileTask(fileId, parseResult.taskId, 'parsing');

                res.json({
                    success: true,
                    message: '文件上传成功，正在解析中',
                    data: {
                        fileId: fileId,
                        taskId: parseResult.taskId,
                        fileName: originalName,
                        status: 'parsing'
                    }
                });
            } else {
                // 解析服务调用失败，更新状态
                storageService.updateFileStatus(fileId, 'failed', {
                    errorMessage: parseResult.message || '文档解析服务调用失败'
                });

                res.status(500).json({
                    success: false,
                    error: '文档解析服务调用失败',
                    data: {
                        fileId: fileId,
                        fileName: originalname,
                        status: 'failed'
                    }
                });
            }
        } catch (parseError) {
            console.error('文档解析服务调用失败:', parseError);

            // 更新文件状态为失败
            storageService.updateFileStatus(fileId, 'failed', {
                errorMessage: parseError.message
            });

            res.status(500).json({
                success: false,
                error: '文档解析服务调用失败',
                message: parseError.message,
                data: {
                    fileId: fileId,
                    fileName: originalname,
                    status: 'failed'
                }
            });
        }

    } catch (error) {
        console.error('文件上传处理失败:', error);

        // 清理临时文件
        if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            error: '文件上传失败',
            message: error.message
        });
    }
});

/**
 * 获取文件列表
 * GET /api/files/list
 */
router.get('/list', (req, res) => {
    try {
        const { status, limit = 20, offset = 0 } = req.query;

        const result = storageService.getFileList({
            status: status,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('获取文件列表失败:', error);
        res.status(500).json({
            success: false,
            error: '获取文件列表失败',
            message: error.message
        });
    }
});

/**
 * 获取统计信息
 * GET /api/files/stats
 */
router.get('/stats', (req, res) => {
    try {
        const stats = storageService.getStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('获取统计信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取统计信息失败',
            message: error.message
        });
    }
});

/**
 * 获取单个文件信息
 * GET /api/files/:fileId
 */
router.get('/:fileId', (req, res) => {
    try {
        console.log('获取单个文件信息');
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
            data: file
        });

    } catch (error) {
        console.error('获取文件信息失败:', error);
        res.status(500).json({
            success: false,
            error: '获取文件信息失败',
            message: error.message
        });
    }
});

/**
 * 删除文件
 * DELETE /api/files/:fileId
 */
router.delete('/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = storageService.getFile(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }

        // 删除OSS文件
        try {
            await ossService.deleteFile(file.ossKey);
        } catch (ossError) {
            console.warn('删除OSS文件失败:', ossError.message);
            // 继续执行，不阻断删除流程
        }

        // 删除内存记录
        storageService.deleteFile(fileId);

        res.json({
            success: true,
            message: '文件删除成功'
        });

    } catch (error) {
        console.error('删除文件失败:', error);
        res.status(500).json({
            success: false,
            error: '删除文件失败',
            message: error.message
        });
    }
});

/**
 * 获取解析后的文件签名url
 * GET /api/files/:fileId/parsed-url?suffix=<suffix>
 */
router.get('/:fileId/parsed-url', async (req, res) => {
    try {
        const { fileId } = req.params;
        const { suffix } = req.query;

        if (!suffix) {
            return res.status(400).json({
                success: false,
                error: '缺少suffix参数'
            });
        }

        const file = storageService.getFile(fileId);

        if (!file) {
            return res.status(404).json({
                success: false,
                error: '文件不存在'
            });
        }

        if (file.status !== 'completed') {
            return res.status(400).json({
                success: false,
                error: '文件尚未解析成功'
            });
        }

        const parsedBasePath = file.targetPath;

        if (!parsedBasePath) {
            return res.status(404).json({
                success: false,
                error: '解析结果中未找到targetPath信息'
            });
        }

        // 根据用户反馈，移除 targetPath 中的 oss://<bucket>/ 前缀
        let basePathKey = parsedBasePath;
        const prefix = `oss://${config.oss.bucket}/`;
        if (basePathKey.startsWith(prefix)) {
            basePathKey = basePathKey.substring(prefix.length);
        }

        // 确保路径正确拼接
        const separator = basePathKey.endsWith('/') ? '' : '/';
        const parsedOssKey = `${basePathKey}${separator}${suffix}`;

        // 获取签名URL
        const signedUrl = ossService.getSignedUrl(parsedOssKey);

        res.json({
            success: true,
            url: signedUrl
        });

    } catch (error) {
        console.error('获取解析后文件URL失败:', error);
        res.status(500).json({
            success: false,
            error: '获取解析后文件URL失败',
            message: error.message
        });
    }
});

module.exports = router;

