# Paramètres de connexion
$dbhost = "localhost"
$port = "5432"
$user = "postgres"
$db   = "ciq_website"  # <-- modifie ici
$env:PGPASSWORD = "thalarju04"
$outputFile = "structure.txt"
$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

# En-tête dans le fichier
"STRUCTURE DE LA BASE DE DONNEES" | Out-File $outputFile -Encoding utf8

# Récupération des noms de tables
$tables = & "$psql" -h $dbhost -p $port -U $user -d $db -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;"

foreach ($table in $tables) {
    $table = $table.Trim()
    if ($table -ne "") {
        "`nTABLE: $table" | Out-File $outputFile -Append -Encoding utf8
       & "$psql" -h $dbhost -p $port -U $user -d $db -c "\d $table" | Out-File $outputFile -Append -Encoding utf8
        "`n" | Out-File $outputFile -Append -Encoding utf8
    }
}

Write-Host "Structure exportee dans $outputFile"
