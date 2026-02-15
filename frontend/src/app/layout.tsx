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
    <html lang="zh-TW">
      <body className="antialiased">
        <nav className="bg-primary-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <a href="/" className="text-xl font-bold">台股財報分析</a>
              <div className="flex space-x-4">
                <a href="/" className="hover:bg-primary-700 px-3 py-2 rounded">首頁</a>
                <a href="/screener" className="hover:bg-primary-700 px-3 py-2 rounded">股票篩選</a>
                <a href="/stocks" className="hover:bg-primary-700 px-3 py-2 rounded">股票列表</a>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
