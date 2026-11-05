# Pulls 5 years of weekly, dividend-adjusted prices (Yahoo Finance) and Swedish rates (Riksbank SWEA API)
# and writes market-data.json for sparplan.html. All prices are converted to SEK.
# Run: powershell -ExecutionPolicy Bypass -File refresh-data.ps1
$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot 'market-data.json'
$ua = @{ 'User-Agent' = 'Mozilla/5.0' }
# The SEC requires a contact email in the User-Agent for automated access. It's kept out of the published code:
# set SEC_CONTACT (a repository secret on GitHub) or put the address in a local .sec-contact file. Empty = skip US insider data.
$secFile = Join-Path $PSScriptRoot '.sec-contact'
$secContact = if ($env:SEC_CONTACT) { $env:SEC_CONTACT } elseif (Test-Path $secFile) { Get-Content $secFile -Raw } else { '' }
$secContact = $secContact -replace '[^\x21-\x7E]', ''  # drop spaces, newlines and invisible marks (a BOM breaks the HTTP header)

# sym, display name, group, type, region of exposure (where the money goes, not where it trades).
# Rule: index funds = one per major region plus world-wide; shares = roughly the 20 largest listed companies
# worldwide (via their US or EU listing); investment companies = the largest listed holding companies.
# Funds trade in EUR because EU rules (PRIIPs/UCITS) generally limit Swedish savers to EU-registered funds.
$list = @(
  @('EUNA.DE','iShares Core Global Aggregate Bond (EUR hedged)','Bond fund','bonds','Global'),
  @('DBZB.DE','Xtrackers Global Government Bond (EUR hedged)','Bond fund','bonds','Global'),
  @('IBCQ.DE','iShares Global Corp Bond (EUR hedged)','Bond fund','bonds','Global'),
  @('IUSU.DE','iShares US Treasury Bond 1-3yr','Bond fund','bonds','US'),
  @('IUSM.DE','iShares US Treasury Bond 7-10yr','Bond fund','bonds','US'),
  @('IS04.DE','iShares US Treasury Bond 20+yr','Bond fund','bonds','US'),
  @('EUNX.DE','iShares US Aggregate Bond','Bond fund','bonds','US'),
  @('IBCD.DE','iShares USD Corp Bond','Bond fund','bonds','US'),
  @('IUS7.DE','iShares J.P. Morgan USD Emerging Markets Bond','Bond fund','bonds','Emerging markets'),
  @('EUNH.DE','iShares Core € Govt Bond','Bond fund','bonds','Europe'),
  @('EUN5.DE','iShares Core € Corp Bond (investment grade)','Bond fund','bonds','Europe'),
  @('XACT-OBLIGATION.ST','XACT Obligation (Swedish govt & covered bonds)','Bond fund','bonds','Sweden'),
  @('VWCE.DE','Vanguard FTSE All-World','Index fund','stocks','Global'),
  @('EUNL.DE','iShares Core MSCI World','Index fund','stocks','Global'),
  @('IUSN.DE','iShares MSCI World Small Cap','Index fund','stocks','Global'),
  @('XDWT.DE','Xtrackers MSCI World Information Technology','Index fund','stocks','Global'),
  @('SXR8.DE','iShares Core S&P 500','Index fund','stocks','US'),
  @('XDEW.DE','Xtrackers S&P 500 Equal Weight','Index fund','stocks','US'),
  @('SXRV.DE','iShares Nasdaq 100','Index fund','stocks','US'),
  @('ZPRR.DE','SPDR Russell 2000 US Small Cap','Index fund','stocks','US'),
  @('EUNK.DE','iShares Core MSCI Europe','Index fund','stocks','Europe'),
  @('IUSZ.DE','iShares Core FTSE 100','Index fund','stocks','UK'),
  @('EUNN.DE','iShares Core MSCI Japan IMI','Index fund','stocks','Japan'),
  @('SXR1.DE','iShares Core MSCI Pacific ex-Japan','Index fund','stocks','Asia-Pacific'),
  @('IS3N.DE','iShares Core MSCI Emerging Markets IMI','Index fund','stocks','Emerging markets'),
  @('QDV5.DE','iShares MSCI India','Index fund','stocks','India'),
  @('XACT-OMXS30.ST','XACT OMXS30 ESG (30 largest Swedish)','Index fund','stocks','Sweden'),
  @('BRK-B','Berkshire Hathaway B','Investment company','stocks','US'),
  @('SFTBY','SoftBank Group','Investment company','stocks','Japan'),
  @('PRX.AS','Prosus','Investment company','stocks','Global'),
  @('INVE-B.ST','Investor B','Investment company','stocks','Sweden'),
  @('NVDA','Nvidia','Single share','stocks','US'),
  @('MSFT','Microsoft','Single share','stocks','US'),
  @('AAPL','Apple','Single share','stocks','US'),
  @('GOOGL','Alphabet A','Single share','stocks','US'),
  @('AMZN','Amazon','Single share','stocks','US'),
  @('META','Meta Platforms','Single share','stocks','US'),
  @('AVGO','Broadcom','Single share','stocks','US'),
  @('TSLA','Tesla','Single share','stocks','US'),
  @('LLY','Eli Lilly','Single share','stocks','US'),
  @('JPM','JPMorgan Chase','Single share','stocks','US'),
  @('WMT','Walmart','Single share','stocks','US'),
  @('V','Visa','Single share','stocks','US'),
  @('ORCL','Oracle','Single share','stocks','US'),
  @('XOM','ExxonMobil','Single share','stocks','US'),
  @('TSM','TSMC','Single share','stocks','Taiwan'),
  @('TCEHY','Tencent','Single share','stocks','China'),
  @('BABA','Alibaba','Single share','stocks','China'),
  @('TM','Toyota','Single share','stocks','Japan'),
  @('NVO','Novo Nordisk','Single share','stocks','Denmark'),
  @('ASML.AS','ASML','Single share','stocks','Netherlands')
)

