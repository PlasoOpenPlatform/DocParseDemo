const OSS = require('ali-oss');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

class OSSService {
    constructor() {
        this.client = new OSS({
            region: config.oss.region,
            accessKeyId: config.oss.accessKeyId,
            accessKeySecret: config.oss.accessKeySecret,
            bucket: config.oss.bucket
        });
    }

    /**
     * 上传文件到OSS
     * @param {string} localFilePath 本地文件路径
     * @param {string} originalName 原始文件名
     * @returns {Promise<Object>} 上传结果
     */
    async uploadFile(localFilePath, originalName) {
        try {
            // 生成唯一的文件名
            const fileExt = path.extname(originalName);
            const fileName = `${uuidv4()}${fileExt}`;
            const ossKey = config.oss.pathPrefix + fileName;

            console.log(`开始上传文件到OSS: ${ossKey} ${config.oss.accessKeyId}`);

            // 上传文件
            const result = await this.client.put(ossKey, localFilePath);

            console.log(`文件上传成功: ${result.url}`);

            // 删除本地临时文件
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
                console.log(`已删除临时文件: ${localFilePath}`);
            }

            return {
                success: true,
                ossKey: ossKey,
                url: result.url,
                fileName: fileName,
                // 确保 originalName 以 utf8 保持
                originalName: Buffer.isBuffer(originalName) ? originalName.toString('utf8') : originalName,
                size: result.res.size
            };

        } catch (error) {
            console.error('OSS上传失败:', error);

            // 清理本地临时文件
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }

            throw new Error(`文件上传失败: ${error.message}`);
        }
    }

    /**
     * 删除OSS文件
     * @param {string} ossKey OSS文件键
     * @returns {Promise<boolean>} 删除结果
     */
    async deleteFile(ossKey) {
        try {
            await this.client.delete(ossKey);
            console.log(`文件删除成功: ${ossKey}`);
            return true;
        } catch (error) {
            console.error('OSS删除失败:', error);
            throw new Error(`文件删除失败: ${error.message}`);
        }
    }

    /**
     * 获取文件访问URL
     * @param {string} ossKey OSS文件键
     * @param {number} expires 过期时间(秒)，默认1小时
     * @returns {string} 签名URL
     */
    getSignedUrl(ossKey, expires = 3600) {
        try {
            return this.client.signatureUrl(ossKey, { expires });
        } catch (error) {
            console.error('生成签名URL失败:', error);
            throw new Error(`生成访问链接失败: ${error.message}`);
        }
    }

    /**
     * 检查文件是否存在
     * @param {string} ossKey OSS文件键
     * @returns {Promise<boolean>} 文件是否存在
     */
    async fileExists(ossKey) {
        try {
            await this.client.head(ossKey);
            return true;
        } catch (error) {
            if (error.code === 'NoSuchKey') {
                return false;
            }
            throw error;
        }
    }
}

module.exports = new OSSService();

