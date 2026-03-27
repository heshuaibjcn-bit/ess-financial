/**
 * OperatingCostsStep - Step 5: Real business operating costs
 *
 * Collects:
 * - Personnel costs (运维、管理、技术)
 * - Office costs (租金、费用)
 * - Maintenance costs (定期、预防)
 * - Insurance costs (设备、责任、财产)
 * - Other costs (许可证、监管、培训、水电)
 * - Tax rates (增值税、城建税、企业所得税)
 */

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export const OperatingCostsStep: React.FC = () => {
  const { t } = useTranslation();
  const { register, formState: { errors } } = useFormContext();
  const { watch } = useFormContext();

  // Watch operating costs for real-time total calculation
  const operatingCosts = watch('operatingCosts') || {};

  // Calculate total annual operating costs
  const calculateTotalOpex = () => {
    if (!operatingCosts || Object.keys(operatingCosts).length === 0) {
      return 0;
    }

    return Object.values(operatingCosts).reduce((sum: number, val: number) => sum + (val || 0), 0);
  };

  // Calculate total including sales expenses
  const totalOpex = calculateTotalOpex();

  const totalOpex = calculateTotalOpex();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('calculator.operatingCosts.title')} - 运营成本
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          包含真实的企业运营支出（人员、办公、维护、保险、税费等）
        </p>
      </div>

      {/* Personnel Costs - 人力成本 */}
      <div className="border-b border-gray-200 pb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">人员成本 (¥/年)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="operationsStaffCost" className="block text-sm font-medium text-gray-700 mb-2">
              运维人员工资 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="operationsStaffCost"
                type="number"
                step="10000"
                min="0"
                max="5000000"
                {...register('operatingCosts.operationsStaffCost', {
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatingCosts?.operationsStaffCost ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-2 text-gray-500 text-sm">¥</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">2名运维人员</p>
            {errors.operatingCosts?.operationsStaffCost && (
              <p className="mt-1 text-sm text-red-600">{errors.operatingCosts.operationsStaffCost.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="managementCost" className="block text-sm font-medium text-gray-700 mb-2">
              管理人员费用 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="managementCost"
                type="number"
                step="10000"
                min="0"
                max="3000000"
                {...register('operatingCosts.managementCost', {
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatingCosts?.managementCost ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-2 text-gray-500 text-sm">¥</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">项目经理、财务等</p>
          </div>

          <div>
            <label htmlFor="technicalSupportCost" className="block text-sm font-medium text-gray-700 mb-2">
              技术支持费用 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="technicalSupportCost"
                type="number"
                step="10000"
                min="0"
                max="2000000"
                {...register('operatingCosts.technicalSupportCost', {
                  valueAsNumber: true,
                })}
                className={`w-full px-4 py-2 pr-16 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.operatingCosts?.technicalSupportCost ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <span className="absolute right-4 top-2 text-gray-500 text-sm">¥</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">技术顾问、远程监控</p>
          </div>
        </div>
      </div>

      {/* Office & Maintenance - 办公与维护 */}
      <div className="border-b border-gray-200 pb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">办公与维护 (¥/年)</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="officeRent" className="block text-sm font-medium text-gray-700 mb-2">
              办公租金
            </label>
            <input
              id="officeRent"
              type="number"
              step="10000"
              min="0"
              placeholder="100000"
              {...register('operatingCosts.officeRent', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.officeRent ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="officeExpenses" className="block text-sm font-medium text-gray-700 mb-2">
              办公费用
            </label>
            <input
              id="officeExpenses"
              type="number"
              step="5000"
              min="0"
              placeholder="50000"
              {...register('operatingCosts.officeExpenses', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.officeExpenses ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="regularMaintenanceCost" className="block text-sm font-medium text-gray-700 mb-2">
              定期检修
            </label>
            <input
              id="regularMaintenanceCost"
              type="number"
              step="10000"
              min="0"
              placeholder="200000"
              {...register('operatingCosts.regularMaintenanceCost', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.regularMaintenanceCost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="preventiveMaintenanceCost" className="block text-sm font-medium text-gray-700 mb-2">
              预防性维护
            </label>
            <input
              id="preventiveMaintenanceCost"
              type="number"
              step="5000"
              min="0"
              placeholder="80000"
              {...register('operatingCosts.preventiveMaintenanceCost', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.preventiveMaintenanceCost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Insurance - 保险费用 */}
      <div className="border-b border-gray-200 pb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">保险费用 (¥/年)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="equipmentInsurance" className="block text-sm font-medium text-gray-700 mb-2">
              设备保险
            </label>
            <input
              id="equipmentInsurance"
              type="number"
              step="10000"
              min="0"
              placeholder="100000"
              {...register('operatingCosts.equipmentInsurance', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.equipmentInsurance ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="liabilityInsurance" className="block text-sm font-medium text-gray-700 mb-2">
              责任保险
            </label>
            <input
              id="liabilityInsurance"
              type="number"
              step="5000"
              min="0"
              placeholder="50000"
              {...register('operatingCosts.liabilityInsurance', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.liabilityInsurance ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="propertyInsurance" className="block text-sm font-medium text-gray-700 mb-2">
              财产保险
            </label>
            <input
              id="propertyInsurance"
              type="number"
              step="5000"
              min="0"
              placeholder="30000"
              {...register('operatingCosts.propertyInsurance', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.propertyInsurance ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Other Costs - 其他运营费用 */}
      <div className="border-b border-gray-200 pb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">其他费用 (¥/年)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="licenseFee" className="block text-sm font-medium text-gray-700 mb-2">
              许可证年费
            </label>
            <input
              id="licenseFee"
              type="number"
              step="5000"
              min="0"
              placeholder="50000"
              {...register('operatingCosts.licenseFee', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.licenseFee ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="regulatoryFee" className="block text-sm font-medium text-gray-700 mb-2">
              监管费用
            </label>
            <input
              id="regulatoryFee"
              type="number"
              step="5000"
              min="0"
              placeholder="20000"
              {...register('operatingCosts.regulatoryFee', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.regulatoryFee ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="trainingCost" className="block text-sm font-medium text-gray-700 mb-2">
              培训费用
            </label>
            <input
              id="trainingCost"
              type="number"
              step="5000"
              min="0"
              placeholder="30000"
              {...register('operatingCosts.trainingCost', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.trainingCost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="utilitiesCost" className="block text-sm font-medium text-gray-700 mb-2">
              水电通讯
            </label>
            <input
              id="utilitiesCost"
              type="number"
              step="5000"
              min="0"
              placeholder="20000"
              {...register('operatingCosts.utilitiesCost', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.utilitiesCost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="landLeaseCost" className="block text-sm font-medium text-gray-700 mb-2">
              土地租金（如适用）
            </label>
            <input
              id="landLeaseCost"
              type="number"
              step="10000"
              min="0"
              placeholder="100000"
              {...register('operatingCosts.landLeaseCost', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.landLeaseCost ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>

          <div>
            <label htmlFor="salesExpenses" className="block text-sm font-medium text-gray-700 mb-2">
              销售费用
            </label>
            <input
              id="salesExpenses"
              type="number"
              step="10000"
              min="0"
              placeholder="303818"
              {...register('operatingCosts.salesExpenses', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.salesExpenses ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">市场推广、业务拓展等</p>
          </div>
        </div>
      </div>

      {/* Taxes - 税费 */}
      <div className="pb-6">
        <h4 className="text-md font-semibold text-gray-800 mb-4">税率设置</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="vatRate" className="block text-sm font-medium text-gray-700 mb-2">
              增值税率 (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="vatRate"
              type="number"
              step="1"
              min="0"
              max="13"
              {...register('operatingCosts.vatRate', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.vatRate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">现代服务业6%</p>
          </div>

          <div>
            <label htmlFor="surtaxRate" className="block text-sm font-medium text-gray-700 mb-2">
              城建税及附加 (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="surtaxRate"
              type="number"
              step="1"
              min="0"
              max="15"
              {...register('operatingCosts.surtaxRate', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.surtaxRate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">增值税的12%</p>
          </div>

          <div>
            <label htmlFor="corporateTaxRate" className="block text-sm font-medium text-gray-700 mb-2">
              企业所得税率 (%) <span className="text-red-500">*</span>
            </label>
            <input
              id="corporateTaxRate"
              type="number"
              step="1"
              min="0"
              max="25"
              {...register('operatingCosts.corporateTaxRate', {
                valueAsNumber: true,
              })}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.operatingCosts?.corporateTaxRate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <p className="mt-1 text-xs text-gray-500">标准25%</p>
          </div>
        </div>
      </div>

      {/* Total Operating Costs Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center">
          <svg
            className="w-5 h-5 text-blue-400 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9 2a1 1 0 000 2 2v10a1 1 0 002 2 2 2 2 0 002-2 2 3 12 3 12 0 018-6 12 0 016-6 6 6 0 01-6-6 3 0 012-6z" />
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800">
              年度运营总成本: <span className="font-bold ml-2">
                ¥{(totalOpex / 10000).toFixed(1)}万
              </span>
            </p>
            <p className="text-xs text-blue-600 mt-1">
              包含人员、办公、维护、保险等所有运营支出
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
