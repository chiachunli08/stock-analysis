'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';

export default function StocksPage() {
  const [data, setData] = useState<any>({ total: 0, items: [], page: 1, page_size: 50 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/companies?page=${page}&page_size=50`);
        setData(res.data);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchData();
  }, [page]);

  const totalPages = Math.ceil(data.total / data.page_size);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-xl text-gray-400">載入中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">股票列表</h1>
      <div className="text-gray-400 mb-4">共 {data.total} 檔股票</div>
      
      <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">股票代碼</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">名稱</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">市場</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {data.items.map((stock: any) => (
                <tr key={stock.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/stocks/${stock.stock_code}`}
                      className="text-cyan-400 hover:text-cyan-300 font-medium"
                    >
                      {stock.stock_code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-200">{stock.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      stock.market === '上市' ? 'bg-blue-900/50 text-blue-300' :
                      stock.market === '上櫃' ? 'bg-green-900/50 text-green-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {stock.market || '-'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700">
            <div className="text-sm text-gray-400">
              第 {page} 頁 / 共 {totalPages} 頁
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
              >
                上一頁
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-200"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
