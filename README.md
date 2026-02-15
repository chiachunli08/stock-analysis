# 台股財報分析系統

基於財報說指標體系的台股財報分析與篩選平台。

## 功能特色

- **股票篩選**: 多條件篩選 (ROE, 本益比, F-Score 等)
- **財報分析**: 杜邦分析、獲利能力、償債能力指標
- **排雷偵測**: 5 維度排雷指標自動偵測
- **五線譜分析**: 統計學方法判斷買賣時機
- **CBS 財報分數**: 25 宮格評分系統

## 系統需求

- Ubuntu 22.04 (或其他 Linux 發行版)
- Docker & Docker Compose
- 2 核 CPU / 4 GB RAM / 32 GB 硬碟 (最低)
- 4 核 CPU / 8 GB RAM / 64 GB 硬碟 (建議)

## 快速部署

### 步驟 1: 在 PVE 建立 Ubuntu VM

```bash
# 下載 Ubuntu 22.04 Cloud Image
# 或使用 ISO 安裝

# 建議 VM 配置:
# - CPU: 4 核心
# - RAM: 8 GB
# - Disk: 64 GB
# - Network: 橋接模式
```

### 步驟 2: SSH 連線到 VM

```bash
ssh user@<vm-ip>
```

### 步驟 3: 安裝 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# 重新登入讓群組生效
```

### 步驟 4: 複製專案

```bash
git clone <your-repo-url> stock-analysis
cd stock-analysis
```

### 步驟 5: 設定環境變數

```bash
cp .env.example .env
nano .env
```

編輯 `.env` 檔案:

```env
# 資料庫密碼 (請更改)
DB_PASSWORD=your_secure_password_here

# Cloudflare Tunnel Token (見下方說明)
CLOUDFLARE_TUNNEL_TOKEN=your_tunnel_token_here

# API URL (生產環境請更改)
API_URL=http://localhost:3001
CORS_ORIGINS=http://localhost:3000,https://stock.yourdomain.com
```

### 步驟 6: 執行部署腳本

```bash
chmod +x deploy.sh
./deploy.sh
```

### 步驟 7: 初始化資料

```bash
# 更新股票列表
docker compose exec crawler python -c "from tasks.stock_list import update_stock_list; update_stock_list()"

# 抓取股價 (首次執行會較久)
docker compose exec crawler python -c "from tasks.stock_price import fetch_all_daily_prices; fetch_all_daily_prices()"

# 計算指標
docker compose exec crawler python -c "from tasks.indicators import calculate_all; calculate_all()"
```

## Cloudflare Tunnel 設定

### 步驟 1: 登入 Cloudflare Zero Trust

前往 https://one.dash.cloudflare.com/

### 步驟 2: 建立 Tunnel

1. 點擊 **Networks** > **Tunnels**
2. 點擊 **Create a tunnel**
3. 選擇 **Cloudflared**
4. 輸入 Tunnel 名稱 (如: `stock-analysis`)
5. 點擊 **Save tunnel**

### 步驟 3: 設定 Public Hostname

在 **Public Hostname** 頁面:

| 欄位 | 值 |
|------|-----|
| Subdomain | stock (或您想要的子網域) |
| Domain | yourdomain.com |
| Path | (留空) |
| Type | HTTP |
| URL | caddy:80 |

### 步驟 4: 複製 Token

複製顯示的 Tunnel Token，貼到 `.env` 檔案的 `CLOUDFLARE_TUNNEL_TOKEN` 欄位。

### 步驟 5: 重啟服務

```bash
docker compose down
docker compose up -d
```

完成後，您可以透過 `https://stock.yourdomain.com` 存取系統。

## 目錄結構