function Get-Chart($sym) {
  $r = Invoke-RestMethod -Headers $ua "https://query1.finance.yahoo.com/v8/finance/chart/$($sym)?range=5y&interval=1wk&events=div"
  $res = $r.chart.result[0]
  $adj = $res.indicators.adjclose[0].adjclose
  if (-not $adj) { $adj = $res.indicators.quote[0].close }
  $rows = @()
  for ($i = 0; $i -lt $res.timestamp.Count; $i++) {
    if ($null -ne $adj[$i]) {
      $d = [DateTimeOffset]::FromUnixTimeSeconds($res.timestamp[$i]).UtcDateTime
      # key each bar by the Monday of its week so prices from different exchanges line up with the FX rate
      $wk = $d.Date.AddDays(-(([int]$d.DayOfWeek + 6) % 7)).ToString('yyyy-MM-dd')
      $rows += [pscustomobject]@{ wk = $wk; d = $d.ToString('yyyy-MM-dd'); v = [double]$adj[$i] }
    }
  }
  [pscustomobject]@{ meta = $res.meta; rows = $rows }
}
# The Riksbank API allows only a few calls per minute, so wait and retry on HTTP 429
function Get-Riksbank($path) {
  for ($try = 0; $try -lt 5; $try++) {
    try { return Invoke-RestMethod "https://api.riksbank.se/swea/v1/Observations/$path" }
    catch { if ($_.Exception.Response.StatusCode.value__ -ne 429) { throw }; Start-Sleep -Seconds 20 }
  }
  throw "Riksbank API still rate-limited: $path"
}
function Get-Rate($id) { (Get-Riksbank "Latest/$id").value }
# FX from the Riksbank's official daily fixings (Yahoo's FX history has bad ticks).
# Each week gets its last fixing, matching Yahoo's weekly close.
$from = (Get-Date).AddYears(-5).AddDays(-14).ToString('yyyy-MM-dd')
$fx = @{}
foreach ($c in @(@('EUR','SEKEURPMI'),@('USD','SEKUSDPMI'))) {
  $fx[$c[0]] = @{}
  foreach ($o in (Get-Riksbank "$($c[1])/$from")) {
    $d = [datetime]$o.date
    $fx[$c[0]][$d.AddDays(-(([int]$d.DayOfWeek + 6) % 7)).ToString('yyyy-MM-dd')] = [double]$o.value
  }
}

