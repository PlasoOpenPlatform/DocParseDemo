const crypto = require('crypto');
const config = require('../config');

class SignatureService {
    constructor() { }

    /**
     * 根据appId获取对应的secretKey
     * @param {string} appId 
     * @returns {string|null} a secret key or null
     */
    getSecretKeyByAppId(appId) {
        // 测试环境有多个appId，根据appId返回对应的secretKey
        const authConfig = config.docParseService.auth;
        if (authConfig.appId === appId) {
            return authConfig.secretKey;
        }
        if (authConfig.appId2 === appId) {
            return authConfig.secretKey2;
        }
        // 可以根据需要扩展更多appId
        return null;
    }

    /**
     * 生成通用签名
     * @param {Object} params 请求参数
     * @param {string} signKey 签名密钥
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
     * 生成会议签名
     * @param {Object} clientParams 客户端传入的参数
     * @returns {Object} 包含签名和所有参数的对象
     */
    generateMeetingSignature(clientParams) {
        const { other } = clientParams;
        const { appId } = other;

        // 服务端生成的参数，如果客户端在 other 中传入则使用客户端的值
        const serverParams = {
            validBegin: Math.floor(Date.now() / 1000),
            validTime: 3600, // 有效期1小时，可以根据需要调整
            ...other
        };

        // 合并所有参数用于签名
        const allParams = {
            ...serverParams
        };

        const secretKey = this.getSecretKeyByAppId(appId);
        if (!secretKey) {
            throw new Error(`无效的appId: ${appId}`);
        }

        // 生成签名
        const signature = this.generateSignature(allParams, secretKey);

        // 构建返回结果
        const result = {
            ...allParams,
            signature,
        };

        return result;
    }
}

module.exports = new SignatureService();
