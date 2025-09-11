const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class DocParseService {
    constructor() {
        this.baseUrl = `${config.docParseService.baseUrl}`;
        this.appId = config.docParseService.auth.appId;
        this.secretKey = config.docParseService.auth.secretKey;
    }

    /**
     * 生成签名
     * @param {Object} params 请求参数
     * @returns {string} 签名字符串
     */
    generateSignature(params, signKey) {
        var keys = Object.keys(params).sort();
        var res = [];
        for (var key of keys) {
            if (key === "signature" || params[key] == undefined) {
                continue;
            }
            if (key === "__plasoRequestId__") {
                continue;
            }
            res.push(`${key}=${params[key]}`);
        }
        var content = res.join("&");
        var signature = crypto.createHmac("sha1", signKey).update(content).digest("hex").toUpperCase();
        return signature;
    }

    /**
     * 获取文件类型对应的任务类型
     * @param {string} fileExtension 文件扩展名
     * @returns {string} 任务类型
     */
    getTaskType(fileExtension) {
        const ext = fileExtension.toLowerCase();

        if (config.supportedFileTypes.PPT.includes(ext)) {
            return config.taskTypes.EXTERNAL_PPT;
        } else if (config.supportedFileTypes.DOC.includes(ext)) {
            return config.taskTypes.EXTERNAL_DOC;
        } else if (config.supportedFileTypes.PDF.includes(ext)) {
            return config.taskTypes.EXTERNAL_PDF;
        } else if (ext === '.pptx') {
            // Microsoft格式的PPT
            return config.taskTypes.EXTERNAL_PPT_MICROSOFT;
        }

        throw new Error(`不支持的文件类型: ${ext}`);
    }

    /**
     * 调用文档解析服务
     * @param {Object} options 解析选项
     * @param {string} options.sourcePath 源文件OSS路径
     * @param {string} options.fileName 文件名
     * @param {string} options.fileExtension 文件扩展名
     * @param {string} options.callbackUrl 回调URL
     * @returns {Promise<Object>} 解析任务结果
     */
    async parseDocument(options) {
        try {
            const { sourcePath, fileName, fileExtension, callbackUrl } = options;

            // 获取任务类型
            const taskType = this.getTaskType(fileExtension);

            // 构建请求参数 (根据API文档)
            const params = {
                validBegin: ~~(Date.now() / 1000),
                validTime: 300,
                appId: this.appId,
                sourcePath: sourcePath,
                taskType: taskType,
                callbackUrl: callbackUrl
            };
            params.signature = this.generateSignature(params, this.secretKey);

            console.log('调用文档解析服务，参数:', {
                ...params,
            });

            // 发送请求
            const response = await axios.post(
                `${this.baseUrl}/document/parser`,
                params,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30秒超时
                }
            );

            console.log('文档解析服务响应:', response.data);

            if (response.data && response.data.code === 0) {
                return {
                    success: true,
                    taskId: response.data.obj.taskId,
                    message: '文档解析任务创建成功'
                };
            } else {
                throw new Error(response.data.msg || response.data.message || '文档解析服务返回错误');
            }

        } catch (error) {
            console.error('调用文档解析服务失败:', error);

            if (error.response) {
                // 服务器响应了错误状态码
                const errorMsg = error.response.data?.msg || error.response.data?.message || error.response.statusText;
                throw new Error(`文档解析服务错误(${error.response.status}): ${errorMsg}`);
            } else if (error.request) {
                // 请求发送了但没有收到响应
                throw new Error('文档解析服务无响应，请检查服务是否正常运行');
            } else {
                // 其他错误
                throw new Error(`文档解析请求失败: ${error.message}`);
            }
        }
    }

    /**
     * 查询任务状态
     * @param {string} taskId 任务ID
     * @returns {Promise<Object>} 任务状态信息
     */
    async getTaskStatus(taskId) {
        try {
            const now = Date.now();
            const params = {
                appId: this.appId,
                taskId: taskId,
                beginTime: now,
                validTime: 300000
            };

            params.signature = this.generateSignature(params, this.secretKey);

            const response = await axios.get(
                `${this.baseUrl}/document/status`,
                {
                    params: params,
                    timeout: 10000
                }
            );

            if (response.data && response.data.code === 0) {
                return {
                    success: true,
                    data: response.data.data
                };
            } else {
                throw new Error(response.data.message || '查询任务状态失败');
            }

        } catch (error) {
            console.error('查询任务状态失败:', error);
            throw new Error(`查询任务状态失败: ${error.message}`);
        }
    }
}

module.exports = new DocParseService();