$inst = @()
foreach ($x in $list) {
  try { $c = Get-Chart $x[0] } catch { Write-Warning "skip $($x[0]): $($_.Exception.Message)"; continue }
  $cur = $c.meta.currency
  $d = @(); $p = @()
  foreach ($row in $c.rows) {
    $rate = 1.0
    if ($cur -ne 'SEK') { if (-not $fx[$cur].ContainsKey($row.wk)) { continue }; $rate = $fx[$cur][$row.wk] }
    $d += $row.d; $p += [math]::Round($row.v * $rate, 4)
  }
  $inst += [ordered]@{ sym = $x[0]; name = $x[1]; group = $x[2]; type = $x[3]; region = $x[4]; cur = $cur;
    price = $c.meta.regularMarketPrice; d = $d; p = $p }
  Write-Host "$($x[0]) $($p.Count) weeks"
}

# Insider trades from Finansinspektionen's register, last 30 days: open-market share buys/sells in SEK,
# excluding share-programme grants and revised/cancelled reports. A failure here must not stop the price refresh.
function Get-Insiders {
  $f = (Get-Date).AddDays(-30).ToString('yyyy-MM-dd'); $t = (Get-Date).ToString('yyyy-MM-dd')
  $r = Invoke-WebRequest -UseBasicParsing -Headers $ua "https://marknadssok.fi.se/publiceringsklient/sv-SE/Search/Search?SearchFunctionType=Insyn&Transaktionsdatum.From=$f&Transaktionsdatum.To=$t&button=export&Page=1"
  $txt = [Text.Encoding]::Unicode.GetString($r.RawContentStream.ToArray())  # FI exports UTF-16
  $rows = $txt -split "`r?`n" | Select-Object -Skip 1 | Where-Object { $_ } | ConvertFrom-Csv -Delimiter ';' -Header (1..23 | ForEach-Object { "c$_" })
  $num = { param($s) [double]::Parse(($s -replace '\s','' -replace ',','.'), [Globalization.CultureInfo]::InvariantCulture) }
  $by = @{}
  foreach ($x in $rows) {
    if ($x.c22 -ne 'Aktuell' -or $x.c13 -ne 'Aktie' -or $x.c11 -or $x.c20 -ne 'SEK') { continue }
    $buy = $x.c12 -eq 'Förvärv'; if (-not $buy -and $x.c12 -ne 'Avyttring') { continue }
    $v = (& $num $x.c17) * (& $num $x.c19)
    $co = ($x.c2 -replace '\(publ\)', '' -replace '\b(Aktiebolag|AB)\b', '' -replace '\s+', ' ').Trim()  # FI lists one issuer under several legal names
    if (-not $by.ContainsKey($co)) { $by[$co] = @{ buy = 0.0; sell = 0.0; b = @{}; s = @{} } }
    $e = $by[$co]
    if ($buy) { $e.buy += $v; $e.b[$x.c5] = 1 } else { $e.sell += $v; $e.s[$x.c5] = 1 }
  }
  $list = $by.GetEnumerator() | ForEach-Object { [ordered]@{ co = $_.Key; buy = [math]::Round($_.Value.buy); sell = [math]::Round($_.Value.sell); nb = $_.Value.b.Count; ns = $_.Value.s.Count; net = [math]::Round($_.Value.buy - $_.Value.sell) } }
  [ordered]@{ from = $f; to = $t; trades = @($rows).Count
    buys = @($list | Where-Object { $_.net -gt 0 } | Sort-Object { $_.net } -Descending | Select-Object -First 15)
    sells = @($list | Where-Object { $_.net -lt 0 } | Sort-Object { $_.net } | Select-Object -First 8) }
}
$insiders = $null
try { $insiders = Get-Insiders } catch { Write-Warning "insider data skipped: $($_.Exception.Message)" }

