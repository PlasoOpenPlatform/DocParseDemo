const express = require('express');
const router = express.Router();
const signatureService = require('../services/signatureService');

/**
 * 生成会议签名
 * POST /api/signature/generate
 */
router.post('/generate', (req, res) => {
    try {
        const clientParams = req.body;

        if (!clientParams.meetingId || !clientParams.other) {
            return res.status(400).json({
                success: false,
                error: '缺少 meetingId 或 other 参数'
            });
        }

        clientParams.other = clientParams.other || {};
        clientParams.other.meetingId = clientParams.meetingId;
        clientParams.other.mediaType = clientParams.other.mediaType || 'video';
        clientParams.other.loginName = clientParams.other.loginName || `user_${Math.random().toString(36).substring(2, 10)}`;
        clientParams.other.userName = clientParams.other.userName || `user_${Math.random().toString(36).substring(2, 10)}`;
        clientParams.other.meetingType = clientParams.other.meetingType || 'public';
        clientParams.other.d_dimension = clientParams.other.d_dimension || '1280x720';

        const result = signatureService.generateMeetingSignature(clientParams);

        // 将 other 对象中的参数扁平化到 result 中
        const flattenedResult = { ...result };

        // 构建查询字符串
        const queryString = Object.keys(flattenedResult)
            .filter(key => flattenedResult[key] !== undefined)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(flattenedResult[key])}`)
            .join('&');

        res.json({
            success: true,
            query: queryString
        });

    } catch (error) {
        console.error('生成会议签名失败:', error);
        res.status(500).json({
            success: false,
            error: '生成会议签名失败',
            message: error.message
        });
    }
});

/**
 * 生成播放链接前面
 * POST /api/signature/play
 */
router.post('/play', (req, res) => {
    try {
        const clientParams = req.body;

        if (!clientParams.recordId || !clientParams.appId) {
            return res.status(400).json({
                success: false,
                error: '缺少 recordId 或 appId 参数'
            });
        }

        clientParams.other = clientParams.other || {};
        clientParams.other.appId = clientParams.appId;
        clientParams.other.recordId = clientParams.recordId;

        const result = signatureService.generateMeetingSignature(clientParams);

        // 将 other 对象中的参数扁平化到 result 中
        const flattenedResult = { ...result };

        // 构建查询字符串
        const queryString = Object.keys(flattenedResult)
            .filter(key => flattenedResult[key] !== undefined)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(flattenedResult[key])}`)
            .join('&');

        res.json({
            success: true,
            query: queryString
        });

    } catch (error) {
        console.error('生成会议签名失败:', error);
        res.status(500).json({
            success: false,
            error: '生成会议签名失败',
            message: error.message
        });
    }
});

module.exports = router;
