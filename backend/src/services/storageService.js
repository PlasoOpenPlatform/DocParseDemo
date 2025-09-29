const { v4: uuidv4 } = require('uuid');
const config = require('../config');

/**
 * 内存存储服务
 * 用于存储文件列表和解析状态信息
 */
class StorageService {
    constructor() {
        // 文件信息存储
        this.files = new Map();
        // 任务状态存储
        this.tasks = new Map();
    }

    /**
     * 添加文件记录
     * @param {Object} fileInfo 文件信息
     * @returns {string} 文件ID
     */
    addFile(fileInfo) {
        const fileId = uuidv4();
        const file = {
            id: fileId,
            originalName: fileInfo.originalName,
            fileName: fileInfo.fileName,
            ossKey: fileInfo.ossKey,
            url: fileInfo.url,
            size: fileInfo.size,
            uploadTime: new Date().toISOString(),
            status: 'uploaded', // uploaded, parsing, completed, failed
            taskId: null,
            targetPath: null,
            convertPages: null,
            errorMessage: null
        };

        this.files.set(fileId, file);
        console.log(`文件记录已添加: ${fileId} - ${fileInfo.originalName}`);
        return fileId;
    }

    /**
     * 更新文件解析任务信息
     * @param {string} fileId 文件ID
     * @param {string} taskId 任务ID
     * @param {string} status 状态
     */
    updateFileTask(fileId, taskId, status = 'parsing') {
        const file = this.files.get(fileId);
        if (file) {
            file.taskId = taskId;
            file.status = status;
            file.updateTime = new Date().toISOString();

            // 同时在任务存储中记录
            this.tasks.set(taskId, {
                taskId: taskId,
                fileId: fileId,
                status: status,
                createTime: new Date().toISOString(),
                updateTime: new Date().toISOString()
            });

            console.log(`文件任务信息已更新: ${fileId} -> ${taskId} (${status})`);
        }
    }

    /**
     * 更新文件状态
     * @param {string} fileId 文件ID
     * @param {string} status 状态
     * @param {Object} additionalData 额外数据
     */
    updateFileStatus(fileId, status, additionalData = {}) {
        const file = this.files.get(fileId);
        if (file) {
            file.status = status;
            file.updateTime = new Date().toISOString();

            // 更新额外数据
            Object.assign(file, additionalData);

            // 同时更新任务状态
            if (file.taskId) {
                const task = this.tasks.get(file.taskId);
                if (task) {
                    task.status = status;
                    task.updateTime = new Date().toISOString();
                }
            }

            console.log(`文件状态已更新: ${fileId} -> ${status}`);
        }
    }

    /**
     * 通过任务ID更新状态
     * @param {string} taskId 任务ID
     * @param {string} status 状态
     * @param {Object} result 解析结果
     */
    updateTaskStatus(taskId, status, result = null) {
        const task = this.tasks.get(taskId);
        if (task) {
            task.status = status;
            task.updateTime = new Date().toISOString();

            // 更新对应的文件状态
            const file = this.files.get(task.fileId);
            if (file) {
                file.status = status;
                file.updateTime = new Date().toISOString();

                if (status === 'completed' && result) {
                    file.targetPath = result.targetPath;
                    file.convertPages = result.convertPages;
                } else if (status === 'failed' && result) {
                    file.errorMessage = result.error || '解析失败';
                }
            }

            console.log(`任务状态已更新: ${taskId} -> ${status}`);
        }
    }

    /**
     * 获取文件信息
     * @param {string} fileId 文件ID
     * @returns {Object|null} 文件信息
     */
    getFile(fileId) {
        return this.files.get(fileId) || null;
    }

    /**
     * 获取任务信息
     * @param {string} taskId 任务ID
     * @returns {Object|null} 任务信息
     */
    getTask(taskId) {
        return this.tasks.get(taskId) || null;
    }

    /**
     * 获取所有文件列表
     * @param {Object} options 查询选项
     * @returns {Array} 文件列表
     */
    getFileList(options = {}) {
        const { status, limit = 100, offset = 0 } = options;

        let files = Array.from(this.files.values());

        // 状态过滤
        if (status) {
            files = files.filter(file => file.status === status);
        }

        // 按上传时间倒序排序
        files.sort((a, b) => new Date(b.uploadTime) - new Date(a.uploadTime));

        // 分页
        const total = files.length;
        const paginatedFiles = files.slice(offset, offset + limit);

        return {
            files: paginatedFiles,
            total: total,
            limit: limit,
            offset: offset
        };
    }

    /**
     * 删除文件记录
     * @param {string} fileId 文件ID
     * @returns {boolean} 删除结果
     */
    deleteFile(fileId) {
        const file = this.files.get(fileId);
        if (file) {
            // 删除关联的任务记录
            if (file.taskId) {
                this.tasks.delete(file.taskId);
            }

            this.files.delete(fileId);
            console.log(`文件记录已删除: ${fileId}`);
            return true;
        }
        return false;
    }

    /**
     * 获取统计信息
     * @returns {Object} 统计数据
     */
    getStats() {
        const files = Array.from(this.files.values());
        const stats = {
            total: files.length,
            uploaded: 0,
            parsing: 0,
            completed: 0,
            failed: 0
        };

        files.forEach(file => {
            if (stats[file.status] !== undefined) {
                stats[file.status]++;
            }
        });

        return stats;
    }

    /**
     * 清理过期数据 (可选实现)
     * @param {number} maxAge 最大保留时间(毫秒)
     */
    cleanup(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
        const now = Date.now();
        const expiredFiles = [];

        this.files.forEach((file, fileId) => {
            const uploadTime = new Date(file.uploadTime).getTime();
            if (now - uploadTime > maxAge) {
                expiredFiles.push(fileId);
            }
        });

        expiredFiles.forEach(fileId => {
            this.deleteFile(fileId);
        });

        if (expiredFiles.length > 0) {
            console.log(`已清理 ${expiredFiles.length} 个过期文件记录`);
        }
    }
}

module.exports = new StorageService();

