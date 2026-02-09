# --- 設定區 ---
$ServerUser = "your_ssh_user"           # Server 的帳號
$ServerIP = "192.168.x.x"               # Server 的內網 IP
$RemoteBackupPath = "/backups/nre_debug.dump" # Server 上的備份路徑 (對應 Docker 的 volume)
$LocalPath = "$PSScriptRoot\nre_backup_$(Get-Date -Format 'yyyyMMdd').dump"

Write-Host "--- 步驟 1: 正在遠端執行資料庫備份 ---" -ForegroundColor Cyan
# 透過 SSH 叫 Docker 執行 pg_dump
ssh "$ServerUser@$ServerIP" "docker exec -t nre_postgres pg_dump -U nre -d nre -F c -f /backups/nre_debug.dump"

if ($LASTEXITCODE -eq 0) {
    Write-Host "備份成功！" -ForegroundColor Green
} else {
    Write-Host "備份失敗，請檢查網路或密碼。" -ForegroundColor Red
    pause
    exit
}

Write-Host "--- 步驟 2: 正在從 Server 下載備份檔 ---" -ForegroundColor Cyan
# 使用 scp 將檔案抓回來
scp "$ServerUser@$ServerIP`:$RemoteBackupPath" "$LocalPath"

if (Test-Path $LocalPath) {
    Write-Host "--- 完成！ ---" -ForegroundColor Green
    Write-Host "檔案已存放在: $LocalPath"
    explorer.exe /select,$LocalPath
} else {
    Write-Host "檔案下載失敗。" -ForegroundColor Red
}

pause