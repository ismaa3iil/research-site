param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$culture = [Globalization.CultureInfo]::InvariantCulture
$rankCount = 120

function Convert-ToDouble([string]$value) {
  return [double]::Parse($value, $culture)
}

$rows = @(
  Import-Csv -LiteralPath $CsvPath |
    Where-Object {
      $_.OrbitStatus -eq "OK" -and
      $_.InterestingnessStatus -eq "OK" -and
      $_.NeuralInterestingnessStatus -eq "OK" -and
      -not [string]::IsNullOrWhiteSpace($_.InterestingnessScore) -and
      -not [string]::IsNullOrWhiteSpace($_.QuadtreeCodeBits) -and
      -not [string]::IsNullOrWhiteSpace($_.QuadtreeRelativeToRandom)
    }
)

foreach ($row in $rows) {
  $q = Convert-ToDouble $row.QuadtreeRelativeToRandom
  Add-Member -InputObject $row -NotePropertyName ModifiedCompressionScore -NotePropertyValue (4.0 * $q * (1.0 - $q))
}

$interestingnessRows = @(
  $rows |
    Sort-Object @{ Expression = { [int]$_.InterestingnessRank }; Ascending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true } |
    Select-Object -First $rankCount
)

$quadtreeRelativeRows = @(
  $rows |
    Sort-Object @{ Expression = { Convert-ToDouble $_.QuadtreeRelativeToRandom }; Ascending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true }
)

$compressibilityRows = @(
  $rows |
    Sort-Object @{ Expression = { [int]$_.QuadtreeCodeBits }; Ascending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true }
)

$modifiedCompressionRows = @(
  $rows |
    Sort-Object @{ Expression = { [double]$_.ModifiedCompressionScore }; Descending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true }
)

$quadtreeRelativeRanks = @{}
$compressibilityRanks = @{}
$compressibilityPositions = @{}
$modifiedCompressionRanks = @{}

for ($index = 0; $index -lt $quadtreeRelativeRows.Count; $index++) {
  $quadtreeRelativeRanks[$quadtreeRelativeRows[$index].DiagramID] = $index + 1
}

$previousBits = $null
$currentBitsRank = 0
for ($index = 0; $index -lt $compressibilityRows.Count; $index++) {
  $bits = [int]$compressibilityRows[$index].QuadtreeCodeBits
  if ($null -eq $previousBits -or $bits -ne $previousBits) {
    $currentBitsRank = $index + 1
    $previousBits = $bits
  }
  $compressibilityRanks[$compressibilityRows[$index].DiagramID] = $currentBitsRank
  $compressibilityPositions[$compressibilityRows[$index].DiagramID] = $index + 1
}

for ($index = 0; $index -lt $modifiedCompressionRows.Count; $index++) {
  $modifiedCompressionRanks[$modifiedCompressionRows[$index].DiagramID] = $index + 1
}

function Convert-ToDiagram([object]$row) {
  $center = [int]$row.Center
  $mapName = if ($row.Map -eq "M1") { "cevian triangle" } else { "pedal triangle" }

  return [ordered]@{
    diagramId = $row.DiagramID
    center = $center
    map = $row.Map
    mapName = $mapName
    definition = "ETC center X($center); $($row.Map) = $mapName; the center is reevaluated at every iteration."
    image = "images/$($row.DiagramID)_50k.png"
    interestingnessRank = [int]$row.InterestingnessRank
    quadtreeRelativeRank = [int]$quadtreeRelativeRanks[$row.DiagramID]
    compressibilityRank = [int]$compressibilityRanks[$row.DiagramID]
    compressibilityPosition = [int]$compressibilityPositions[$row.DiagramID]
    modifiedCompressionRank = [int]$modifiedCompressionRanks[$row.DiagramID]
    interestingnessScore = Convert-ToDouble $row.InterestingnessScore
    quadtreeCodeBits = [int]$row.QuadtreeCodeBits
    quadtreeRelativeToRandom = Convert-ToDouble $row.QuadtreeRelativeToRandom
    modifiedCompressionScore = [double]$row.ModifiedCompressionScore
    pngRelativeToRandom = Convert-ToDouble $row.PNGRelativeToRandom
    fittedTaste = Convert-ToDouble $row.FittedTasteScore
    referenceSimilarity = Convert-ToDouble $row.MaximumReferenceSimilarity
    exactOrNearDuplicate = ($row.ExactOrNearDuplicate -eq "true")
  }
}

$comparisons = for ($rank = 1; $rank -le $rankCount; $rank++) {
  [ordered]@{
    rank = $rank
    interestingness = Convert-ToDiagram $interestingnessRows[$rank - 1]
    compressibility = Convert-ToDiagram $compressibilityRows[$rank - 1]
    modifiedCompression = Convert-ToDiagram $modifiedCompressionRows[$rank - 1]
  }
}

$output = [ordered]@{
  title = "Beauty of Triangle Centers"
  atlasVersion = "three-way-2026-09-27"
  generatedFrom = [IO.Path]::GetFileName($CsvPath)
  candidateMaps = 145614
  selectedDiagrams = 1847
  rankingPopulation = $rows.Count
  rankCount = $rankCount
  display = [ordered]@{
    retainedPoints = 50000
    discardedPoints = 4000
    anglePermutations = 6
    rasterWidth = 6667
    rasterHeight = 5779
  }
  scoring = [ordered]@{
    analysisPoints = 20000
    interestingnessRankingDefinition = "Symmetry-aware neural held-out learning progress, ranked descending"
    compressibilityRankingDefinition = "Raw quadtree code length, ranked ascending; fewer code bits means stronger compression"
    modifiedCompressionRankingDefinition = "The former Wundt gate 4 q (1-q), where q is quadtree code length relative to an equal-density random raster, ranked descending"
  }
  comparisons = $comparisons
}

$directory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$output | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding utf8
Write-Host "Wrote $($comparisons.Count) three-way comparisons to $OutputPath"
Write-Host "Ranking population: $($rows.Count)"
