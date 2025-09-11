import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, Space, Tooltip, Modal, Typography, Progress, message, Popconfirm, Badge } from 'antd';
import { ReloadOutlined, DeleteOutlined, EyeOutlined, InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import apiService from '../services/apiService';

const { Text, Paragraph } = Typography;

const FileList = ({ refreshTrigger, onRefresh }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);

    // 状态颜色映射
    const statusColors = {
        uploaded: 'blue',
        parsing: 'orange',
        completed: 'green',
        failed: 'red'
    };

    // 状态文本映射
    const statusTexts = {
        uploaded: '已上传',
        parsing: '解析中',
        completed: '已完成',
        failed: '失败'
    };

    // 获取文件列表
    const fetchFileList = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const response = await apiService.getFileList({
                limit: pageSize,
                offset: (page - 1) * pageSize
            });

            if (response.success) {
                setFiles(response.data.files);
                setPagination(prev => ({
                    ...prev,
                    current: page,
                    pageSize: pageSize,
                    total: response.data.total
                }));
            }
        } catch (error) {
            console.error('获取文件列表失败:', error);
            message.error(`获取文件列表失败: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // 删除文件
    const handleDeleteFile = async (fileId) => {
        try {
            const response = await apiService.deleteFile(fileId);
            if (response.success) {
                message.success('文件删除成功');
                fetchFileList(pagination.current, pagination.pageSize);
                onRefresh && onRefresh();
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            message.error(`删除文件失败: ${error.message}`);
        }
    };

    // 查看文件详情
    const handleViewDetail = async (file) => {
        try {
            const response = await apiService.getFileInfo(file.id);
            if (response.success) {
                setSelectedFile(response.data);
                setDetailModalVisible(true);
            }
        } catch (error) {
            console.error('获取文件详情失败:', error);
            message.error(`获取文件详情失败: ${error.message}`);
        }
    };

    // 刷新列表
    const handleRefresh = () => {
        fetchFileList(pagination.current, pagination.pageSize);
        onRefresh && onRefresh();
    };

    // 表格列定义
    const columns = [
        {
            title: '文件名',
            dataIndex: 'originalName',
            key: 'originalName',
            ellipsis: true,
            render: (text, record) => (
                <Tooltip title={text}>
                    <Text strong>{text}</Text>
                </Tooltip>
            )
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => {
                if (status === 'parsing') {
                    return (
                        <Badge status="processing" text={<span style={{ color: '#fa8c16' }}>{statusTexts[status]}</span>} />
                    );
                }
                if (status === 'uploaded') {
                    return (
                        <Badge color="#1890ff" text={<span style={{ color: '#1890ff' }}>{statusTexts[status]}</span>} />
                    );
                }
                return (
                    <Tag color={statusColors[status]}>
                        {statusTexts[status] || status}
                    </Tag>
                );
            }
        },
        {
            title: '文件大小',
            dataIndex: 'size',
            key: 'size',
            width: 100,
            render: (size) => {
                if (!size) return '-';
                if (size < 1024) return `${size} B`;
                if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
                return `${(size / 1024 / 1024).toFixed(1)} MB`;
            }
        },
        {
            title: '上传时间',
            dataIndex: 'uploadTime',
            key: 'uploadTime',
            width: 150,
            render: (time) => moment(time).format('MM-DD HH:mm:ss')
        },
        {
            title: '任务ID',
            dataIndex: 'taskId',
            key: 'taskId',
            width: 120,
            ellipsis: true,
            render: (taskId) => taskId ? (
                <Tooltip title={taskId}>
                    <Text code style={{ fontSize: '11px' }}>
                        {taskId.substring(0, 8)}...
                    </Text>
                </Tooltip>
            ) : '-'
        },
        {
            title: '操作',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="查看详情">
                        <Button
                            type="text"
                            icon={<EyeOutlined />}
                            size="small"
                            onClick={() => handleViewDetail(record)}
                        />
                    </Tooltip>
                    <Popconfirm
                        title="确定要删除这个文件吗？"
                        onConfirm={() => handleDeleteFile(record.id)}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Tooltip title="删除文件">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                size="small"
                                danger
                            />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            )
        }
    ];

    // 分页处理
    const handleTableChange = (paginationConfig) => {
        fetchFileList(paginationConfig.current, paginationConfig.pageSize);
    };

    // 初始化和刷新触发
    useEffect(() => {
        fetchFileList();
    }, [refreshTrigger]);

    // 定时刷新文件列表（检查状态更新）
    useEffect(() => {
        const interval = setInterval(() => {
            fetchFileList(pagination.current, pagination.pageSize);
        }, 3000); // 每3秒刷新一次文件列表

        return () => clearInterval(interval);
    }, [pagination.current, pagination.pageSize]);

    return (
        <div className="file-list">
            {/* 操作栏 */}
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Text type="secondary">
                        共 {pagination.total} 个文件
                    </Text>
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                >
                    刷新
                </Button>
            </div>

            {/* 文件列表表格 */}
            <Table
                columns={columns}
                dataSource={files}
                rowKey="id"
                loading={loading}
                pagination={{
                    ...pagination,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }}
                onChange={handleTableChange}
                size="small"
                scroll={{ x: 800 }}
            />

            {/* 文件详情模态框 */}
            <Modal
                title="文件详情"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={600}
            >
                {selectedFile && (
                    <div>
                        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                            <div>
                                <Text strong>文件名:</Text>
                                <br />
                                <Text>{selectedFile.originalName}</Text>
                            </div>

                            <div>
                                <Text strong>状态:</Text>
                                <br />
                                <Tag color={statusColors[selectedFile.status]}>
                                    {statusTexts[selectedFile.status] || selectedFile.status}
                                </Tag>
                            </div>

                            <div>
                                <Text strong>文件大小:</Text>
                                <br />
                                <Text>{selectedFile.size ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '-'}</Text>
                            </div>

                            <div>
                                <Text strong>上传时间:</Text>
                                <br />
                                <Text>{moment(selectedFile.uploadTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                            </div>

                            {selectedFile.updateTime && (
                                <div>
                                    <Text strong>更新时间:</Text>
                                    <br />
                                    <Text>{moment(selectedFile.updateTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
                                </div>
                            )}

                            {selectedFile.taskId && (
                                <div>
                                    <Text strong>任务ID:</Text>
                                    <br />
                                    <Text code>{selectedFile.taskId}</Text>
                                </div>
                            )}

                            {selectedFile.errorMessage && (
                                <div>
                                    <Text strong>错误信息:</Text>
                                    <br />
                                    <Text type="danger">{selectedFile.errorMessage}</Text>
                                </div>
                            )}

                            {selectedFile.parseResult && (
                                <div>
                                    <Text strong>解析结果:</Text>
                                    <br />
                                    <Paragraph>
                                        <pre style={{
                                            background: '#f5f5f5',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            fontSize: '12px',
                                            maxHeight: '200px',
                                            overflow: 'auto'
                                        }}>
                                            {JSON.stringify(selectedFile.parseResult, null, 2)}
                                        </pre>
                                    </Paragraph>
                                </div>
                            )}

                            <div>
                                <Text strong>OSS路径:</Text>
                                <br />
                                <Text code style={{ fontSize: '11px' }}>{selectedFile.ossKey}</Text>
                            </div>
                        </Space>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FileList;
