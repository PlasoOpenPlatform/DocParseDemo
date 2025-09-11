import React, { useState, useEffect } from 'react';
import { Layout, Typography, Card, Row, Col, Statistic, message } from 'antd';
import { FileTextOutlined, CloudUploadOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import StatusBoard from './components/StatusBoard';
import apiService from './services/apiService';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
    const [stats, setStats] = useState({
        total: 0,
        uploaded: 0,
        parsing: 0,
        completed: 0,
        failed: 0
    });
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // 获取统计数据
    const fetchStats = async () => {
        try {
            const response = await apiService.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('获取统计数据失败:', error);
        }
    };

    // 定时刷新统计数据
    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000); // 每5秒刷新一次
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    // 上传成功回调
    const handleUploadSuccess = (result) => {
        message.success(`文件 "${result.fileName}" 上传成功，正在解析中...`);
        setRefreshTrigger(prev => prev + 1);
    };

    // 上传失败回调
    const handleUploadError = (error) => {
        message.error(`文件上传失败: ${error.message || error}`);
    };

    return (
        <Layout className="app-layout">
            <Header className="app-header">
                <div className="header-content">
                    <div className="logo">
                        <FileTextOutlined className="logo-icon" />
                        <Title level={2} className="logo-text">文档解析Demo</Title>
                    </div>
                </div>
            </Header>

            <Content className="app-content">
                <div className="content-container">
                    {/* 统计卡片 */}
                    <Row gutter={[16, 16]} className="stats-row">
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="总文件数"
                                    value={stats.total}
                                    prefix={<FileTextOutlined />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="已上传"
                                    value={stats.uploaded}
                                    prefix={<CloudUploadOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="解析中"
                                    value={stats.parsing}
                                    prefix={<ExclamationCircleOutlined />}
                                    valueStyle={{ color: '#faad14' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card>
                                <Statistic
                                    title="已完成"
                                    value={stats.completed}
                                    prefix={<CheckCircleOutlined />}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* 主要内容 */}
                    <Row gutter={[24, 24]}>
                        <Col xs={24} lg={8}>
                            <Card title="文件上传" className="upload-card">
                                <FileUpload
                                    onSuccess={handleUploadSuccess}
                                    onError={handleUploadError}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} lg={16}>
                            <Card title="文件列表" className="file-list-card">
                                <FileList
                                    refreshTrigger={refreshTrigger}
                                    onRefresh={() => setRefreshTrigger(prev => prev + 1)}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* 状态监控面板 */}
                    <Row>
                        <Col xs={24}>
                            <StatusBoard refreshTrigger={refreshTrigger} />
                        </Col>
                    </Row>
                </div>
            </Content>
        </Layout>
    );
}

export default App;

