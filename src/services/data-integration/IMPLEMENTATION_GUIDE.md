# 真实数据集成实施指南

## 概述

本文档提供了真实数据集成的完整实施指南，包括配置、部署和使用说明。

## 前置条件

### 1. 环境变量配置

创建 `.env` 文件并添加 API 密钥：

```bash
# EnergyData API
ENERGY_DATA_API_KEY=your_key_here

# Tianyancha API
TIANYANCHA_API_KEY=your_key_here

# 可选：其他 API
CHINA_POWER_API_KEY=your_key_here
QCC_API_KEY=your_key_here
```

### 2. 安装依赖

```bash
npm install
```

## 快速开始

### 1. 初始化数据集成

```typescript
import {
  setupPolicyDataIntegration,
  setupTariffDataIntegration,
  setupCompanyDataIntegration,
  getDataIntegrationManager
} from '@/services/data-integration';

// 初始化所有数据集成
const policyIntegration = setupPolicyDataIntegration();
const tariffIntegration = setupTariffDataIntegration();
const companyIntegration = setupCompanyDataIntegration();

// 获取管理器
const manager = getDataIntegrationManager();
```

### 2. 更新数据

```typescript
// 更新所有数据源
const results = await manager.updateAll();

console.table(results);
```

### 3. 查看状态

```typescript
// 获取所有数据源状态
const status = manager.getStatus();
console.table(status);

// 获取缓存统计
import { getCacheManager } from '@/services/data-integration';
const cacheManager = getCacheManager();
const cacheStats = cacheManager.getAllStats();
console.log('Cache Stats:', cacheStats);
```

## 数据源配置

### 政策数据源

**已配置源**:
- 国家发改委 (NDRC) - RSS 订阅
- 国家能源局 (NEA) - RSS 订阅
- 广东省发改委 - 待配置 RSS
- 浙江省发改委 - 待配置 RSS

**更新频率**: 每小时
**缓存时间**: 1 小时

### 电价数据源

**已配置源**:
- EnergyData API - 第三方电价数据
- ChinaPower API - 备选（待配置）

**更新频率**: 每日
**缓存时间**: 24 小时

**支持省份**:
- 广东
- 浙江
- 江苏
- 上海
- 北京

### 企业数据源

**已配置源**:
- 天眼查 (Tianyancha) - 企业信息 API
- 企查查 (QCC) - 备选（待配置）

**更新方式**: 按需查询
**缓存时间**: 2 小时

**数据字段**:
- 企业名称
- 统一社会信用代码
- 注册资本
- 法定代表人
- 经营状态
- 信用评分
- 风险等级

## 使用示例

### 1. 获取最新政策

```typescript
import { getDataIntegrationManager } from '@/services/data-integration';

const manager = getDataIntegrationManager();

// 更新政策数据
const result = await manager.updateByName('policy-data');

console.log(`新增政策: ${result.recordsAdded}`);
console.log(`处理记录: ${result.recordsProcessed}`);
```

### 2. 查询电价信息

```typescript
import { setupTariffDataIntegration } from '@/services/data-integration';

const tariffIntegration = setupTariffDataIntegration();

// 获取广东省电价
const guangdongTariff = await tariffIntegration.getTariff('广东');

console.log('峰时电价:', guangdongTariff.peakPrice);
console.log '谷时电价:', guangdongTariff.valleyPrice);

// 获取24小时价格
const hourlyPrices = await tariffIntegration.getHourlyPrices('广东');
console.log('24小时价格:', hourlyPrices);
```

### 3. 查询企业信息

```typescript
import { setupCompanyDataIntegration } from '@/services/data-integration';

const companyIntegration = setupCompanyDataIntegration();

// 查询单个企业
const companyInfo = await companyIntegration.getCompanyInfo('腾讯科技有限公司');

console.log('信用评分:', companyInfo.creditScore);
console.log('风险等级:', companyInfo.riskLevel);

// 批量查询
const companies = await companyIntegration.batchSearch([
  '腾讯科技有限公司',
  '阿里巴巴集团',
  '百度在线网络技术公司'
]);

console.table(companies);
```

### 4. 监控数据质量

```typescript
import {
  PolicyDataValidator,
  TariffDataValidator,
  CompanyDataValidator
} from '@/services/data-integration';

// 验证政策数据质量
const policyValidator = new PolicyDataValidator();
const policyQuality = policyValidator.checkQuality(policyData);

console.log('政策数据质量:', policyQuality);
console.log('综合评分:', policyQuality.overallScore);
console.log('改进建议:', policyQuality.recommendations);
```

## 性能优化

### 缓存策略

数据集成系统使用智能缓存来优化性能：

| 数据类型 | 缓存时间 | 失效策略 |
|----------|----------|----------|
| 政策数据 | 1 小时 | 定时更新 |
| 电价数据 | 24 小时 | 定时更新 |
| 企业数据 | 2 小时 | 按需更新 |

