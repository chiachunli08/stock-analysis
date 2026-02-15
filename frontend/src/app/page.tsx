'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function HomePage() {
  const [stats, setStats] = useState({ total: 0, undervalued: 0 });
  const [undervalued, setUndervalued] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, screenerRes] = await Promise.all([
          axios.get('/api/companies?page=1&page_size=1'),
          axios.post('/api/screener?page=1&page_size=10', { signal: ['低估'] }),
        ]);
        setStats({
          total: companiesRes.data.total,
          undervalued: screenerRes.data.total,
        });
        setUndervalued(screenerRes.data.companies);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-4">台股財報分析系統</h1>
        <p className="text-gray-400 text-lg">
          基於財報說指標體系，提供台股財報分析、股票篩選功能
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-cyan-400">{stats.total}</div>
          <div className="text-gray-400 mt-1">上市公司數</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-green-400">{stats.undervalued}</div>
          <div className="text-gray-400 mt-1">低估股票數</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="text-3xl font-bold text-purple-400">25+</div>
          <div className="text-gray-400 mt-1">財務指標</div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-100">功能介紹</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/screener" className="p-4 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors">
            <h3 className="font-semibold text-cyan-400">股票篩選</h3>
            <p className="text-sm text-gray-400 mt-1">多條件篩選符合投資標準的股票</p>
          </Link>
          <Link href="/stocks" className="p-4 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors">
            <h3 className="font-semibold text-cyan-400">股票列表</h3>
            <p className="text-sm text-gray-400 mt-1">瀏覽所有上市櫃公司基本資料</p>
          </Link>
          <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="font-semibold text-cyan-400">估值指標</h3>
            <p className="text-sm text-gray-400 mt-1">本益比、股價淨值比、殖利率</p>
          </div>
          <div className="p-4 border border-gray-700 rounded-lg">
            <h3 className="font-semibold text-cyan-400">信號系統</h3>
            <p className="text-sm text-gray-400 mt-1">低估、低價、中等、過熱、觀望</p>
          </div>
        </div>
      </div>
      
      {undervalued.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-gray-100">低估股票推薦</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">股票代碼</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">名稱</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-400">市場</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">本益比</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-400">股價淨值比</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-400">分數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {undervalued.map((stock: any) => (
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
                        {stock.market || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">
                      {stock.latest_indicators?.pe_ttm ? parseFloat(stock.latest_indicators.pe_ttm).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-200">
                      {stock.latest_indicators?.pb_ratio ? parseFloat(stock.latest_indicators.pb_ratio).toFixed(2) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded text-white text-sm bg-green-600">
                        {stock.latest_indicators?.cbs_score || '-'}
                      </span>
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
