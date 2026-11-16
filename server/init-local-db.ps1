$ErrorActionPreference = 'Stop'

$postgresBin = Join-Path $env:ProgramFiles 'PostgreSQL\17\bin'
$initdb = Join-Path $postgresBin 'initdb.exe'
$pgCtl = Join-Path $postgresBin 'pg_ctl.exe'
$createdb = Join-Path $postgresBin 'createdb.exe'
$pgIsReady = Join-Path $postgresBin 'pg_isready.exe'
$psql = Join-Path $postgresBin 'psql.exe'
$dataDirectory = Join-Path $env:LOCALAPPDATA 'AcademicNexus\postgres-data'
$logFile = Join-Path $env:LOCALAPPDATA 'AcademicNexus\postgres.log'
$environmentFile = Join-Path $PSScriptRoot '..\.env'

function Set-DatabaseConnectionString([string]$Password) {
  $connection = "DATABASE_URL=postgresql://nexus:$Password@127.0.0.1:5433/academic_nexus"
  if (Test-Path $environmentFile) {
    $lines = @(Get-Content -LiteralPath $environmentFile)
    $found = $false
    for ($index = 0; $index -lt $lines.Count; $index++) {
      if ($lines[$index] -match '^DATABASE_URL=') {
        $lines[$index] = $connection
        $found = $true
      }
    }
    if (-not $found) {
      $lines += $connection
    }
  } else {
    $lines = @($connection, 'API_PORT=3001')
  }
  [System.IO.File]::WriteAllLines($environmentFile, $lines, [System.Text.UTF8Encoding]::new($false))
}

function Set-EnvironmentValue([string]$Name, [string]$Value) {
  $lines = if (Test-Path $environmentFile) { @(Get-Content -LiteralPath $environmentFile) } else { @() }
  $found = $false
  for ($index = 0; $index -lt $lines.Count; $index++) {
    if ($lines[$index] -match "^$Name=") {
      $lines[$index] = "$Name=$Value"
      $found = $true
    }
  }
  if (-not $found) {
    $lines += "$Name=$Value"
  }
  [System.IO.File]::WriteAllLines($environmentFile, $lines, [System.Text.UTF8Encoding]::new($false))
}

function New-Secret([int]$ByteCount) {
  $bytes = New-Object byte[] $ByteCount
  [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
  return [Convert]::ToBase64String($bytes).Replace('+', 'x').Replace('/', 'y').TrimEnd('=')
}

if (-not (Test-Path $initdb)) {
  throw "PostgreSQL 17 command-line tools were not found at $postgresBin."
}

$existingCluster = Test-Path (Join-Path $dataDirectory 'PG_VERSION')
$databasePassword = $null
if ($existingCluster) {
  if (-not (Test-Path $environmentFile)) {
    throw "A local database already exists at $dataDirectory but .env is missing. Restore its connection details before starting another cluster."
  }
  $connectionLine = Get-Content -LiteralPath $environmentFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
  if (-not $connectionLine) {
    throw 'DATABASE_URL is missing from .env.'
  }
  $databasePassword = ($connectionLine -replace '^DATABASE_URL=postgresql://nexus:', '') -replace '@127\.0\.0\.1:5433/academic_nexus$', ''
  if (-not $databasePassword -or $databasePassword -eq $connectionLine) {
    throw 'DATABASE_URL in .env does not match the local Academic Nexus PostgreSQL connection.'
  }
} else {
  if (Test-Path $dataDirectory) {
    $existingFiles = Get-ChildItem -LiteralPath $dataDirectory -Force
    if ($existingFiles.Count -gt 0) {
      throw "The local database directory $dataDirectory is not empty but is not an initialized PostgreSQL cluster. It was left unchanged."
    }
  } else {
    New-Item -ItemType Directory -Path $dataDirectory -Force | Out-Null
  }

  $databasePassword = New-Secret 32
  Set-DatabaseConnectionString $databasePassword
  $passwordFile = [System.IO.Path]::GetTempFileName()
  try {
    [System.IO.File]::WriteAllText($passwordFile, $databasePassword)
    & $initdb -D $dataDirectory -U nexus --pwfile=$passwordFile --auth=scram-sha-256 --encoding=UTF8
    if ($LASTEXITCODE -ne 0) {
      throw 'PostgreSQL could not initialize the local Academic Nexus cluster.'
    }
  } finally {
    Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
  }
}

$environmentLines = if (Test-Path $environmentFile) { @(Get-Content -LiteralPath $environmentFile) } else { @() }
if (-not ($environmentLines | Where-Object { $_ -match '^DEMO_PASSWORD=.{16,}$' })) {
  Set-EnvironmentValue 'DEMO_PASSWORD' (New-Secret 32)
  Write-Output 'Generated the shared demo password in the ignored .env file.'
}
if (-not ($environmentLines | Where-Object { $_ -match '^SESSION_SECRET=.{32,}$' })) {
  Set-EnvironmentValue 'SESSION_SECRET' (New-Secret 48)
}

& $pgCtl status -D $dataDirectory *> $null
if ($LASTEXITCODE -ne 0) {
  & $pgCtl start -D $dataDirectory -o '-h 127.0.0.1 -p 5433' -l $logFile -w
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL could not start. Check the local log at $logFile."
  }
}

$env:PGPASSWORD = $databasePassword
& $pgIsReady -h 127.0.0.1 -p 5433 -U nexus
if ($LASTEXITCODE -ne 0) {
  throw 'The local Academic Nexus PostgreSQL cluster is not accepting connections.'
}

$databaseExists = & $psql -h 127.0.0.1 -p 5433 -U nexus -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='academic_nexus'"
if ($LASTEXITCODE -ne 0) {
  throw 'Could not query the local PostgreSQL databases.'
}
if (($databaseExists -join '').Trim() -ne '1') {
  & $createdb -h 127.0.0.1 -p 5433 -U nexus -O nexus academic_nexus
  if ($LASTEXITCODE -ne 0) {
    throw 'PostgreSQL could not create the Academic Nexus database.'
  }
}

& $psql -h 127.0.0.1 -p 5433 -U nexus -d academic_nexus -tAc 'SELECT current_user || ''@'' || current_database()'
if ($LASTEXITCODE -ne 0) {
  throw 'The local Academic Nexus database connection could not be verified.'
}

$env:PGPASSWORD = $null
Write-Output 'Academic Nexus PostgreSQL is ready on 127.0.0.1:5433.'
