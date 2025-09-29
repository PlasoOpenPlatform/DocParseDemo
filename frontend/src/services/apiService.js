import axios from 'axios';

// 创建axios实例
const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器
api.interceptors.request.use(
    config => {
        console.log('API请求:', config.method?.toUpperCase(), config.url, config.data || config.params);
        return config;
    },
    error => {
        console.error('请求拦截器错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
api.interceptors.response.use(
    response => {
        console.log('API响应:', response.status, response.config.url, response.data);
        return response.data;
    },
    error => {
        console.error('API错误:', error.response?.status, error.response?.data || error.message);

        // 统一错误处理
        const errorMessage = error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            '请求失败';

        return Promise.reject({
            status: error.response?.status,
            message: errorMessage,
            data: error.response?.data
        });
    }
);

const apiService = {
    // 文件上传
    uploadFile: async (file, onProgress) => {
        const formData = new FormData();
        formData.append('file', file);

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };

        if (onProgress) {
            config.onUploadProgress = (progressEvent) => {
                const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                onProgress(percent);
            };
        }

        return api.post('/files/upload', formData, config);
    },

    // 获取文件列表
    getFileList: async (params = {}) => {
        return api.get('/files/list', { params });
    },

    // 获取单个文件信息
    getFileInfo: async (fileId) => {
        return api.get(`/files/${fileId}`);
    },

    // 删除文件
    deleteFile: async (fileId) => {
        return api.delete(`/files/${fileId}`);
    },

    // 获取统计信息
    getStats: async () => {
        return api.get('/files/stats');
    },

    // 获取任务状态
    getTaskStatus: async (taskId, sync = false) => {
        return api.get(`/status/task/${taskId}`, {
            params: { sync: sync.toString() }
        });
    },

    // 获取文件状态
    getFileStatus: async (fileId) => {
        return api.get(`/status/file/${fileId}`);
    },

    // 批量获取状态
    getBatchStatus: async (fileIds = [], taskIds = []) => {
        return api.post('/status/batch', { fileIds, taskIds });
    },

    // 获取系统状态
    getSystemStatus: async () => {
        return api.get('/status/stats');
    },

    // 健康检查
    healthCheck: async () => {
        return api.get('/status/health');
    },

    // 手动更新任务状态 (测试用)
    updateTaskStatus: async (taskId, status, result = null, error = null) => {
        return api.post(`/callback/manual/${taskId}`, {
            status,
            result,
            error
        });
    },

    // 获取解析后的文件URL
    getParsedUrl: async (fileId, suffix) => {
        return api.get(`/files/${fileId}/parsed-url`, {
            params: { suffix }
        });
    }
};

export default apiService;

