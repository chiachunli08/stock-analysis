'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

interface FilterState {
  pe_max: string;
  pb_max: string;
  signal: string[];
}

export default function ScreenerPage() {
  const [filters, setFilters] = useState<FilterState>({
    pe_max: '',
    pb_max: '',
    signal: [],
  });
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const signals = ['低估', '低價', '中等', '過熱', '觀望'];

  const handleSearch = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const filterPayload: any = {};
      if (filters.pe_max) filterPayload.pe_max = parseFloat(filters.pe_max);
      if (filters.pb_max) filterPayload.pb_max = parseFloat(filters.pb_max);
      if (filters.signal.length > 0) filterPayload.signal = filters.signal;

      const res = await axios.post('/api/screener?page=1&page_size=100', filterPayload);
      setResults(res.data.companies);
      setTotal(res.data.total);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSignal = (signal: string) => {
    setFilters(prev => ({
      ...prev,
      signal: prev.signal.includes(signal)
        ? prev.signal.filter(s => s !== signal)
        : [...prev.signal, signal]
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">股票篩選</h1>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              本益比上限
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="例: 20"
              value={filters.pe_max}
              onChange={(e) => setFilters(prev => ({ ...prev, pe_max: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              股價淨值比上限
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="例: 1.5"
              value={filters.pb_max}
              onChange={(e) => setFilters(prev => ({ ...prev, pb_max: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              快速篩選
            </label>
            <button
              onClick={() => setFilters({ pe_max: '15', pb_max: '1.5', signal: ['低估', '低價'] })}
              className="w-full px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors"
            >
              價值投資組合
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            信號
          </label>
          <div className="flex flex-wrap gap-2">
            {signals.map((signal) => (
              <button
                key={signal}
                onClick={() => toggleSignal(signal)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filters.signal.includes(signal)
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {signal}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 disabled:opacity-50 transition-colors"
          >
            {loading ? '搜尋中...' : '搜尋'}
          </button>
          <button
            onClick={() => { setFilters({ pe_max: '', pb_max: '', signal: [] }); setResults([]); setTotal(0); setSearched(false); }}
            className="px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {searched && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-700">
            <span className="text-gray-300">找到 <span className="text-cyan-400 font-semibold">{total}</span> 檔股票</span>
          </div>
          
          {results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">代碼</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">名稱</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">市場</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">本益比</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">淨值比</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">殖利率</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">信號</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {results.map((stock: any) => (
                    <tr key={stock.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/stocks/${stock.stock_code}`} className="text-cyan-400 hover:text-cyan-300 font-medium">
                          {stock.stock_code}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{stock.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          stock.market === '上市' ? 'bg-blue-900/50 text-blue-300' :
                          'bg-green-900/50 text-green-300'
                        }`}>
                          {stock.market}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {stock.latest_indicators?.pe_ttm ? parseFloat(stock.latest_indicators.pe_ttm).toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {stock.latest_indicators?.pb_ratio ? parseFloat(stock.latest_indicators.pb_ratio).toFixed(2) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-200">
                        {stock.latest_indicators?.dividend_yield ? parseFloat(stock.latest_indicators.dividend_yield).toFixed(2) + '%' : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {stock.latest_indicators?.signal && (
                          <span className={`px-2 py-1 rounded text-white text-xs font-medium ${
                            stock.latest_indicators.signal === '低估' ? 'bg-green-600' :
                            stock.latest_indicators.signal === '低價' ? 'bg-blue-600' :
                            stock.latest_indicators.signal === '中等' ? 'bg-yellow-600' :
                            stock.latest_indicators.signal === '過熱' ? 'bg-red-600' :
                            'bg-gray-600'
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
          ) : (
            <div className="p-8 text-center text-gray-400">
              沒有找到符合條件的股票
            </div>
          )}
        </div>
      )}
    </div>
  );
}
