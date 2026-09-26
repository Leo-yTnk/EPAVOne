import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const src=path.join(root,'src');
const failures=[];

function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const full=path.join(dir,entry.name);
    return entry.isDirectory()?walk(full):[full];
  });
}

const files=walk(src);
for(const file of files){
  const rel=path.relative(root,file).replaceAll('\\','/');
  const text=fs.readFileSync(file,'utf8');

  if(/transition\s*:\s*all\b/.test(text)) failures.push(rel+': transition: all is forbidden');
  if(/!important\b/.test(text)) failures.push(rel+': !important is forbidden');
  if(/\byc-/.test(text)) failures.push(rel+': legacy yc-* prefix is forbidden');
  if(/className=["'][^"']*\bds-card\b/.test(text) && !rel.endsWith('design-system/components/Card.jsx')) failures.push(rel+': use <Card> instead of ds-card directly');

  if(rel.startsWith('src/products/')){
    const product=rel.split('/')[2];
    const importMatches=[...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match=>match[1]);
    for(const spec of importMatches){
      const marker='/products/';
      const pos=spec.indexOf(marker);
      if(pos>=0){
        const imported=spec.slice(pos+marker.length).split('/')[0];
        if(imported && imported!==product) failures.push(rel+': cross-product import from '+imported);
      }
    }
    if(/supabase\b/i.test(text)) failures.push(rel+': product UI must not access Supabase directly');
  }

  const styleMatches=[...text.matchAll(/style=\{\{([\s\S]*?)\}\}/g)];
  for(const match of styleMatches){
    if(!/--[a-z0-9-]+/.test(match[1])) failures.push(rel+': inline style must only pass CSS custom properties');
  }
}

const card=fs.readFileSync(path.join(src,'design-system/components/Card.jsx'),'utf8');
if(!card.includes("'ds-card'") || !card.includes("'ds-stitched-card'")) failures.push('Card.jsx: every Card must be stitched by default');

if(failures.length){
  console.error('Architecture check failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Architecture check passed.');
