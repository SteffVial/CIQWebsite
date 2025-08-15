function Get-Tree {
    param (
        [string]$Path = ".",
        [int]$Indent = 0
    )

    $prefix = "|" + ("----" * $Indent)

    # Dossiers (sauf node_modules)
    Get-ChildItem -Path $Path -Directory -Force | Where-Object { $_.Name -ne "node_modules" } | ForEach-Object {
        "$prefix$($_.Name)" | Out-File -Append frontendStructure.txt
        Get-Tree -Path $_.FullName -Indent ($Indent + 1)
    }

    # Fichiers
    Get-ChildItem -Path $Path -File -Force | ForEach-Object {
        "$prefix$($_.Name)" | Out-File -Append frontendStructure.txt
    }
}

# Nettoyer l'ancien fichier
Remove-Item frontendStructure.txt -ErrorAction SilentlyContinue

# Ajouter un titre en haut du fichier
"-----frontend-----" | Out-File -FilePath frontendStructure.txt

# Lancer l'analyse sur le dossier voulu
Get-Tree -Path "C:\VSCODE\CIQWebsite\frontend"
