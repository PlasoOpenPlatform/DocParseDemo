import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Progress, Alert, Button, Space, Typography, Divider } from 'antd';
import {
    ReloadOutlined,
    DatabaseOutlined,
    ClockCircleOutlined,
    HddOutlined,
    CloudOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import moment from 'moment';
import apiService from '../services/apiService';

const { Text, Title } = Typography;

const StatusBoard = ({ refreshTrigger }) => {
    const [systemStatus, setSystemStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    // 获取系统状态
    const fetchSystemStatus = async () => {
        setLoading(true);
        try {
            const response = await apiService.getSystemStatus();
            if (response.success) {
                setSystemStatus(response.data);
                setLastUpdate(moment());
            }
        } catch (error) {
            console.error('获取系统状态失败:', error);
            setSystemStatus(null);
        } finally {
            setLoading(false);
        }
    };

    // 健康检查
    const checkHealth = async () => {
        try {
            const response = await apiService.healthCheck();
            return response.status === 'healthy';
        } catch (error) {
            console.error('健康检查失败:', error);
            return false;
        }
    };

    // 格式化内存大小
    const formatMemory = (bytes) => {
        if (!bytes) return '0 MB';
        const mb = bytes / 1024 / 1024;
        return `${mb.toFixed(1)} MB`;
    };

    // 格式化运行时间
    const formatUptime = (uptimeFormatted) => {
        if (!uptimeFormatted) return '未知';
        const { days, hours, minutes } = uptimeFormatted;

        if (days > 0) {
            return `${days}天 ${hours}小时 ${minutes}分钟`;
        } else if (hours > 0) {
            return `${hours}小时 ${minutes}分钟`;
        } else {
            return `${minutes}分钟`;
        }
    };

    // 计算处理成功率
    const calculateSuccessRate = (stats) => {
        if (!stats || stats.total === 0) return 0;
        return Math.round((stats.completed / stats.total) * 100);
    };

    // 手动刷新
    const handleRefresh = () => {
        fetchSystemStatus();
    };

    // 自动刷新
    useEffect(() => {
        fetchSystemStatus();
        const interval = setInterval(fetchSystemStatus, 10000); // 每10秒刷新一次
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    if (!systemStatus) {
        return (
            <Card title="系统状态监控" loading={loading}>
                <Alert
                    message="无法获取系统状态"
                    description="请检查后端服务是否正常运行"
                    type="error"
                    showIcon
                />
            </Card>
        );
    }

    const { fileStats, system } = systemStatus;
    const successRate = calculateSuccessRate(fileStats);

    return (
        <Card
            title={
                <Space>
                    <DatabaseOutlined />
                    <span>系统状态监控</span>
                    {lastUpdate && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            最后更新: {lastUpdate.format('HH:mm:ss')}
                        </Text>
                    )}
                </Space>
            }
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    loading={loading}
                    size="small"
                >
                    刷新
                </Button>
            }
        >
            <Row gutter={[16, 16]}>
                {/* 文件处理统计 */}
                <Col xs={24} lg={12}>
                    <Card size="small" title="文件处理统计">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="总文件数"
                                    value={fileStats.total}
                                    prefix={<FileTextOutlined />}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="成功率"
                                    value={successRate}
                                    suffix="%"
                                    valueStyle={{
                                        color: successRate >= 90 ? '#3f8600' :
                                            successRate >= 70 ? '#faad14' : '#cf1322'
                                    }}
                                />
                            </Col>
                        </Row>

                        <Divider style={{ margin: '12px 0' }} />

                        <Row gutter={8}>
                            <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#52c41a', fontSize: '18px', fontWeight: 'bold' }}>
                                        {fileStats.completed}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>已完成</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#faad14', fontSize: '18px', fontWeight: 'bold' }}>
                                        {fileStats.parsing}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>处理中</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}>
                                        {fileStats.uploaded}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>已上传</div>
                                </div>
                            </Col>
                            <Col span={6}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#ff4d4f', fontSize: '18px', fontWeight: 'bold' }}>
                                        {fileStats.failed}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>失败</div>
                                </div>
                            </Col>
                        </Row>

                        {/* 处理进度条 */}
                        {fileStats.total > 0 && (
                            <div style={{ marginTop: '16px' }}>
                                <Text strong style={{ fontSize: '12px' }}>处理进度</Text>
                                <Progress
                                    percent={Math.round(((fileStats.completed + fileStats.failed) / fileStats.total) * 100)}
                                    success={{ percent: Math.round((fileStats.completed / fileStats.total) * 100) }}
                                    size="small"
                                    format={(percent, successPercent) =>
                                        `已处理 ${percent}% (成功 ${successPercent}%)`
                                    }
                                />
                            </div>
                        )}
                    </Card>
                </Col>

                {/* 系统信息 */}
                <Col xs={24} lg={12}>
                    <Card size="small" title="系统信息">
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div>
                                        <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                                        <Text strong>运行时间: </Text>
                                        <Text>{formatUptime(system.uptimeFormatted)}</Text>
                                    </div>

                                    <div>
                                        <HddOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                                        <Text strong>内存使用: </Text>
                                        <Text>{formatMemory(system.memory?.rss)} / {formatMemory(system.memory?.heapTotal)}</Text>
                                    </div>

                                    <div>
                                        <CloudOutlined style={{ marginRight: 8, color: '#faad14' }} />
                                        <Text strong>堆内存: </Text>
                                        <Text>{formatMemory(system.memory?.heapUsed)}</Text>
                                    </div>

                                    <div>
                                        <DatabaseOutlined style={{ marginRight: 8, color: '#722ed1' }} />
                                        <Text strong>外部内存: </Text>
                                        <Text>{formatMemory(system.memory?.external)}</Text>
                                    </div>
                                </Space>
                            </Col>
                        </Row>

                        {/* 内存使用率 */}
                        {system.memory && (
                            <div style={{ marginTop: '16px' }}>
                                <Text strong style={{ fontSize: '12px' }}>内存使用率</Text>
                                <Progress
                                    percent={Math.round((system.memory.heapUsed / system.memory.heapTotal) * 100)}
                                    size="small"
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                    format={percent => `${percent}%`}
                                />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* 状态提示 */}
            <div style={{ marginTop: 16 }}>
                {fileStats.parsing > 0 && (
                    <Alert
                        message={`当前有 ${fileStats.parsing} 个文件正在解析中`}
                        type="info"
                        showIcon
                        closable
                        style={{ marginBottom: 8 }}
                    />
                )}

                {fileStats.failed > 0 && (
                    <Alert
                        message={`有 ${fileStats.failed} 个文件解析失败，请检查文件格式或服务状态`}
                        type="warning"
                        showIcon
                        closable
                        style={{ marginBottom: 8 }}
                    />
                )}

                {successRate < 70 && fileStats.total > 5 && (
                    <Alert
                        message={`文件解析成功率较低 (${successRate}%)，建议检查文档解析服务状态`}
                        type="error"
                        showIcon
                        closable
                    />
                )}
            </div>
        </Card>
    );
};

export default StatusBoard;
