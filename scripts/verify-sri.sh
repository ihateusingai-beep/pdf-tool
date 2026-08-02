#!/bin/bash
# v3.0.7.1: Generate real SRI (subresource integrity) hash for 9 CDN libraries.
# 將輸出嘅 integrity="sha384-..." 抄入 index.html <script> tag。
#
# 用法: bash scripts/verify-sri.sh
# 期望 output: 9 行,每行格式 "sha384-...  https://cdn..."
# 然後 user 抄 hash 落對應 <script integrity="..."> attribute
#
# Re-run after 任何 CDN library version 升級。
# Hash 算法: cat FILE | openssl dgst -sha384 -binary | openssl base64 -A

set -e

# 9 個 CDN library URLs (同 index.html 一對一)
URLS=(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/Sortable/1.15.0/Sortable.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.5.1/mammoth.browser.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"
    "https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js"
    "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js"
)

# 2 個 SRI-incompatible (skip)
SKIP_URLS=(
    "https://cdn.tailwindcss.com"  # JIT dynamic build
)

echo "📋 Generating SRI hashes (sha384) for 9 CDN libraries..."
echo "Copy 下面 output 嘅 integrity=\"sha384-...\" 落 index.html 對應 <script> tag"
echo ""

for url in "${URLS[@]}"; do
    hash=$(curl -sSL "$url" | openssl dgst -sha384 -binary | openssl base64 -A)
    if [ -n "$hash" ]; then
        echo "sha384-$hash  $url"
    else
        echo "❌ FAILED: $url"
    fi
done

echo ""
echo "⏭️  Skipped (SRI-incompatible):"
for url in "${SKIP_URLS[@]}"; do
    echo "   $url  ←  dynamic build, omit integrity"
done

echo ""
echo "📌 Edit index.html — 對 7 個 <script> tag 加 integrity=\"sha384-...\" attribute"
echo "   Tailwind + fontkit 維持無 integrity"
echo ""
echo "Verify integrity with: openssl dgst -sha384 -binary FILE | openssl base64 -A"
