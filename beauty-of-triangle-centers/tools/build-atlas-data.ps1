param(
  [Parameter(Mandatory = $true)]
  [string]$CsvPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"
$culture = [Globalization.CultureInfo]::InvariantCulture

$headers = @(
  "DiagramID", "Center", "Unused1", "Unused2", "Map", "FittedTasteScore",
  "OrbitStatus", "InterestingnessStatus", "InterestingnessScore",
  "InterestingnessMethod", "NeuralInterestingnessStatus",
  "NeuralLearningProgressScore", "RawValidationLossProgress",
  "CompletedTrainingRounds", "NeuralElapsedSeconds",
  "FixedCompressorInterestingnessScore", "CoherenceProgressBytes",
  "ComplexityGate", "SpatialComplexityRatio", "QuadtreeCodeBits",
  "QuadtreeBitsPerPaddedPixel", "QuadtreeRelativeToRandom", "PNGByteLength",
  "PNGBytesPerRasterPixel", "PNGRelativeToRandom",
  "MaximumReferenceSimilarity", "ExactOrNearDuplicate", "ElapsedSeconds",
  "CheckpointPath", "InterestingnessRank"
)

function Convert-ToDouble([string]$value) {
  return [double]::Parse($value, $culture)
}

$rows = @(
  Get-Content -LiteralPath $CsvPath |
    Select-Object -Skip 1 |
    ConvertFrom-Csv -Header $headers
)

$validRows = @(
  $rows | Where-Object {
    $_.OrbitStatus -eq "OK" -and
    $_.InterestingnessStatus -eq "OK" -and
    $_.NeuralInterestingnessStatus -eq "OK" -and
    -not [string]::IsNullOrWhiteSpace($_.InterestingnessScore)
  }
)

foreach ($row in $validRows) {
  $q = Convert-ToDouble $row.QuadtreeRelativeToRandom
  $row | Add-Member -NotePropertyName QuadtreeGate -NotePropertyValue (4.0 * $q * (1.0 - $q))
}

$interestingnessRows = @(
  $validRows |
    Sort-Object @{ Expression = { [int]$_.InterestingnessRank }; Ascending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true } |
    Select-Object -First 120
)

$quadtreeRows = @(
  $validRows |
    Sort-Object @{ Expression = { $_.QuadtreeGate }; Descending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true } |
    Select-Object -First 120
)

$allQuadtreeRows = @(
  $validRows |
    Sort-Object @{ Expression = { $_.QuadtreeGate }; Descending = $true },
                @{ Expression = { $_.DiagramID }; Ascending = $true }
)

$quadtreeRanks = @{}
for ($index = 0; $index -lt $allQuadtreeRows.Count; $index++) {
  $quadtreeRanks[$allQuadtreeRows[$index].DiagramID] = $index + 1
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
    quadtreeRank = [int]$quadtreeRanks[$row.DiagramID]
    interestingnessScore = Convert-ToDouble $row.InterestingnessScore
    quadtreeGate = [double]$row.QuadtreeGate
    quadtreeRelativeToRandom = Convert-ToDouble $row.QuadtreeRelativeToRandom
    pngRelativeToRandom = Convert-ToDouble $row.PNGRelativeToRandom
    fittedTaste = Convert-ToDouble $row.FittedTasteScore
    referenceSimilarity = Convert-ToDouble $row.MaximumReferenceSimilarity
    exactOrNearDuplicate = ($row.ExactOrNearDuplicate -eq "TRUE")
  }
}

$pairs = for ($rank = 1; $rank -le 120; $rank++) {
  [ordered]@{
    rank = $rank
    interestingness = Convert-ToDiagram $interestingnessRows[$rank - 1]
    quadtree = Convert-ToDiagram $quadtreeRows[$rank - 1]
  }
}

$output = [ordered]@{
  title = "Beauty of Triangle Centers"
  generatedFrom = [IO.Path]::GetFileName($CsvPath)
  candidateMaps = 145614
  selectedDiagrams = 1847
  rankingPopulation = $validRows.Count
  rankCount = 120
  display = [ordered]@{
    retainedPoints = 50000
    discardedPoints = 4000
    anglePermutations = 6
    rasterWidth = 6667
    rasterHeight = 5779
  }
  scoring = [ordered]@{
    analysisPoints = 20000
    quadtreeGateDefinition = "4q(1-q), where q is quadtree compression relative to an equal-density random image"
  }
  pairs = $pairs
}

$directory = Split-Path -Parent $OutputPath
if (-not (Test-Path -LiteralPath $directory)) {
  New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

$output | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding utf8
Write-Host "Wrote $($pairs.Count) rank pairs to $OutputPath"
Write-Host "Ranking population: $($validRows.Count)"