# US insider trades (SEC Form 4) for the tracked US companies, last 30 days. P = open-market purchase, S = open-market sale.
# Foreign companies with US listings (TSMC, Toyota, ...) don't file Form 4, so they are skipped.
function Get-UsInsiders($syms, $usdSek) {
  # product/version (comment) form: PowerShell 7 (used on GitHub) rejects free text with an @ in User-Agent. SEC allows ~10 requests/second.
  $sec = @{ 'User-Agent' = "Sparplan/1.0 (personal research; $secContact)" }
  $cik = @{}; (Invoke-RestMethod -Headers $sec 'https://www.sec.gov/files/company_tickers.json').PSObject.Properties | ForEach-Object { $cik[$_.Value.ticker] = $_.Value.cik_str }
  $since = (Get-Date).AddDays(-30); $filings = 0; $out = @()
  foreach ($s in $syms) {
    if (-not $cik.ContainsKey($s)) { continue }
    $c = $cik[$s]; $r = (Invoke-RestMethod -Headers $sec ('https://data.sec.gov/submissions/CIK{0:D10}.json' -f [int]$c)).filings.recent
    $buy = 0.0; $sell = 0.0; $b = @{}; $sl = @{}
    for ($i = 0; $i -lt $r.form.Count; $i++) {
      if ([datetime]$r.filingDate[$i] -lt $since) { break }  # newest first
      if ($r.form[$i] -ne '4') { continue }
      Start-Sleep -Milliseconds 120
      $url = "https://www.sec.gov/Archives/edgar/data/$c/$($r.accessionNumber[$i] -replace '-','')/$(Split-Path $r.primaryDocument[$i] -Leaf)"
      try { [xml]$x = (Invoke-WebRequest -UseBasicParsing -Headers $sec $url).Content } catch { continue }
      if ([int64]$x.ownershipDocument.issuer.issuerCik -ne [int64]$c) { continue }  # the company itself reporting trades in other companies
      $filings++
      $who = ($x.ownershipDocument.reportingOwner | Select-Object -First 1).reportingOwnerId.rptOwnerName
      foreach ($t in $x.ownershipDocument.nonDerivativeTable.nonDerivativeTransaction) {
        $v = [double]$t.transactionAmounts.transactionShares.value * [double]$t.transactionAmounts.transactionPricePerShare.value * $usdSek
        switch ($t.transactionCoding.transactionCode) { 'P' { $buy += $v; $b[$who] = 1 } 'S' { $sell += $v; $sl[$who] = 1 } }
      }
    }
    $out += [ordered]@{ sym = $s; buy = [math]::Round($buy); sell = [math]::Round($sell); nb = $b.Count; ns = $sl.Count; net = [math]::Round($buy - $sell) }
  }
  [ordered]@{ from = $since.ToString('yyyy-MM-dd'); to = (Get-Date).ToString('yyyy-MM-dd'); filings = $filings; companies = $out }
}
$usInsiders = $null
if ($secContact) { try { $usInsiders = Get-UsInsiders ($list | Where-Object { $_[4] -eq 'US' -and $_[0] -notmatch '\.' } | ForEach-Object { $_[0] }) (Get-Rate 'SEKUSDPMI') }
catch { Write-Warning "US insider data skipped: $($_.Exception.Message)" } }

$from = (Get-Date).AddYears(-5).ToString('yyyy-MM-dd')
$tb = Get-Riksbank "SETB3MBENCH/$from"
$data = [ordered]@{
  generated = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mmZ')
  rates = [ordered]@{
    policy = Get-Rate 'SECBREPOEFF'; tbill3m = Get-Rate 'SETB3MBENCH'
    gov2y = Get-Rate 'SEGVB2YC'; gov5y = Get-Rate 'SEGVB5YC'; gov10y = Get-Rate 'SEGVB10YC'
    tbill5yAvg = [math]::Round(($tb | Measure-Object value -Average).Average, 3)
  }
  instruments = $inst
  insiders = $insiders
  usInsiders = $usInsiders
}
[IO.File]::WriteAllText($out, ($data | ConvertTo-Json -Depth 5 -Compress), (New-Object Text.UTF8Encoding $false))
Write-Host "Wrote $out"
