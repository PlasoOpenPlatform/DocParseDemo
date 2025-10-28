require('dotenv').config();
const OSS = require('ali-oss');
const ossService = require('./src/services/ossService');
const config = require('./src/config');

/**
 * 测试 getSTSInfoForParsedFile 方法并使用获取的凭证访问 OSS。
 */
async function testSts() {
    // --- 请根据您的 OSS 环境修改以下变量 ---
    // 1. 这是您为 getSTSInfoForParsedFile 提供的测试路径。
    //    它应该指向一个包含您想访问的文件的目录。
    //    例如: 'dev-plaso/temp/docparse-demo/some-file-id/'
    const testParsedOssKey = 'file-plaso/dev-plaso/temp/docparse-demo/039cc68a-3316-41b2-bae6-49a47bc1bd18.docx_i';

    // 2. 这是您想用 STS 凭证实际读取的文件的完整路径。
    //    例如: 'dev-plaso/temp/docparse-demo/some-file-id/1.txt'
    const testObjectKey = 'dev-plaso/temp/docparse-demo/039cc68a-3316-41b2-bae6-49a47bc1bd18.docx_i/info.json';
    // ----------------------------------------

    console.log(`1. 开始测试: 获取路径 '${testParsedOssKey}' 的 STS 凭证...`);

    try {
        const stsInfo = await ossService.getSTSInfo(testParsedOssKey);

        console.log('\n2. 成功获取 STS 凭证:');
        console.log(JSON.stringify(stsInfo, null, 2));

        console.log('\n3. 使用 STS 凭证创建新的 OSS 客户端...');

        const stsClient = new OSS({
            secure: true,
            region: config.oss.region,
            accessKeyId: stsInfo.AccessKeyId,
            accessKeySecret: stsInfo.AccessKeySecret,
            stsToken: stsInfo.SecurityToken,
            bucket: config.oss.bucket,
        });

        console.log(`\n4. 尝试使用新凭证获取对象: '${testObjectKey}'`);

        try {
            const result = await stsClient.get(testObjectKey);
            console.log('\n5. 成功获取对象! 文件内容:');
            console.log(result.content.toString());
            console.log('\n✅ 测试成功!');
        } catch (getObjectError) {
            console.error('\n5. 使用 STS 凭证获取对象失败:', getObjectError);
            console.log('\n❌ 测试失败。请检查:');
            console.log('   - STS 策略中的资源路径是否正确 (' + `acs:oss:*:*:${config.oss.bucket}/${testParsedOssKey}*` + ')');
            console.log(`   - 测试对象 '${testObjectKey}' 是否确实存在于 Bucket 中。`);
        }

    } catch (error) {
        console.error('获取 STS 凭证时出错:', error);
        console.log('\n❌ 测试失败。请检查您的 STS 配置 (roleArn, stsEndpoint) 是否正确。');
    }
}

// 运行测试
testSts();
