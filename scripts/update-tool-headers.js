const fs = require('fs');
const path = require('path');

const files = [
  'src/app/tools/business-info/page.tsx',
  'src/app/tools/calendar/page.tsx',
  'src/app/tools/company-politics/page.tsx',
  'src/app/tools/contact-finder/page.tsx',
  'src/app/tools/contacts/page.tsx',
  'src/app/tools/emails/page.tsx',
  'src/app/tools/files/page.tsx',
  'src/app/tools/image-lookup/page.tsx',
  'src/app/tools/inoreader/page.tsx',
  'src/app/tools/market/page.tsx',
  'src/app/tools/news/page.tsx',
  'src/app/tools/notion-browser/page.tsx',
  'src/app/tools/raindrop/page.tsx',
  'src/app/tools/reading/page.tsx',
  'src/app/tools/spotify/page.tsx',
  'src/app/tools/visual-rosters/page.tsx',
  'src/app/tools/visuals/page.tsx',
];

files.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Replace Header import with TopNav and BottomNav
  content = content.replace(
    /import { Header } from "@\/components\/Header";?/g,
    'import { TopNav } from "@/components/navigation/TopNav";\nimport { BottomNav } from "@/components/navigation/BottomNav";'
  );
  
  // Replace <Header ... /> with <TopNav /> and <BottomNav />
  // Remove the entire <Header> component call
  content = content.replace(
    /<Header[^>]*\/>/g,
    ''
  );
  
  // Add TopNav and BottomNav at the beginning of the return statement
  // Find the return statement and add navigation
  if (!content.includes('<TopNav />')) {
    content = content.replace(
      /return \(/,
      'return (\n    <>\n      <TopNav />\n      <BottomNav />\n      '
    );
    
    // Close the fragment at the end (before the last closing paren and semicolon)
    content = content.replace(
      /(\s+)\);(\s+)$/,
      '$1    </>\n  );$2'
    );
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Updated ${filePath}`);
});

console.log('\nAll files updated!');
