#!/bin/bash
# Деплой на VPS. Запускать от пользователя с sudo.
# Первый запуск: bash deploy/deploy.sh --first-run
set -e

APP_DIR=/var/www/velcode
FIRST_RUN=${1:-""}

cd "$APP_DIR"

echo "=== Pull ==="
git pull origin master

echo "=== Backend: зависимости ==="
venv/bin/pip install -r requirements.txt -q

echo "=== Backend: миграции ==="
venv/bin/alembic upgrade head

echo "=== Frontend: зависимости ==="
cd frontend
npm ci
echo "=== Frontend: сборка ==="
NODE_OPTIONS='--max-old-space-size=1536' npm run build

# standalone-сервер требует статику рядом с собой
cp -r .next/static .next/standalone/.next/static
cp -r public  .next/standalone/public 2>/dev/null || true
# favicon из app/ — Next.js кладёт его в .next/server, копируем в public
cp app/favicon.ico .next/standalone/public/favicon.ico 2>/dev/null || true
cd ..

if [ "$FIRST_RUN" = "--first-run" ]; then
    echo "=== Первый запуск: установка сервисов ==="
    sudo cp deploy/velcode-backend.service  /etc/systemd/system/
    sudo cp deploy/velcode-frontend.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable velcode-backend velcode-frontend
fi

echo "=== Права на директорию ==="
sudo chown -R www-data:www-data "$APP_DIR"

echo "=== Перезапуск сервисов ==="
sudo systemctl restart velcode-backend
sudo systemctl restart velcode-frontend

echo ""
echo "=== Готово ==="
sudo systemctl status velcode-backend  --no-pager -l
sudo systemctl status velcode-frontend --no-pager -l
