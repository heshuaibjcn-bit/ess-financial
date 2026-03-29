/**
 * Data Integration Configuration
 *
 * Centralized configuration for all data integrations:
 * - API keys and endpoints
 * - Cache settings
 * - Update schedules
 * - Feature flags
 */

export interface DataIntegrationConfig {
  enabled: boolean;
  apiKey?: string;
  apiEndpoint?: string;
  timeout?: number;
  maxRetries?: number;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
}

export interface DataSourcesConfig {
  policy: {
    enabled: boolean;
    sources: Array<{
      name: string;
      url: string;
      type: 'rss' | 'api' | 'scraper';
      enabled: boolean;
    }>;
    updateInterval: number; // milliseconds
  };
  tariff: {
    enabled: boolean;
    sources: Array<{
      name: string;
      apiKey?: string;
      apiEndpoint?: string;
      enabled: boolean;
    }>;
    updateInterval: number;
    cache: {
      enabled: boolean;
      ttl: number;
    };
  };
  company: {
    enabled: boolean;
    sources: Array<{
      name: string;
      apiKey?: string;
      apiEndpoint?: string;
      enabled: boolean;
    }>;
    cache: {
      enabled: boolean;
      ttl: number;
    };
  };
}

/**
 * Default configuration
 */
export const defaultDataSourcesConfig: DataSourcesConfig = {
  policy: {
    enabled: true,
    sources: [
      {
        name: 'NDRC',
        url: 'https://www.ndrc.gov.cn/rss/zcfb.xml',
        type: 'rss',
        enabled: true
      },
      {
        name: 'NEA',
        url: 'https://www.nea.gov.cn/rss/news.xml',
        type: 'rss',
        enabled: true
      },
      {
        name: 'Guangdong-DRC',
        url: 'http://drc.gd.gov.cn/rss',
        type: 'rss',
        enabled: false // Enable when RSS feed is available
      },
      {
        name: 'Zhejiang-DRC',
        url: 'http://fzggw.zj.gov.cn/rss',
        type: 'rss',
        enabled: false
      }
    ],
    updateInterval: 3600000 // 1 hour
  },
  tariff: {
    enabled: true,
    sources: [
      {
        name: 'EnergyData',
        apiKey: process.env.ENERGY_DATA_API_KEY,
        apiEndpoint: 'https://api.energydata.com',
        enabled: true
      },
      {
        name: 'ChinaPower',
        apiKey: process.env.CHINA_POWER_API_KEY,
        apiEndpoint: 'https://api.chinapower.cn',
        enabled: false
      }
    ],
    updateInterval: 86400000, // 24 hours
    cache: {
      enabled: true,
      ttl: 86400000 // 24 hours
    }
  },
  company: {
    enabled: true,
    sources: [
      {
        name: 'Tianyancha',
        apiKey: process.env.TIANYANCHA_API_KEY,
        apiEndpoint: 'https://api.tianyancha.com',
        enabled: true
      },
      {
        name: 'QCC',
        apiKey: process.env.QCC_API_KEY,
        apiEndpoint: 'https://api.qcc.com',
        enabled: false
      }
    ],
    cache: {
      enabled: true,
      ttl: 7200000 // 2 hours
    }
  }
};

/**
 * Get configuration from environment variables or defaults
 */
export function getDataIntegrationConfig(): DataSourcesConfig {
  // Check if custom config is provided via environment
  const customConfig = process.env.DATA_INTEGRATION_CONFIG;

  if (customConfig) {
    try {
      return JSON.parse(customConfig);
    } catch (error) {
      console.error('Failed to parse DATA_INTEGRATION_CONFIG, using defaults');
    }
  }

  return defaultDataSourcesConfig;
}

/**
 * Validate API keys are configured
 */
export function validateAPIKeys(): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const config = getDataIntegrationConfig();
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check tariff API keys
  if (config.tariff.enabled) {
    const energyDataKey = config.tariff.sources.find(s => s.name === 'EnergyData')?.apiKey;
    if (!energyDataKey) {
      missing.push('ENERGY_DATA_API_KEY');
      warnings.push('EnergyData API key not configured, will use mock data');
    }
  }

  // Check company API keys
  if (config.company.enabled) {
    const tianyanchaKey = config.company.sources.find(s => s.name === 'Tianyancha')?.apiKey;
    if (!tianyanchaKey) {
      missing.push('TIANYANCHA_API_KEY');
      warnings.push('Tianyancha API key not configured, will use mock data');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

/**
 * Setup environment variables template
 */
export function getEnvTemplate(): string {
  return `
# Data Integration API Keys
# Get your API keys from the respective providers

# EnergyData API (https://energydata.com)
ENERGY_DATA_API_KEY=your_energy_data_api_key_here

# ChinaPower API (https://chinapower.cn)
CHINA_POWER_API_KEY=your_china_power_api_key_here

# Tianyancha API (https://www.tianyancha.com)
TIANYANCHA_API_KEY=your_tianyancha_api_key_here

# QCC API (https://www.qcc.com)
QCC_API_KEY=your_qcc_api_key_here

# Optional: Custom configuration
# DATA_INTEGRATION_CONFIG={"policy":{"enabled":true,"sources":[...]}}
`;
}

/**
 * Print setup instructions
 */
export function printSetupInstructions(): void {
  const validation = validateAPIKeys();

  console.log('\n=== Data Integration Setup ===\n');

  if (validation.valid) {
    console.log('✅ All API keys are configured');
  } else {
    console.log('⚠️  Some API keys are missing:');
    validation.missing.forEach(key => {
      console.log(`   - ${key}`);
    });
    console.log('\n💡 To configure API keys, add them to your .env file:');
    console.log(getEnvTemplate());
  }

  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
  }

  console.log('\n📖 For more information, see: src/services/data-integration/RealDataIntegrationArchitecture.md\n');
}
