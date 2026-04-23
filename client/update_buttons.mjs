import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // A regex to match <button ... className="..."> or <Link ... className="...">
  // and replace rounded-(sm|md|lg|xl|2xl|3xl|full) with rounded-none
  // We'll just do a global replace of bounded rounded classes but ONLY inside className="" of <button> or <Link>
  
  let modified = content;
  
  // Quick and dirty way: match <button ...> and <Link ...>
  modified = modified.replace(/<(button|Link)[^>]*className=(["'{][^"'}]+["'}])[^>]*>/g, (match) => {
    return match.replace(/rounded-(?:sm|md|lg|xl|2xl|3xl|full)/g, 'rounded-none');
  });

  if (content !== modified) {
    fs.writeFileSync(filePath, modified);
    console.log(`Updated ${filePath}`);
  }
});