```
stock-analysis/
├── docker-compose.yml      # Docker Compose 配置
├── .env.example            # 環境變數範本
├── deploy.sh               # 部署腳本
├── backend/                # FastAPI 後端
│   ├── app/
│   │   ├── api/           # API 路由
│   │   ├── models/        # 資料模型
│   │   ├── services/      # 業務邏輯
│   │   └── core/          # 核心配置
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/               # Next.js 前端
│   ├── src/
│   │   ├── app/           # 頁面元件
│   │   ├── lib/           # 工具函數
│   │   └── types/         # TypeScript 類型
│   ├── Dockerfile
│   └── package.json
├── crawler/                # 爬蟲模組
│   ├── tasks/             # Celery 任務
│   ├── Dockerfile
│   └── requirements.txt
└── infra/                  # 基礎設施配置
    ├── postgres/          # PostgreSQL 初始化
    └── caddy/             # Caddy 配置
```

## 定時任務

系統會自動執行以下定時任務:

| 任務 | 時間 | 說明 |
|------|------|------|
| 每日股價更新 | 18:30 | 台股收盤後抓取股價 |
| 財報更新 | 週六 02:00 | 每季財報公布後更新 |
| 指標計算 | 03:00 | 計算所有財務指標 |
| 趨勢分析 | 04:00 | 更新五線譜分析 |

## 指標說明

### 杜邦分析

- **ROE** = 淨利率 × 總資產周轉率 × 權益乘數
- **淨利率** = 淨利 / 營業收入
- **總資產周轉率** = 營業收入 / 總資產
- **權益乘數** = 總資產 / 股東權益

### 排雷指標

1. **還債能力**: 流動比率 < 100% 且 速動比率 < 100% 且 利息保障倍數 < 5
2. **商譽比率**: 商譽 / 總資產 > 5%
3. **現金比率**: 現金 / 流動負債 < 10%
4. **槓桿倍數**: 權益乘數 > 產業中位數 × 1.3
5. **短期負債**: 短期負債 / 現金 > 70% 且 短期負債 / EV > 40%

### F-Score (Piotroski)

9 項評分標準，每項通過得 1 分:
- 獲利為正
- 營業現金流為正
- ROA 年增
- 營業現金流 > 淨利
- 負債比率下降
- 流動比率上升
- 股本無稀釋
- 毛利率上升
- 資產周轉率上升

### CBS 財報分數

基於 25 個指標的綜合評分 (0-100):
- ROE ≥ 20%: +20 分
- 毛利率 ≥ 40%: +15 分
- 流動比率 ≥ 2: +10 分
- 速動比率 ≥ 1: +10 分
- 負債比率 ≤ 30%: +15 分
- 現金比率 ≥ 20%: +10 分
- F-Score: 每分 +2 分

### 五線譜

基於 3.5 年股價數據計算:
- **+2SD**: 過熱區 (賣出訊號)
- **+1SD**: 相對樂觀區
- **TL**: 趨勢線 (合理價)
- **-1SD**: 相對悲觀區
- **-2SD**: 低估區 (買入訊號)

## 維護操作

### 查看日誌

```bash
# 所有服務
docker compose logs -f

# 特定服務
docker compose logs -f backend
docker compose logs -f crawler
```

### 備份資料庫

```bash
docker compose exec postgres pg_dump -U stock stock_db > backup_$(date +%Y%m%d).sql
```

### 還原資料庫

```bash
cat backup_20240115.sql | docker compose exec -T postgres psql -U stock stock_db
```

### 更新程式碼

```bash
git pull
docker compose build
docker compose up -d
```

### 重啟服務

```bash
docker compose restart
```

### 停止服務

```bash
docker compose down
```

## 故障排除

### 資料庫連線失敗

```bash
# 檢查資料庫狀態
docker compose exec postgres pg_isready -U stock

# 查看資料庫日誌
docker compose logs postgres
```

### 爬蟲未執行

```bash
# 檢查 Celery 狀態
docker compose exec crawler celery -A tasks inspect active

# 手動觸發任務
docker compose exec crawler python -c "from tasks.stock_price import fetch_all_daily_prices; fetch_all_daily_prices()"
```

### Cloudflare Tunnel 連線問題

```bash
# 檢查 Tunnel 日誌
docker compose logs cloudflared

# 確認 Token 正確
echo $CLOUDFLARE_TUNNEL_TOKEN
```

## 授權

MIT License
