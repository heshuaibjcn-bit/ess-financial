# 真实数据集成架构设计

## 概述

本文档描述了储能投资分析系统的真实数据集成架构，包括政策数据、电价数据和财务数据的集成方案。

## 目标

- 从真实数据源获取数据，替代模拟数据
- 提高数据准确性和实时性
- 支持自动化数据更新
- 建立数据质量监控

## 数据源分类

### 1. 政策数据源

#### 国家级政策源

| 数据源 | URL | 更新频率 | 数据格式 | 认证方式 |
|--------|-----|----------|----------|----------|
| 国家发改委 | https://www.ndrc.gov.cn/xxgk/zcfb/tz | 每日 | HTML/PDF | 无需认证 |
| 国家能源局 | https://www.nea.gov.cn/ | 每日 | HTML/PDF | 无需认证 |
| 国家税务总局 | https://www.chinatax.gov.cn/ | 每周 | HTML | 无需认证 |

#### 省级政策源

| 省份 | 发改委 URL | 能源局 URL | 更新频率 |
|------|-----------|-----------|----------|
| 广东 | http://drc.gd.gov.cn/ | - | 每日 |
| 浙江 | http://fzggw.zj.gov.cn/ | - | 每日 |
| 江苏 | http://fzggw.jiangsu.gov.cn/ | - | 每日 |
| 上海 | https://fgw.sh.gov.cn/ | - | 每日 |
| 北京 | https://fgw.beijing.gov.cn/ | - | 每日 |

#### 数据获取方式

**方案 1: 官方 API（推荐）**
```typescript
// 检查是否提供官方 API
const governmentAPIs = {
  ndrc: {
    baseURL: 'https://api.ndrc.gov.cn/api/v1', // 假设的 API
    endpoints: {
      policies: '/policies',
      search: '/policies/search'
    },
    auth: 'API_KEY' // 需要申请
  }
};
```

**方案 2: 网页爬虫（备选）**
```typescript
// 使用 Puppeteer/Playwright 爬取政策数据
import { PuppeteerService } from './crawlers/PuppeteerService';

class PolicyCrawler {
  async crawlNDRC() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // 访问政策发布页面
    await page.goto('https://www.ndrc.gov.cn/xxgk/zcfb/tz');

    // 提取政策列表
    const policies = await page.evaluate(() => {
      const items = document.querySelectorAll('.policy-item');
      return Array.from(items).map(item => ({
        title: item.querySelector('.title').textContent,
        url: item.querySelector('a').href,
        date: item.querySelector('.date').textContent
      }));
    });

    await browser.close();
    return policies;
  }
}
```

**方案 3: RSS 订阅（最佳）**
```typescript
// 许多政府网站提供 RSS 订阅
const rssFeeds = {
  ndrc: 'https://www.ndrc.gov.cn/rss/zcfb.xml',
  nea: 'https://www.nea.gov.cn/rss/news.xml'
};

import { Parser } from 'rss-parser';

const parser = new Parser();
const feed = await parser.parseURL(rssFeeds.ndrc);

feed.items.forEach(item => {
  console.log(item.title, item.pubDate, item.link);
});
```

### 2. 电价数据源

#### 电网公司数据源

| 数据源 | URL | 数据类型 | 更新频率 | 访问方式 |
|--------|-----|----------|----------|----------|
| 国家电网 | https://www.sgcc.com.cn/ | 省级电价 | 季度 | 公开数据 |
| 南方电网 | https://www.csg.cn/ | 省级电价 | 季度 | 公开数据 |

#### 第三方能源数据 API

| 服务商 | API | 定价 | 数据质量 |
|--------|-----|------|----------|
| EnergyData | https://api.energydata.com/tariff | 付费 | ⭐⭐⭐⭐⭐ |
| ChinaPower | https://api.chinapower.cn/prices | 免费/付费 | ⭐⭐⭐⭐ |
| LocalGrid | https://api.localgrid.com/tariffs | 免费API | ⭐⭐⭐ |

#### 数据获取方式

**方案 1: 第三方 API（推荐）**
```typescript
interface TariffAPI {
  getProvincialTariff(province: string): Promise<TariffData>;
  getHourlyPrice(province: string, date: Date): Promise<HourlyPrice[]>;
  subscribeToUpdates(callback: (data: TariffData) => void): void;
}

// 使用示例
const tariffAPI = new EnergyDataAPI(process.env.ENERGY_DATA_API_KEY);
const guangdongTariff = await tariffAPI.getProvincialTariff('广东');
```

**方案 2: 电网公司公开数据**
```typescript
// 从电网公司官网下载 Excel/PDF 文件
class TariffDataScraper {
  async scrapeSGCC() {
    // 访问国家电网电价发布页面
    await page.goto('https://www.sgcc.com.cn/html/sgcc_main/col8/column_8_1.shtml');

    // 下载最新的电价表
    const downloadLinks = await page.$$eval('.download-link', links =>
      links.map(link => link.href)
    );

    // 解析 Excel 文件
    for (const link of downloadLinks) {
      const data = await this.parseExcelTariffFile(link);
      await this.saveToDatabase(data);
    }
  }
}
```

