#!/bin/bash

echo "🚀 Resetowanie repozytorium Git i nadpisywanie kodu..."

# 1. Przełącz się na nową, czystą gałąź
git checkout --orphan new_branch

# 2. Dodaj wszystkie pliki do nowego commita
git add .
git commit -m "Całkowite nadpisanie kodu"

# 3. Usuń starą gałąź i zamień ją na nową
git branch -D main
git branch -m main

# 4. Wypchnij zmiany na zdalne repozytorium (NADPISANIE WSZYSTKIEGO!)
git push -f origin main

echo "✅ Repozytorium zostało całkowicie nadpisane!"
