import Link from 'next/link';
import { companyApi } from '@/lib/api';

async function getStocks(searchParams: { page?: string }) {
  const page = parseInt(searchParams.page || '1');
  try {
    const res = await companyApi.getAll(page, 50);
    return res.data;
  } catch {
    return { total: 0, page: 1, page_size: 50, items: [] };
  }
}

export default async function StocksPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const data = await getStocks(searchParams);
  const totalPages = Math.ceil(data.total / data.page_size);
  const currentPage = data.page;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">股票列表</h1>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">股票代碼</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">名稱</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">產業</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">市場</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.items.map((stock: any) => (
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
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      stock.market === '上市' ? 'bg-blue-100 text-blue-700' :
                      stock.market === '上櫃' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
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
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              共 {data.total} 筆資料
            </div>
            <div className="flex space-x-2">
              {currentPage > 1 && (
                <a
                  href={`?page=${currentPage - 1}`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                >
                  上一頁
                </a>
              )}
              <span className="px-3 py-1">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages && (
                <a
                  href={`?page=${currentPage + 1}`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                >
                  下一頁
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
