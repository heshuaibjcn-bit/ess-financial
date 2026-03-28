# 储能政策池系统

## 📋 系统概述

储能政策池是一个智能化的政策信息管理系统，专门用于收集、分析和展示工商业储能相关的政策信息。

### 核心特性

1. **自动更新** - 每小时自动抓取最新政策
2. **AI分析** - 使用Claude AI智能分析政策内容
3. **分类管理** - 按电价、补贴、技术等类别分类
4. **智能搜索** - 支持关键词搜索和筛选
5. **实时通知** - 新政策自动通知用户
6. **可复用组件** - 轻松集成到任何页面

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Policy Pool System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              UI Components                            │ │
│  │  • PolicyPoolWidget (通用组件)                       │ │
│  │  • PolicyDetailModal (详情弹窗)                      │ │
│  │  • PolicyNotificationBadge (通知徽章)                │ │
│  └───────────────────────────────────────────────────────┘ │
│                           ↕                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Service Layer                             │ │
│  │  • PolicyPoolService (政策管理)                      │ │
│  │  • AIPolicyAnalyzer (AI分析)                         │ │
│  │  • PolicyCrawler (政策爬取)                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                           ↕                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Data Layer                                │ │
│  │  • PolicyDocument (政策数据结构)                      │ │
│  │  • PolicyFilter (筛选器)                              │ │
│  │  • LocalStorage (本地存储)                            │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📂 文件结构

```
src/
├── domain/schemas/
│   └── PolicySchema.ts                 # 政策数据结构定义
├── services/policy/
│   ├── AIPolicyAnalyzer.ts            # AI政策分析服务
│   ├── PolicyPoolService.ts           # 政策池核心服务
│   └── index.ts                       # 服务导出
├── components/
│   ├── PolicyPoolWidget.tsx           # 政策池通用组件
│   └── form-steps/
│       └── DataAnalysisStep.tsx       # 集成到数据分析步骤
└── tests/
    └── policyPool.test.ts             # 测试文件
```

## 🚀 使用方法

### 1. 基础使用（在数据分析步骤中）

数据分析步骤（Step 5）已集成政策池功能：

1. 进入"数据分析"步骤
2. 点击"政策池"标签页
3. 查看最新的储能政策
4. 点击政策标题查看详细分析

### 2. 作为独立组件使用

```tsx
import { PolicyPoolWidget } from './components/PolicyPoolWidget';

function MyPage() {
  return (
    <div>
      <h2>政策中心</h2>
      <PolicyPoolWidget
        maxItems={10}
        autoRefresh={true}
        defaultCategory="tariff"
        defaultProvince="guangdong"
        onPolicyClick={(policy) => {
          console.log('Selected policy:', policy);
        }}
      />
    </div>
  );
}
```

### 3. 编程方式使用

```typescript
import { getPolicyPool } from './services/policy';

// 获取政策池实例
const policyPool = getPolicyPool();

// 初始化（首次使用）
await policyPool.initialize();

// 获取所有政策
const allPolicies = policyPool.getAllPolicies();

// 按类别筛选
const tariffPolicies = policyPool.getPoliciesByCategory('tariff');

// 按省份筛选
const gdPolicies = policyPool.getPoliciesByProvince('guangdong');

// 搜索政策
const results = policyPool.searchPolicies('储能补贴');

// 获取统计信息
const stats = policyPool.getStatistics();

// 获取通知
const notifications = policyPool.getNotifications();
```

### 4. AI分析功能

```typescript
import { getPolicyAnalyzer } from './services/policy';

const analyzer = getPolicyAnalyzer();

// 检查AI是否可用
if (analyzer.isAvailable()) {
  // 分析政策
  const result = await analyzer.analyzePolicy({
    title: '政策标题',
    category: 'tariff',
    level: 'national',
    fullText: '政策全文...',
    source: 'https://...',
    sourceAgency: '发布机构'
  });

  console.log('AI分析结果:', result.summary);
}
```

## 🎯 功能说明

### 政策分类

| 类别 | 说明 | 示例 |
|------|------|------|
| 电价政策 | 峰谷电价、容量电价等 | 分时电价机制通知 |
| 补贴政策 | 投资补贴、度电补贴 | 储能项目补贴办法 |
| 技术标准 | 电池要求、安全规范 | 储能电站技术标准 |
| 市场政策 | 现货市场、辅助服务 | 电力市场交易规则 |
| 并网政策 | 接入要求、流程 | 储能并网管理办法 |
| 规划政策 | 发展规划、目标 | 储能发展规划 |
| 税收政策 | 税收优惠、减免 | 储能税收优惠政策 |

### 政策级别

- **国家级** - 国家发改委、能源局等部委发布的政策
- **省级** - 各省市发改委、能源局发布的政策
- **市级** - 地市政府发布的政策
- **区域级** - 区域协调政策（如华东、华南）

### AI分析内容

每个政策都经过AI智能分析，包含：

1. **政策摘要** - 100-200字的简明摘要
2. **关键要点** - 3-5条核心要点
3. **影响分析** - 对储能项目的具体影响
4. **投资建议** - 给投资者的具体建议
5. **智能标签** - 自动生成的主题标签

## ⚙️ 配置说明

### 更新频率

默认情况下，政策池每小时自动更新一次。可以通过以下方式调整：

```typescript
<PolicyPoolWidget
  autoRefresh={true}
  refreshInterval={30 * 60 * 1000} // 30分钟
/>
```

### API Key配置

AI分析功能需要Anthropic API Key：

**方式一：环境变量（推荐）**
```bash
# .env 文件
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxx
```

**方式二：应用内设置**
1. 点击电价详情页面的AI助手按钮
2. 进入设置
3. 输入API Key并保存

### 数据源配置

政策数据源在 `PolicyPoolService.ts` 中配置：

```typescript
export const POLICY_SOURCES: PolicySource[] = [
  {
    name: '国家发改委',
    url: 'https://www.ndrc.gov.cn/xxgk/zcfb/tz',
    agency: '国家发展和改革委员会',
    updateFrequency: 24, // 小时
    category: ['tariff', 'subsidy'],
    level: ['national'],
  },
  // ... 更多数据源
];
```

## 🧪 测试

运行测试：

```typescript
import { testPolicyPool } from './tests/policyPool.test';

// 在浏览器控制台执行
testPolicyPool().then(result => {
  console.log('Test result:', result);
});
```

## 📊 数据存储

政策数据存储在浏览器的 `localStorage` 中：

- `policy_pool_policies` - 政策数据
- `policy_pool_notifications` - 通知数据

数据格式：
- 政策数据包含完整的政策信息和AI分析结果
- 支持离线查看
- 自动同步最新政策

## 🔔 通知系统

当有新政策时，系统会自动创建通知：

- **new** - 新政策发布
- **updated** - 政策更新
- **expired** - 政策失效
- **expiring_soon** - 政策即将失效

## 🎨 自定义样式

`PolicyPoolWidget` 支持自定义样式：

```tsx
<PolicyPoolWidget
  className="my-custom-style"
  maxItems={15}
/>
```

## 🚧 未来计划

- [ ] 政策爬虫自动化
- [ ] 更多政策数据源
- [ ] 政策PDF文件解析
- [ ] 政策影响评分算法
- [ ] 政策订阅推送
- [ ] 政策对比功能
- [ ] 多语言支持

## 📞 技术支持

如有问题或建议，请联系开发团队。
