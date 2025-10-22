import React, { useState } from 'react';
import { Upload, Button, Progress, Alert, Typography, Space } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Dragger } = Upload;
const { Text } = Typography;

const FileUpload = ({ onSuccess, onError }) => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadResult, setUploadResult] = useState(null);

    // 支持的文件类型
    const supportedTypes = ['.ppt', '.pptx', '.doc', '.docx', '.pdf', '.xls', '.xlsx'];
    const maxSize = 100 * 1024 * 1024; // 100MB

    // 文件上传前的检查
    const beforeUpload = (file) => {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

        if (!supportedTypes.includes(fileExtension)) {
            const message = `不支持的文件类型: ${fileExtension}。支持的类型: ${supportedTypes.join(', ')}`;
            onError && onError({ message });
            return Upload.LIST_IGNORE;
        }

        if (file.size > maxSize) {
            const message = `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB`;
            onError && onError({ message });
            return Upload.LIST_IGNORE;
        }

        // 允许继续，交由 customRequest 处理实际上传
        return true;
    };

    // 自定义上传处理
    const customUpload = async ({ file }) => {
        if (uploading) {
            onError && onError({ message: '正在上传中，请稍候...' });
            return;
        }

        setUploading(true);
        setProgress(0);
        setUploadResult(null);

        try {
            console.log('开始上传文件:', file.name);

            const result = await apiService.uploadFile(file, (percent) => {
                setProgress(percent);
            });

            console.log('上传成功:', result);

            setUploadResult({
                type: 'success',
                message: `文件 "${file.name}" 上传成功，正在解析中...`,
                data: result.data
            });

            onSuccess && onSuccess(result.data);

        } catch (error) {
            console.error('上传失败:', error);

            setUploadResult({
                type: 'error',
                message: `文件上传失败: ${error.message}`,
                error: error
            });

            onError && onError(error);
        } finally {
            setUploading(false);
            setProgress(0);
        }
    };

    // 重置状态
    const resetUpload = () => {
        setUploadResult(null);
        setProgress(0);
    };

    return (
        <div className="file-upload">
            <Dragger
                name="file"
                multiple={false}
                beforeUpload={beforeUpload}
                customRequest={customUpload}
                disabled={uploading}
                showUploadList={false}
                className="upload-dragger"
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">
                    {uploading ? '正在上传...' : '点击或拖拽文件到此区域上传'}
                </p>
                <p className="ant-upload-hint">
                    支持文件类型: {supportedTypes.join(', ')}
                    <br />
                    最大文件大小: {Math.round(maxSize / 1024 / 1024)}MB
                </p>
            </Dragger>

            {/* 上传进度 */}
            {uploading && (
                <div style={{ marginTop: 16 }}>
                    <Progress
                        percent={progress}
                        status="active"
                        strokeColor={{
                            '0%': '#108ee9',
                            '100%': '#87d068',
                        }}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        正在上传文件并调用解析服务...
                    </Text>
                </div>
            )}

            {/* 上传结果 */}
            {uploadResult && uploadResult.type === 'error' && (
                <div style={{ marginTop: 16 }}>
                    <Alert
                        type="error"
                        message={uploadResult.message}
                        showIcon
                        closable
                        onClose={resetUpload}
                    />
                </div>
            )}

            {/* 成功提示采用更轻量的描述 */}
            {uploadResult && uploadResult.type === 'success' && (
                <div style={{ marginTop: 12 }}>
                    <Text type="success">
                        ✅ {uploadResult.message}
                    </Text>
                    {uploadResult.data?.taskId && (
                        <span style={{ marginLeft: 8 }}>
                            <Text strong>任务ID:</Text>
                            <Text code style={{ marginLeft: 4 }}>{uploadResult.data.taskId}</Text>
                        </span>
                    )}
                </div>
            )}

            {/* 手动上传按钮 (备选方案) */}
            <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Upload
                    beforeUpload={beforeUpload}
                    customRequest={customUpload}
                    disabled={uploading}
                    showUploadList={false}
                >
                    <Button
                        icon={<UploadOutlined />}
                        loading={uploading}
                        disabled={uploading}
                    >
                        {uploading ? '上传中...' : '选择文件上传'}
                    </Button>
                </Upload>
            </div>
        </div>
    );
};

export default FileUpload;
