import Link from 'next/link';
import { companyApi, screenerApi } from '@/lib/api';

async function getDashboardData() {
  try {
    const [companiesRes, undervaluedRes] = await Promise.all([
      companyApi.getAll(1, 5),
      screenerApi.screen({ signal: ['低估'], cbs_score_min: 60 }, 1, 5),
    ]);
    
    return {
      totalCompanies: companiesRes.data.total,
      undervalued: undervaluedRes.data.companies,
    };
  } catch {
    return { totalCompanies: 0, undervalued: [] };
  }
}

export default async function HomePage() {
  const data = await getDashboardData();
  
  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">台股財報分析系統</h1>
        <p className="text-gray-600 text-lg">
          基於財報說指標體系，提供台股財報分析、股票篩選、排雷偵測功能
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-primary-600">{data.totalCompanies}</div>
          <div className="text-gray-500">上市公司數</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-green-600">{data.undervalued.length}</div>
          <div className="text-gray-500">低估股票數</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-blue-600">25+</div>
          <div className="text-gray-500">財務指標</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">功能介紹</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/screener" className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold text-primary-600">股票篩選</h3>
            <p className="text-sm text-gray-500">多條件篩選符合投資標準的股票</p>
          </Link>
          <Link href="/stocks" className="p-4 border rounded-lg hover:bg-gray-50">
            <h3 className="font-semibold text-primary-600">股票列表</h3>
            <p className="text-sm text-gray-500">瀏覽所有上市櫃公司基本資料</p>
          </Link>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-primary-600">排雷偵測</h3>
            <p className="text-sm text-gray-500">5 維度排雷指標自動偵測</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold text-primary-600">五線譜分析</h3>
            <p className="text-sm text-gray-500">統計學方法判斷買賣時機</p>
          </div>
        </div>
      </div>
      
      {data.undervalued.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">低估股票推薦</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">股票代碼</th>
                  <th className="px-4 py-2 text-left">名稱</th>
                  <th className="px-4 py-2 text-left">產業</th>
                  <th className="px-4 py-2 text-right">ROE</th>
                  <th className="px-4 py-2 text-right">本益比</th>
                  <th className="px-4 py-2 text-right">財報分數</th>
                </tr>
              </thead>
              <tbody>
                {data.undervalued.map((stock: any) => (
                  <tr key={stock.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <Link href={`/stocks/${stock.stock_code}`} className="text-primary-600 hover:underline">
                        {stock.stock_code}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{stock.name}</td>
                    <td className="px-4 py-2">{stock.industry || '-'}</td>
                    <td className="px-4 py-2 text-right">
                      {stock.latest_indicators?.roe?.toFixed(2) || '-'}%
                    </td>
                    <td className="px-4 py-2 text-right">
                      {stock.latest_indicators?.pe_ttm?.toFixed(2) || '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <span className={`px-2 py-1 rounded text-white text-sm ${
                        (stock.latest_indicators?.cbs_score || 0) >= 80 ? 'bg-green-500' :
                        (stock.latest_indicators?.cbs_score || 0) >= 60 ? 'bg-blue-500' : 'bg-gray-500'
                      }`}>
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