### 并发控制

- 政策数据: 最多 3 个并发请求
- 电价数据: 最多 5 个并发请求
- 企业数据: 最多 5 个并发请求

### 批量处理

对于大量数据查询，使用批量 API：

```typescript
// 批量查询企业信息（推荐）
const companies = await companyIntegration.batchSearch([
  '公司1', '公司2', '公司3', ...
]);

// 而不是
for (const name of companyNames) {
  const company = await companyIntegration.getCompanyInfo(name);
}
```

## 监控和调试

### 1. 查看集成状态

```typescript
const manager = getDataIntegrationManager();

// 获取所有数据源状态
const status = manager.getStatus();
status.forEach(s => {
  console.log(`${s.name}: ${s.status}`);
  console.log(`  成功率: ${s.successRate}%`);
  console.log(`  更新次数: ${s.updateCount}`);
  console.log(`  错误次数: ${s.errorCount}`);
});
```

### 2. 查看缓存统计

```typescript
const cacheManager = getCacheManager();
const stats = cacheManager.getAllStats();

console.log('缓存统计:', stats);

// 输出示例:
// {
//   policy: { size: 50, hits: 120, misses: 5, hitRate: 96 },
//   tariff: { size: 5, hits: 80, misses: 2, hitRate: 97.5 },
//   company: { size: 100, hits: 200, misses: 10, hitRate: 95.2 }
// }
```

### 3. 数据质量报告

```typescript
import { PolicyDataValidator } from '@/services/data-integration';

const validator = new PolicyDataValidator();
const quality = validator.checkQuality(policyData);

console.log('完整性:', quality.completeness);
console.log('准确性:', quality.accuracy);
console.log('时效性:', quality.timeliness);
console.log('一致性:', quality.consistency);
console.log('综合评分:', quality.overallScore);

if (quality.issues.length > 0) {
  console.warn('发现问题:', quality.issues);
  console.warn('改进建议:', quality.recommendations);
}
```

## 故障排查

### 问题 1: API 密钥无效

**症状**: 数据更新失败，出现认证错误

**解决方案**:
1. 检查 `.env` 文件中的 API 密钥
2. 验证密钥是否过期
3. 联系 API 提供商重新生成密钥

### 问题 2: 数据更新缓慢

**症状**: 更新时间过长

**解决方案**:
1. 检查网络连接
2. 启用缓存功能
3. 减少并发请求数量
4. 考虑使用 CDN 加速

### 问题 3: 数据质量差

**症状**: 验证失败率高

**解决方案**:
1. 检查数据源是否正常
2. 调整验证规则
3. 添加数据清洗逻辑
4. 联系数据源提供商

## 部署建议

### 开发环境

```typescript
// 使用模拟数据进行开发
const config = {
  policy: { enabled: true, useMock: true },
  tariff: { enabled: true, useMock: true },
  company: { enabled: true, useMock: true }
};
```

### 生产环境

```typescript
// 使用真实 API
const config = {
  policy: { enabled: true },
  tariff: { enabled: true },
  company: { enabled: true }
};

// 配置定时更新
manager.scheduleUpdate('policy-data', 3600000); // 每小时
manager.scheduleUpdate('tariff-data', 86400000); // 每天
```

## 安全建议

1. **API 密钥管理**
   - 使用环境变量存储密钥
   - 定期轮换密钥
   - 不要在代码中硬编码密钥

2. **访问控制**
   - 实施速率限制
   - 监控异常访问
   - 记录所有 API 调用

3. **数据备份**
   - 定期备份数据
   - 实现灾难恢复计划
   - 测试数据恢复流程

## 成本估算

### 第三方 API 成本

| 服务 | 免费额度 | 付费计划 | 推荐方案 |
|------|----------|----------|----------|
| EnergyData | 100次/月 | ¥2,000/月 | 从免费开始 |
| Tianyancha | 50次/月 | ¥1,500/月 | 从免费开始 |
| 总计 | 150次/月 | ¥3,500/月 | 按需升级 |

### 优化建议

1. **使用缓存**: 减少 API 调用次数
2. **批量查询**: 合并多个请求
3. **定时更新**: 避免频繁查询
4. **数据复用**: 在多个组件间共享数据

## 下一步

1. **配置 API 密钥**: 在 `.env` 文件中添加密钥
2. **测试数据源**: 运行测试验证连接
3. **监控性能**: 使用仪表板监控数据质量
4. **优化配置**: 根据实际使用情况调整

## 支持和帮助

- 📖 架构文档: `src/services/data-integration/RealDataIntegrationArchitecture.md`
- 💻 示例代码: `src/services/data-integration/`
- 🐛 问题反馈: GitHub Issues

---

**版本**: 1.0
**更新日期**: 2026-03-29
**维护者**: Claude Code
