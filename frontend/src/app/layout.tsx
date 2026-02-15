import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '台股財報分析系統',
  description: '台股財報分析與篩選平台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW" className="dark">
      <body className="antialiased bg-[#0f0f0f] min-h-screen">
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <a href="/" className="text-xl font-bold text-cyan-400">台股財報分析</a>
              <div className="flex space-x-1">
                <a href="/" className="hover:bg-gray-800 px-3 py-2 rounded text-gray-300 hover:text-white transition-colors">首頁</a>
                <a href="/screener" className="hover:bg-gray-800 px-3 py-2 rounded text-gray-300 hover:text-white transition-colors">股票篩選</a>
                <a href="/stocks" className="hover:bg-gray-800 px-3 py-2 rounded text-gray-300 hover:text-white transition-colors">股票列表</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-500 text-sm">
          台股財報分析系統 © {new Date().getFullYear()} | 數據來源：台灣證交所
        </footer>
      </body>
    </html>
  );
}
