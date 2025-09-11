import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import App from './App';
import './index.css';

// 设置moment中文
moment.locale('zh-cn');

// Ant Design 主题配置
const theme = {
    token: {
        colorPrimary: '#1890ff',
        borderRadius: 6,
        fontSize: 14,
    },
    components: {
        Button: {
            borderRadius: 6,
        },
        Card: {
            borderRadius: 8,
        },
        Modal: {
            borderRadius: 8,
        },
        Table: {
            borderRadius: 8,
        },
    },
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ConfigProvider
            locale={zhCN}
            theme={theme}
        >
            <App />
        </ConfigProvider>
    </React.StrictMode>
);
