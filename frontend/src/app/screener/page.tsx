'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { screenerApi, metaApi } from '@/lib/api';

interface FilterState {
  roe_min: string;
  roe_max: string;
  pe_min: string;
  pe_max: string;
  current_ratio_min: string;
  f_score_min: string;
  cbs_score_min: string;
  signal: string[];
  industry: string[];
}

const defaultFilters: FilterState = {
  roe_min: '',
  roe_max: '',
  pe_min: '',
  pe_max: '',
  current_ratio_min: '',
  f_score_min: '',
  cbs_score_min: '',
  signal: [],
  industry: [],
};

export default function ScreenerPage() {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    metaApi.getIndustries().then(res => setIndustries(res.data));
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setLoading(true);
    setPage(1);
    try {
      const filterPayload: any = {};
      if (filters.roe_min) filterPayload.roe_min = parseFloat(filters.roe_min);
      if (filters.roe_max) filterPayload.roe_max = parseFloat(filters.roe_max);
      if (filters.pe_min) filterPayload.pe_min = parseFloat(filters.pe_min);
      if (filters.pe_max) filterPayload.pe_max = parseFloat(filters.pe_max);
      if (filters.current_ratio_min) filterPayload.current_ratio_min = parseFloat(filters.current_ratio_min);
      if (filters.f_score_min) filterPayload.f_score_min = parseInt(filters.f_score_min);
      if (filters.cbs_score_min) filterPayload.cbs_score_min = parseInt(filters.cbs_score_min);
      if (filters.signal.length > 0) filterPayload.signal = filters.signal;
      if (filters.industry.length > 0) filterPayload.industry = filters.industry;

      const res = await screenerApi.screen(filterPayload, 1, 50);
      setResults(res.data.companies);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    setResults([]);
    setTotal(0);
  };

  const toggleArrayFilter = (key: 'signal' | 'industry', value: string) => {
    setFilters(prev => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">股票篩選</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ROE 最小值 (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 15"
              value={filters.roe_min}
              onChange={(e) => handleFilterChange('roe_min', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ROE 最大值 (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 30"
              value={filters.roe_max}
              onChange={(e) => handleFilterChange('roe_max', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本益比最小值
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 5"
              value={filters.pe_min}
              onChange={(e) => handleFilterChange('pe_min', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              本益比最大值
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 20"
              value={filters.pe_max}
              onChange={(e) => handleFilterChange('pe_max', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              流動比率最小值
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 1.5"
              value={filters.current_ratio_min}
              onChange={(e) => handleFilterChange('current_ratio_min', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              F-Score 最小值 (0-9)
            </label>
            <input
              type="number"
              min="0"
              max="9"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 7"
              value={filters.f_score_min}
              onChange={(e) => handleFilterChange('f_score_min', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              財報分數最小值 (0-100)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="例: 70"
              value={filters.cbs_score_min}
              onChange={(e) => handleFilterChange('cbs_score_min', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            燈號
          </label>
          <div className="flex flex-wrap gap-2">
            {['低估', '低價', '中等', '過熱', '觀望'].map((signal) => (
              <button
                key={signal}
                onClick={() => toggleArrayFilter('signal', signal)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.signal.includes(signal)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {signal}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            產業
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {industries.slice(0, 20).map((ind: any) => (
              <button
                key={ind.name}
                onClick={() => toggleArrayFilter('industry', ind.name)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filters.industry.includes(ind.name)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {ind.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '搜尋中...' : '搜尋'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <span className="text-gray-600">找到 {total} 檔股票</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">代碼</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">名稱</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">產業</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">ROE</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">本益比</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">流動比率</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">F-Score</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">財報分數</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">燈號</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.map((stock: any) => (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/stocks/${stock.stock_code}`}
                        className="text-primary-600 hover:underline font-medium"
                      >
                        {stock.stock_code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{stock.name}</td>
                    <td className="px-4 py-3">{stock.industry || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      {stock.latest_indicators?.roe?.toFixed(2) || '-'}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock.latest_indicators?.pe_ttm?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock.latest_indicators?.current_ratio?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {stock.latest_indicators?.f_score || '-'}/9
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`px-2 py-1 rounded text-white text-sm ${
                        (stock.latest_indicators?.cbs_score || 0) >= 80 ? 'bg-green-500' :
                        (stock.latest_indicators?.cbs_score || 0) >= 60 ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>
                        {stock.latest_indicators?.cbs_score || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {stock.latest_indicators?.signal && (
                        <span className={`px-2 py-1 rounded text-white text-xs ${
                          stock.latest_indicators.signal === '低估' ? 'bg-green-500' :
                          stock.latest_indicators.signal === '低價' ? 'bg-blue-500' :
                          stock.latest_indicators.signal === '中等' ? 'bg-yellow-500' :
                          stock.latest_indicators.signal === '過熱' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`}>
                          {stock.latest_indicators.signal}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
