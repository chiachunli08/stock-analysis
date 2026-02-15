import { companyApi } from '@/lib/api';
import Link from 'next/link';

async function getStockDetail(code: string) {
  try {
    const res = await companyApi.getByCode(code);
    return res.data;
  } catch {
    return null;
  }
}

async function getTrendAnalysis(code: string) {
  try {
    const res = await companyApi.getTrend(code);
    return res.data;
  } catch {
    return null;
  }
}

export default async function StockDetailPage({
  params,
}: {
  params: { code: string };
}) {
  const [stock, trend] = await Promise.all([
    getStockDetail(params.code),
    getTrendAnalysis(params.code),
  ]);

  if (!stock) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">找不到股票</h1>
        <Link href="/stocks" className="text-primary-600 hover:underline">
          返回股票列表
        </Link>
      </div>
    );
  }

  const indicators = stock.latest_indicators;
  const price = stock.latest_price;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {stock.stock_code} - {stock.name}
          </h1>
          <div className="flex items-center space-x-4 mt-2 text-gray-600">
            <span>{stock.industry || '-'}</span>
            <span className={`px-2 py-1 rounded text-xs ${
              stock.market === '上市' ? 'bg-blue-100 text-blue-700' :
              stock.market === '上櫃' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {stock.market || '-'}
            </span>
          </div>
        </div>
        {indicators?.signal && (
          <span className={`px-4 py-2 rounded-lg text-white font-semibold ${
            indicators.signal === '低估' ? 'bg-green-500' :
            indicators.signal === '低價' ? 'bg-blue-500' :
            indicators.signal === '中等' ? 'bg-yellow-500' :
            indicators.signal === '過熱' ? 'bg-red-500' : 'bg-gray-500'
          }`}>
            {indicators.signal}
          </span>
        )}
      </div>

      {price && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">最新股價</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-500 text-sm">收盤價</div>
              <div className="text-2xl font-bold">{price.close?.toFixed(2) || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">漲跌幅</div>
              <div className={`text-lg font-semibold ${
                (price.change_percent || 0) >= 0 ? 'text-red-500' : 'text-green-500'
              }`}>
                {(price.change_percent || 0) >= 0 ? '+' : ''}
                {price.change_percent?.toFixed(2) || '-'}%
              </div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">成交量</div>
              <div className="text-lg">{price.volume?.toLocaleString() || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">日期</div>
              <div className="text-lg">{price.date || '-'}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">杜邦分析</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">ROE (股東報酬率)</span>
              <span className="font-semibold text-lg">{indicators?.roe?.toFixed(2) || '-'}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary-500 rounded-full"
                style={{ width: `${Math.min((indicators?.roe || 0) * 2, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">淨利率</span>
              <span className="font-semibold">{indicators?.net_margin?.toFixed(2) || '-'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">總資產周轉率</span>
              <span className="font-semibold">{indicators?.asset_turnover?.toFixed(2) || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">權益乘數</span>
              <span className="font-semibold">{indicators?.equity_multiplier?.toFixed(2) || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">獲利能力</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">毛利率</span>
              <span className="font-semibold">{indicators?.gross_margin?.toFixed(2) || '-'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">營業利潤率</span>
              <span className="font-semibold">{indicators?.operating_margin?.toFixed(2) || '-'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">本益比 (TTM)</span>
              <span className="font-semibold">{indicators?.pe_ttm?.toFixed(2) || '-'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">股價淨值比</span>
              <span className="font-semibold">{indicators?.pb_ratio?.toFixed(2) || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">償債能力</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">流動比率</span>
              <span className={`font-semibold ${
                (indicators?.current_ratio || 0) >= 1.5 ? 'text-green-600' : 'text-red-600'
              }`}>
                {indicators?.current_ratio?.toFixed(2) || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">速動比率</span>
              <span className={`font-semibold ${
                (indicators?.quick_ratio || 0) >= 1 ? 'text-green-600' : 'text-red-600'
              }`}>
                {indicators?.quick_ratio?.toFixed(2) || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">負債比率</span>
              <span className="font-semibold">{indicators?.debt_ratio?.toFixed(2) || '-'}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">現金比率</span>
              <span className={`font-semibold ${
                (indicators?.cash_ratio || 0) >= 10 ? 'text-green-600' : 'text-red-600'
              }`}>
                {indicators?.cash_ratio?.toFixed(2) || '-'}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">綜合評分</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">F-Score (成長分數)</span>
              <span className="font-semibold">{indicators?.f_score || '-'}/9</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full"
                style={{ width: `${((indicators?.f_score || 0) / 9) * 100}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">CBS 財報分數</span>
              <span className={`font-semibold text-lg ${
                (indicators?.cbs_score || 0) >= 80 ? 'text-green-600' :
                (indicators?.cbs_score || 0) >= 60 ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {indicators?.cbs_score || '-'}
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  (indicators?.cbs_score || 0) >= 80 ? 'bg-green-500' :
                  (indicators?.cbs_score || 0) >= 60 ? 'bg-blue-500' : 'bg-gray-400'
                }`}
                style={{ width: `${indicators?.cbs_score || 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {trend && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">五線譜趨勢分析</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-gray-500 text-sm">當前價格</div>
              <div className="text-lg font-semibold">{trend.current_price?.toFixed(2) || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">趨勢線</div>
              <div className="text-lg">{trend.trend_line?.toFixed(2) || '-'}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm">位置</div>
              <span className={`px-2 py-1 rounded text-sm ${
                trend.position === '-2SD' ? 'bg-green-100 text-green-700' :
                trend.position === '-1SD' ? 'bg-blue-100 text-blue-700' :
                trend.position === '+1SD' ? 'bg-yellow-100 text-yellow-700' :
                trend.position === '+2SD' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {trend.position || '-'}
              </span>
            </div>
            <div>
              <div className="text-gray-500 text-sm">R²</div>
              <div className="text-lg">{trend.r_squared?.toFixed(4) || '-'}</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <div className="text-sm text-gray-600">
              <p><strong>+2SD (樂觀點):</strong> {trend.sd_plus_2?.toFixed(2) || '-'}</p>
              <p><strong>+1SD (相對樂觀):</strong> {trend.sd_plus_1?.toFixed(2) || '-'}</p>
              <p><strong>TL (趨勢線):</strong> {trend.trend_line?.toFixed(2) || '-'}</p>
              <p><strong>-1SD (相對悲觀):</strong> {trend.sd_minus_1?.toFixed(2) || '-'}</p>
              <p><strong>-2SD (悲觀點):</strong> {trend.sd_minus_2?.toFixed(2) || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