### 3. 财务数据源

#### 企业信息查询

| 数据源 | URL | 数据类型 | 访问方式 |
|--------|-----|----------|----------|
| 国家企业信用信息公示系统 | http://www.gsxt.gov.cn/ | 工商信息 | 免费 |
| 天眼查 API | https://api.tianyancha.com/ | 企业信息 | 付费 |
| 企查查 API | https://api.qcc.com/ | 企业信息 | 付费 |

#### 财务数据 API

```typescript
// 使用天眼查 API（示例）
interface TianyanchaAPI {
  getCompanyInfo(name: string): Promise<CompanyInfo>;
  getCreditScore(companyId: string): Promise<number>;
  getFinancialStatements(companyId: string): Promise<FinancialData>;
}

const tianyancha = new TianyanchaAPI(process.env.TIANYANCHA_API_KEY);
const companyInfo = await tianyancha.getCompanyInfo('腾讯科技有限公司');
```

#### CSV 上传（备选方案）

```typescript
// 支持用户上传财务参数 CSV
class FinancialDataUploader {
  parseCSV(csvContent: string): FinancialParameters {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');

    // 解析参数
    const parameters: FinancialParameters = {
      initialInvestment: this.parseNumber(lines[1][0]),
      discountRate: this.parseNumber(lines[1][1]),
      projectLifetime: this.parseNumber(lines[1][2]),
      // ... 其他参数
    };

    return parameters;
  }
}
```

## 集成架构设计

### 架构层次

```
┌─────────────────────────────────────────────────────────┐
│                    应用层 (Agents)                       │
│  PolicyAgent │ TariffAgent │ DueDiligenceAgent │ ...    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  数据服务层 (Services)                    │
│  PolicyDataService │ TariffDataService │ CompanyService  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                 数据集成层 (Integrations)                 │
│  API Clients │ Crawlers │ Parsers │ Validators          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    数据源层 (Sources)                     │
│  Government APIs │ Third-party APIs │ Web Scrapers      │
└─────────────────────────────────────────────────────────┘
```

### 核心组件

#### 1. 数据集成管理器

```typescript
class DataIntegrationManager {
  private integrations: Map<string, DataIntegration> = new Map();

  register(name: string, integration: DataIntegration): void {
    this.integrations.set(name, integration);
  }

  async updateAll(): Promise<void> {
    // 并行更新所有数据源
    await Promise.all(
      Array.from(this.integrations.values()).map(integration =>
        integration.update()
      )
    );
  }

  async updateByName(name: string): Promise<void> {
    const integration = this.integrations.get(name);
    if (integration) {
      await integration.update();
    }
  }

  getStatus(): IntegrationStatus[] {
    return Array.from(this.integrations.entries()).map(([name, integration]) => ({
      name,
      lastUpdate: integration.getLastUpdate(),
      status: integration.getStatus(),
      errorCount: integration.getErrorCount()
    }));
  }
}
```

#### 2. 数据集成接口

```typescript
interface DataIntegration {
  name: string;
  update(): Promise<void>;
  getLastUpdate(): Date;
  getStatus(): 'healthy' | 'error' | 'updating';
  getErrorCount(): number;
}

// 政策数据集成
class PolicyDataIntegration implements DataIntegration {
  name = 'policy-data';
  private sources: PolicyDataSource[] = [];

  constructor() {
    // 注册所有政策数据源
    this.sources.push(
      new NDRCPolicySource(),
      new NEAPolicySource(),
      // ... 其他源
    );
  }

  async update(): Promise<void> {
    for (const source of this.sources) {
      try {
        const policies = await source.fetch();
        await this.saveToDatabase(policies);
      } catch (error) {
        console.error(`Failed to update ${source.name}:`, error);
      }
    }
  }

  // ... 其他方法
}
```

#### 3. 数据验证器

```typescript
class DataValidator {
  validatePolicy(policy: PolicyData): ValidationResult {
    const errors: string[] = [];

    // 必填字段检查
    if (!policy.title) errors.push('标题不能为空');
    if (!policy.category) errors.push('类别不能为空');
    if (!policy.publishDate) errors.push('发布日期不能为空');

    // 数据格式检查
    if (policy.publishDate && isNaN(Date.parse(policy.publishDate))) {
      errors.push('发布日期格式错误');
    }

    // 业务规则检查
    if (policy.level === 'national' && policy.geographicScope.provinces.length > 0) {
      errors.push('国家级政策不应指定省份');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

#### 4. 数据缓存层

```typescript
class DataCache {
  private cache: Map<string, CacheEntry> = new Map();
  private ttl: number = 3600000; // 1小时

