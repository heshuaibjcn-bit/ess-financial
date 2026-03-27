/**
 * useProvince - React hook for province data management
 *
 * Provides access to province data with automatic loading and caching
 */

import { useCallback, useEffect, useState } from 'react';
import { provinceDataRepository } from '../domain/repositories/ProvinceDataRepository';
import {
  loadProvince,
  loadProvinces,
  getSupportedProvinces,
  preloadProvinces,
  isProvinceSupported,
} from '../api/calculatorApi';
import type { ProvinceData } from '../domain/schemas/ProvinceSchema';

/**
 * Hook for single province data
 *
 * @param slug - Province slug (e.g., 'guangdong')
 * @returns Province data and loading state
 */
export function useProvince(slug: string) {
  const [province, setProvince] = useState<ProvinceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        const data = await loadProvince(slug);
        if (!cancelled) {
          if (!data) {
            setError(`Province not found: ${slug}`);
          } else {
            setProvince(data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load province';
          setError(errorMsg);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return {
    province,
    loading,
    error,
  };
}

/**
 * Hook for multiple provinces
 *
 * @param slugs - Array of province slugs
 * @returns Map of province data and loading state
 */
export function useProvinces(slugs: string[]) {
  const [provinces, setProvinces] = useState<Map<string, ProvinceData>>(new Map());
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slugs || slugs.length === 0) return;

      setLoading(true);

      try {
        const data = await loadProvinces(slugs);
        if (!cancelled) {
          setProvinces(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load provinces:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return {
    provinces,
    loading,
    errors,
  };
}

/**
 * Hook for all provinces (no argument version)
 * Returns list of all provinces with name, code, and loading state
 */
export function useAllProvinces() {
  const [provinces, setProvinces] = useState<Array<{ code: string; name: string; nameEn: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const supportedProvinces = getSupportedProvinces();

        // Province names mapping
        const provinceNames: Record<string, string> = {
          guangdong: '广东省',
          shandong: '山东省',
          zhejiang: '浙江省',
          jiangsu: '江苏省',
          shanghai: '上海市',
          anhui: '安徽省',
          hunan: '湖南省',
          hubei: '湖北省',
          henan: '河南省',
          jiangxi: '江西省',
          beijing: '北京市',
          tianjin: '天津市',
          hebei: '河北省',
          shanxi: '山西省',
          neimenggu: '内蒙古自治区',
          liaoning: '辽宁省',
          jilin: '吉林省',
          heilongjiang: '黑龙江省',
          shaanxi: '陕西省',
          gansu: '甘肃省',
          qinghai: '青海省',
          ningxia: '宁夏回族自治区',
          xinjiang: '新疆维吾尔自治区',
          sichuan: '四川省',
          chongqing: '重庆市',
          yunnan: '云南省',
          guizhou: '贵州省',
          xizang: '西藏自治区',
          guangxi: '广西壮族自治区',
          hainan: '海南省',
          fujian: '福建省',
        };

        const provinceList = supportedProvinces.map((slug) => ({
          code: slug,
          name: provinceNames[slug] || slug,
          nameEn: slug.charAt(0).toUpperCase() + slug.slice(1),
        }));

        if (!cancelled) {
          setProvinces(provinceList);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load provinces';
          setError(errorMsg);
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    provinces,
    loading,
    error,
  };
}

/**
 * Hook for supported provinces list
 */
export function useSupportedProvinces(): string[] {
  const [provinces, setProvinces] = useState<string[]>([]);

  useEffect(() => {
    setProvinces(getSupportedProvinces());
  }, []);

  return provinces;
}

/**
 * Hook to preload provinces
 *
 * @param slugs - Provinces to preload
 * @returns Loading state
 */
export function usePreloadProvinces(slugs: string[]) {
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!slugs || slugs.length === 0) return;

      setLoading(true);

      try {
        await preloadProvinces(slugs);
        if (!cancelled) {
          setLoaded(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to preload provinces:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [slugs]);

  return {
    loading,
    loaded,
  };
}

/**
 * Hook to check if province is supported
 *
 * @param slug - Province slug
 * @returns Whether province is supported
 */
export function useIsProvinceSupported(slug: string): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(isProvinceSupported(slug));
  }, [slug]);

  return supported;
}

/**
 * Convenience hook to get province names
 */
export function useProvinceNames(): Record<string, string> {
  const supportedProvinces = useSupportedProvinces();

  return {
    guangdong: '广东省',
    shandong: '山东省',
    zhejiang: '浙江省',
    jiangsu: '江苏省',
    shanghai: '上海市',
    anhui: '安徽省',
    hunan: '湖南省',
    hubei: '湖北省',
    henan: '河南省',
    jiangxi: '江西省',
    beijing: '北京市',
    tianjin: '天津市',
    hebei: '河北省',
    shanxi: '山西省',
    neimenggu: '内蒙古自治区',
    liaoning: '辽宁省',
    jilin: '吉林省',
    heilongjiang: '黑龙江省',
    shaanxi: '陕西省',
    gansu: '甘肃省',
    qinghai: '青海省',
    ningxia: '宁夏回族自治区',
    xinjiang: '新疆维吾尔自治区',
    sichuan: '四川省',
    chongqing: '重庆市',
    yunnan: '云南省',
    guizhou: '贵州省',
    xizang: '西藏自治区',
    guangxi: '广西壮族自治区',
    hainan: '海南省',
    fujian: '福建省',
  };
}

/**
 * Convenience hook to get province options for select
 */
export function useProvinceOptions(): Array<{ value: string; label: string }> {
  const provinceNames = useProvinceNames();
  const supportedProvinces = useSupportedProvinces();

  return supportedProvinces.map((slug) => ({
    value: slug,
    label: provinceNames[slug] || slug,
  }));
}
