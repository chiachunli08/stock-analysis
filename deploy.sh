#!/bin/bash
set -e

echo "========================================"
echo "台股財報分析系統 - 部署腳本"
echo "========================================"

if [ ! -f .env ]; then
    echo "錯誤: .env 檔案不存在"
    echo "請複製 .env.example 為 .env 並填寫設定值"
    exit 1
fi

echo "[1/5] 檢查 Docker..."
if ! command -v docker &> /dev/null; then
    echo "錯誤: Docker 未安裝"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "錯誤: Docker Compose 未安裝"
    exit 1
fi

echo "[2/5] 停止現有容器..."
docker compose down 2>/dev/null || true

echo "[3/5] 建置映像檔..."
docker compose build --no-cache

echo "[4/5] 啟動服務..."
docker compose up -d

echo "[5/5] 等待服務啟動..."
sleep 10

echo "檢查服務狀態..."
docker compose ps

echo ""
echo "========================================"
echo "部署完成!"
echo "========================================"
echo ""
echo "服務位址:"
echo "  - 前端: http://localhost"
echo "  - 後端 API: http://localhost/api"
echo ""
echo "首次使用請執行:"
echo "  docker compose exec crawler python -c \"from tasks.stock_list import update_stock_list; update_stock_list()\""
echo ""
echo "查看日誌:"
echo "  docker compose logs -f"
echo ""
