const fs = require('fs');
const path = require('path');

const logoPath = path.resolve(process.cwd(), 'public', 'logo.png');
console.log('\n📁 Logo path:', logoPath);
console.log('✅ Exists:', fs.existsSync(logoPath));

if (fs.existsSync(logoPath)) {
  const stats = fs.statSync(logoPath);
  console.log('📊 Size:', stats.size, 'bytes');
  
  const buffer = fs.readFileSync(logoPath);
  const base64 = buffer.toString('base64');
  console.log('🔢 Base64 length:', base64.length, 'chars');
  console.log('🔍 First 100 chars:', base64.substring(0, 100));
  console.log('\n✅ Logo can be converted to base64 successfully!');
  console.log('\n🖼️  Data URL preview:');
  console.log(`data:image/png;base64,${base64.substring(0, 80)}...`);
} else {
  console.log('\n❌ Logo file NOT FOUND!');
}
