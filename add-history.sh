#!/bin/bash

# Add IntelToolHistory to Deep Search
sed -i '/Ready to search/,/^\s*<\/div>$/c\        {/* History */}\n        <IntelToolHistory toolName="deep-search" />' src/app/tools/deep-search/page.tsx

# Add IntelToolHistory to Dark Search  
sed -i '/Ready to search/,/^\s*<\/div>$/c\        {/* History */}\n        <IntelToolHistory toolName="dark-search" />' src/app/tools/dark-search/page.tsx

# Add IntelToolHistory to L3D
sed -i '/Ready to search/,/^\s*<\/div>$/c\        {/* History */}\n        <IntelToolHistory toolName="l3d" />' src/app/tools/l3d/page.tsx

echo "Done"
