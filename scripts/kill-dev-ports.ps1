$ports = @(3001, 3002)

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    Write-Host "Port $port is free"
    continue
  }

  $connections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
    Write-Host "Killing PID $_ on port $port"
    Stop-Process -Id $_ -Force
  }
}
