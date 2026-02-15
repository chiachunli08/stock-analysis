'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

export default function StockDetailPage() {
  const params = useParams();
  const code = params.code as string;
  const [stock, setStock] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`/api/companies/${code}`);
        setStock(res.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [code]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-400">載入中...</div>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-100 mb-4">找不到股票</h1>
        <Link href="/stocks" className="text-cyan-400 hover:underline">
          返回股票列表
        </Link>
      </div>
    );
  }

  const indicators = stock.latest_indicators;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">
            {stock.stock_code} - {stock.name}
          </h1>
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-gray-400">{stock.industry || '-'}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              stock.market === '上市' ? 'bg-blue-900/50 text-blue-300' :
              'bg-green-900/50 text-green-300'
            }`}>
              {stock.market || '-'}
            </span>
          </div>
        </div>
        {indicators?.signal && (
          <span className={`px-4 py-2 rounded-lg text-white font-semibold ${
            indicators.signal === '低估' ? 'bg-green-600' :
            indicators.signal === '低價' ? 'bg-blue-600' :
            indicators.signal === '中等' ? 'bg-yellow-600' :
            indicators.signal === '過熱' ? 'bg-red-600' : 'bg-gray-600'
          }`}>
            {indicators.signal}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-100">估值指標</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">本益比 (PE)</span>
              <span className="text-xl font-semibold text-gray-100">
                {indicators?.pe_ttm ? parseFloat(indicators.pe_ttm).toFixed(2) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">股價淨值比 (PB)</span>
              <span className="text-xl font-semibold text-gray-100">
                {indicators?.pb_ratio ? parseFloat(indicators.pb_ratio).toFixed(2) : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">殖利率</span>
              <span className="text-xl font-semibold text-green-400">
                {indicators?.dividend_yield ? parseFloat(indicators.dividend_yield).toFixed(2) + '%' : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-100">綜合評分</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">CBS 財報分數</span>
              <span className={`text-2xl font-bold ${
                (indicators?.cbs_score || 0) >= 70 ? 'text-green-400' :
                (indicators?.cbs_score || 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {indicators?.cbs_score || '-'}
              </span>
            </div>
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  (indicators?.cbs_score || 0) >= 70 ? 'bg-green-500' :
                  (indicators?.cbs_score || 0) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${indicators?.cbs_score || 0}%` }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-2">
              分數評估：≥70 良好 | 50-70 中等 | &lt;50 較差
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-100">估值說明</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-gray-400 mb-2">本益比參考標準</div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-green-400">低估</span><span className="text-gray-300">&lt; 10</span></div>
              <div className="flex justify-between"><span className="text-blue-400">低價</span><span className="text-gray-300">10 - 15</span></div>
              <div className="flex justify-between"><span className="text-yellow-400">中等</span><span className="text-gray-300">15 - 25</span></div>
              <div className="flex justify-between"><span className="text-red-400">過熱</span><span className="text-gray-300">&gt; 25</span></div>
            </div>
          </div>
          <div className="bg-gray-900 p-4 rounded-lg">
            <div className="text-gray-400 mb-2">股價淨值比參考標準</div>
            <div className="space-y-1">
              <div className="flex justify-between"><span className="text-green-400">低估</span><span className="text-gray-300">&lt; 1.0</span></div>
              <div className="flex justify-between"><span className="text-blue-400">合理</span><span className="text-gray-300">1.0 - 2.0</span></div>
              <div className="flex justify-between"><span className="text-red-400">偏高</span><span className="text-gray-300">&gt; 2.0</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link href="/stocks" className="text-cyan-400 hover:underline">
          ← 返回股票列表
        </Link>
      </div>
    </div>
  );
}