  set(key: string, value: any): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  invalidate(pattern: string): void {
    // 根据模式失效缓存
    for (const key of this.cache.keys()) {
      if (key.match(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}
```

## 数据更新策略

### 更新频率

| 数据类型 | 更新频率 | 触发方式 |
|----------|----------|----------|
| 政策数据 | 每小时 | 定时任务 |
| 电价数据 | 每日 | 定时任务 |
| 企业信息 | 按需 | 用户请求 |
| 财务参数 | 按需 | 用户上传 |

### 更新流程

```typescript
// 定时更新任务
class DataUpdateScheduler {
  private schedule: UpdateSchedule = {
    policy: { interval: '1h', enabled: true },
    tariff: { interval: '1d', enabled: true },
    company: { interval: 'on-demand', enabled: true }
  };

  start(): void {
    // 每小时更新政策数据
    setInterval(async () => {
      if (this.schedule.policy.enabled) {
        await this.integrationManager.updateByName('policy-data');
      }
    }, 3600000); // 1小时

    // 每天更新电价数据
    setInterval(async () => {
      if (this.schedule.tariff.enabled) {
        await this.integrationManager.updateByName('tariff-data');
      }
    }, 86400000); // 24小时
  }
}
```

## 错误处理和降级策略

### 错误处理

```typescript
class ResilientDataIntegration {
  async updateWithRetry(maxRetries = 3): Promise<void> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        await this.update();
        return;
      } catch (error) {
        lastError = error;
        console.warn(`Update attempt ${i + 1} failed:`, error);

        // 指数退避
        await this.sleep(Math.pow(2, i) * 1000);
      }
    }

    // 所有重试失败，触发降级策略
    await this.fallbackToMockData();
    throw lastError;
  }

  private async fallbackToMockData(): Promise<void> {
    console.warn('Falling back to mock data');
    // 使用模拟数据作为备选
  }
}
```

### 数据质量监控

```typescript
class DataQualityMonitor {
  checkQuality(data: any): QualityReport {
    return {
      completeness: this.checkCompleteness(data),
      accuracy: this.checkAccuracy(data),
      timeliness: this.checkTimeliness(data),
      consistency: this.checkConsistency(data),
      overallScore: 0 // 计算综合评分
    };
  }

  private checkCompleteness(data: any): number {
    // 检查必填字段完整度
    const requiredFields = ['title', 'date', 'content'];
    const filledFields = requiredFields.filter(field => data[field]);
    return (filledFields.length / requiredFields.length) * 100;
  }
}
```

## 安全性考虑

### API 密钥管理

```typescript
// 使用环境变量存储敏感信息
const apiKeys = {
  energyData: process.env.ENERGY_DATA_API_KEY,
  tianyancha: process.env.TIANYANCHA_API_KEY,
  // ... 其他密钥
};

// 定期轮换密钥
class APIKeyRotator {
  async rotateKeys(): Promise<void> {
    // 实现密钥轮换逻辑
  }
}
```

### 访问限流

```typescript
class RateLimitedAPI {
  private rateLimiter = new TokenBucket(10, 60000); // 10次/分钟

  async callAPI(url: string): Promise<any> {
    await this.rateLimiter.waitForToken();

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    return response.json();
  }
}
```

## 实施计划

### 第一阶段（1-2周）

1. **调研数据源**
   - 测试政府网站 RSS 订阅
   - 评估第三方 API 质量和价格
   - 确定数据格式和字段

2. **基础架构**
   - 实现 DataIntegrationManager
   - 创建数据验证器
   - 建立数据缓存层

### 第二阶段（2-3周）

1. **政策数据集成**
   - 实现 PolicyDataIntegration
   - 部署爬虫或 API 客户端
   - 测试数据更新流程

2. **电价数据集成**
   - 实现 TariffDataIntegration
   - 集成第三方 API
   - 验证数据准确性

### 第三阶段（1-2周）

1. **企业信息集成**
   - 实现 CompanyDataIntegration
   - 集成天眼查/企查查 API
   - 测试信用评分功能

2. **监控和优化**
   - 部署数据质量监控
   - 优化更新频率
   - 建立告警机制

## 成本估算

### 第三方 API 成本

| 服务 | 月费用 | 年费用 | 备注 |
|------|--------|--------|------|
| EnergyData API | ¥2,000 | ¥24,000 | 电价数据 |
| 天眼查 API | ¥1,500 | ¥18,000 | 企业信息 |
| 企查查 API | ¥1,500 | ¥18,000 | 企业信息（备选） |
| 爬虫服务器 | ¥500 | ¥6,000 | 云服务器 |
| **总计** | **¥5,500** | **¥66,000** | |

### 免费方案

使用政府公开数据 + 爬虫：
- 成本：¥500/月（服务器费用）
- 优点：免费数据
- 缺点：维护成本高，数据更新不及时

## 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| API 服务中断 | 中 | 高 | 多数据源备份 |
| 数据格式变更 | 高 | 中 | 灵活的解析器 |
| 爬虫被屏蔽 | 中 | 中 | 使用官方 API |
| 数据质量差 | 低 | 高 | 数据验证 |

## 总结

真实数据集成将显著提升系统的准确性和实用性。建议采用分阶段实施策略：

1. **优先级**: 政策数据 > 电价数据 > 企业信息
2. **数据源**: 优先使用官方 API，备选爬虫
3. **成本控制**: 从免费方案开始，根据需求升级
4. **质量保证**: 建立完善的数据验证和监控机制

---

**文档版本**: 1.0
**创建日期**: 2026-03-29
**作者**: Claude Code
**状态**: 待审核和实施
