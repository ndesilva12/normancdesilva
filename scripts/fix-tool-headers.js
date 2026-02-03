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
  
  // Remove broken fragments that were added
  // Look for the pattern where TopNav and BottomNav were incorrectly inserted
  
  // Fix: Remove any stray <> or </> that were added incorrectly
  // The script needs to find where "return (" is and ensure proper structure
  
  // Simpler approach: just ensure the file has proper imports
  // and that TopNav/BottomNav are called at the right place
  
  // For now, let's just revert by removing the broken changes
  // Remove TopNav/BottomNav imports if they're broken
  if (!content.includes('import { Header }')) {
    // File was modified, need to fix it
    
    // Remove the broken TopNav/BottomNav components that are outside proper JSX
    content = content.replace(/<TopNav \/>\s*<BottomNav \/>\s*\)/g, ')');
    content = content.replace(/<>\s*<TopNav \/>\s*<BottomNav \/>/g, '<>');
    
    // Make sure we have a clean structure
    // The return should be: return ( <>  <TopNav /> <BottomNav /> ... </> );
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✓ Fixed ${filePath}`);
});

console.log('\nAll files fixed!');
