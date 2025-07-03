#!/bin/bash

# 定義等待資料庫準備的函數
function wait_for_db() {
  while ! python manage.py sqlflush > /dev/null 2>&1; do
    echo "Waiting for the database to be ready..."
    sleep 1
  done
  echo "Database is ready!"
}

# 等待資料庫啟動完成
wait_for_db

# 執行資料庫遷移
echo "Running database migrations..."
python manage.py migrate --noinput

# 收集靜態文件
echo "Collecting static files..."
python manage.py collectstatic --noinput

# 建立超級用戶 (初始需要的管理者權限，此步驟為optionals）
echo "Creating superuser..."
python manage.py shell -c "from django.contrib.auth import get_user_model; \
User = get_user_model()
if not User.objects.filter(email='admin@compal.com').exists(): \
    User.objects.create_superuser('admin@compal.com', '21222725')"

# 啟動 Daphne
echo "Starting Daphne..."
exec daphne tx_nre.asgi:application -b 0.0.0.0 -p 80  