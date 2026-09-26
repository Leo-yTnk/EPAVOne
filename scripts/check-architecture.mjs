import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const src=path.join(root,'src');
const failures=[];
const allowedRootJs=new Set(['vite.config.js','eslint.config.js']);

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

function normalize(file){ return path.relative(root,file).replaceAll('\\','/'); }

for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(entry.isFile() && /\.(js|jsx|css)$/.test(entry.name) && !allowedRootJs.has(entry.name)){
    failures.push(entry.name+': application source is forbidden at repository root');
  }
}

const files=walk(src);
for(const file of files){
  const rel=normalize(file);
  const text=fs.readFileSync(file,'utf8');

  if(/transition\s*:\s*all\b/.test(text)) failures.push(rel+': transition: all is forbidden');
  if(/!important\b/.test(text)) failures.push(rel+': !important is forbidden');
  if(/\byc-/.test(text)) failures.push(rel+': legacy yc-* prefix is forbidden');
  if(/className=["'][^"']*\bds-card\b/.test(text) && rel!=='src/design-system/components/Card.jsx'){
    failures.push(rel+': use <Card> instead of ds-card directly');
  }

  if(rel.startsWith('src/products/')){
    const product=rel.split('/')[2];
    const importMatches=[...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match=>match[1]);

    for(const spec of importMatches){
      if(!spec.startsWith('.')) continue;
      const resolved=path.normalize(path.resolve(path.dirname(file),spec));
      const productRoot=path.join(src,'products')+path.sep;
      if(resolved.startsWith(productRoot)){
        const importedProduct=path.relative(path.join(src,'products'),resolved).split(path.sep)[0];
        if(importedProduct && importedProduct!==product){
          failures.push(rel+': cross-product import from '+importedProduct);
        }
      }
    }

    if(rel.endsWith('.jsx') && /\bsupabase\b/i.test(text)){
      failures.push(rel+': product UI must not access Supabase directly');
    }
    if(rel.endsWith('.jsx') && /\bfetch\s*\(/.test(text)){
      failures.push(rel+': product UI must use a service instead of fetch directly');
    }
  }

  if(rel.endsWith('.jsx') && !rel.startsWith('src/dev/')){
    const lines=text.split('\n').length;
    if(lines>250) failures.push(rel+': component/page exceeds 250 lines; split responsibilities');
  }

  const styleMatches=[...text.matchAll(/style=\{\{([\s\S]*?)\}\}/g)];
  for(const match of styleMatches){
    if(!/--[a-z0-9-]+/.test(match[1])) failures.push(rel+': inline style must only pass CSS custom properties');
  }
}

const cardPath=path.join(src,'design-system/components/Card.jsx');
const card=fs.readFileSync(cardPath,'utf8');
if(!card.includes("'ds-card'") || !card.includes("'ds-stitched-card'")){
  failures.push('Card.jsx: every Card must be stitched by default');
}

const dataCss=fs.readFileSync(path.join(src,'design-system/styles/data.css'),'utf8');
if(!/\.ds-card::after/.test(dataCss)){
  failures.push('data.css: stitched treatment must be enforced by the Card surface');
}

if(failures.length){
  console.error('Architecture check failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
process.stdout.write('Architecture check passed.\n');
