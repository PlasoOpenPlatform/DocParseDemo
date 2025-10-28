// 配置文件
const config = {
    // OSS配置 - 需要根据实际情况修改
    oss: {
        region: process.env.OSS_REGION || 'oss-cn-hangzhou',
        accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'your-access-key-id',
        accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'your-access-key-secret',
        bucket: process.env.OSS_BUCKET || 'your-bucket-name',
        stsEndpoint: process.env.OSS_STS_ENDPOINT || 'https://sts-vpc.cn-hangzhou.aliyuncs.com',
        roleArn: process.env.OSS_ROLE_ARN || '',
        // OSS文件存储路径前缀
        pathPrefix: 'dev-plaso/temp/docparse-demo/'
    },

    // 文档解析服务配置
    docParseService: {
        baseUrl: process.env.DOC_PARSE_BASE_URL || 'http://localhost',
        port: process.env.DOC_PARSE_PORT || 80,
        // 认证配置
        auth: {
            appId: process.env.APP_ID || 'demo-app-id',
            secretKey: process.env.SECRET_KEY || 'demo-secret-key'
        }
    },

    // 支持的文件类型
    supportedFileTypes: {
        // PPT文档类型
        PPT: ['.ppt', '.pptx'],
        // DOC文档类型  
        DOC: ['.doc', '.docx'],
        // PDF文档类型
        PDF: ['.pdf'],
        EXCEL: ['.xls', '.xlsx']
    },

    // 任务类型映射 (对应dataentry服务中的TASK_TYPE)
    taskTypes: {
        EXTERNAL_PPT: 4,
        EXTERNAL_DOC: 5,
        EXTERNAL_PPT_MICROSOFT: 7,
        EXTERNAL_PDF: 8, // 新增PDF支持
    },

    // 任务状态映射 (对应dataentry服务中的TASK_STATUS)
    taskStatus: {
        WAIT: 'WAIT',           // 等待处理
        PROCESSING: 'PROCESSING', // 处理中
        SUCCESS: 'SUCCESS',     // 成功
        FAILED: 'FAILED'        // 失败
    },

    // 回调配置
    callback: {
        baseUrl: process.env.CALLBACK_BASE_URL || 'http://localhost:3001',
        path: '/api/callback/document'
    }
};

module.exports = config;

