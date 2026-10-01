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

function normalize(file){return path.relative(root,file).replaceAll('\\','/');}

for(const entry of fs.readdirSync(root,{withFileTypes:true})){
  if(entry.isFile()&&/\.(js|jsx|css)$/.test(entry.name)&&!allowedRootJs.has(entry.name)){
    failures.push(entry.name+': application source is forbidden at repository root');
  }
}

const files=walk(src);
for(const file of files){
  const rel=normalize(file);
  const text=fs.readFileSync(file,'utf8');
  const isPageLayer=rel.startsWith('src/products/')||rel.startsWith('src/dev/');

  if(rel.endsWith('.css')&&/\bblur\s*\(/i.test(text)) failures.push(rel+': blur is forbidden; use opacity and transform for motion');
  if(/transition\s*:\s*all\b/.test(text)) failures.push(rel+': transition: all is forbidden');
  if(/!important\b/.test(text)) failures.push(rel+': !important is forbidden');
  if(/\byc-/.test(text)) failures.push(rel+': legacy yc-* prefix is forbidden');
  if(/\bNativeSelect\b/.test(text)) failures.push(rel+': NativeSelect is forbidden; use the universal Select component');
  if(rel.endsWith('.jsx')&&/<select\b/.test(text)) failures.push(rel+': raw select is forbidden; use Select');
  if(rel.endsWith('.css')&&/line-height\s*:\s*1\.(?:5|6|7|8|9)\d*/.test(text)) failures.push(rel+': line-height above the compact system range is forbidden');

  if(/className=["'][^"']*\bds-card\b/.test(text)&&rel!=='src/design-system/components/Card.jsx'){
    failures.push(rel+': use <Card> instead of ds-card directly');
  }

  if(isPageLayer&&rel.endsWith('.jsx')){
    if(/<(?:button|input|textarea|select)\b/.test(text)){
      failures.push(rel+': raw interactive controls are forbidden in pages/dev; use design-system components');
    }
    if(/className=["'][^"']*\b(?:ds-btn|ds-input|ds-select-trigger|ds-alert|ds-dialog|ds-drawer|ds-tabs|ds-toast|ds-state)\b/.test(text)){
      failures.push(rel+': component appearance must come from a design-system component, not DS classes');
    }
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
        if(importedProduct&&importedProduct!==product) failures.push(rel+': cross-product import from '+importedProduct);
      }
    }

    if(rel.endsWith('.jsx')&&/\bsupabase\b/i.test(text)) failures.push(rel+': product UI must not access Supabase directly');
    if(rel.endsWith('.jsx')&&/\bfetch\s*\(/.test(text)) failures.push(rel+': product UI must use a service instead of fetch directly');
  }

  if(rel.endsWith('.jsx')&&!rel.startsWith('src/dev/')){
    const lines=text.split('\n').length;
    if(lines>250) failures.push(rel+': component/page exceeds 250 lines; split responsibilities');
  }

  const styleMatches=[...text.matchAll(/style=\{\{([\s\S]*?)\}\}/g)];
  for(const match of styleMatches){
    if(!/--[a-z0-9-]+/.test(match[1])) failures.push(rel+': inline style must only pass CSS custom properties');
  }
}

const requiredPortalComponents=['Select.jsx','Tooltip.jsx','Dialog.jsx','Drawer.jsx','Toast.jsx'];
for(const component of requiredPortalComponents){
  const text=fs.readFileSync(path.join(src,'design-system/components',component),'utf8');
  if(!text.includes('<Portal')) failures.push(component+': floating/overlay feedback must render through Portal');
}

const card=fs.readFileSync(path.join(src,'design-system/components/Card.jsx'),'utf8');
if(!card.includes("'ds-card'")||!card.includes("'ds-stitched-card'")) failures.push('Card.jsx: every Card must be stitched by default');

const dataCss=fs.readFileSync(path.join(src,'design-system/styles/data.css'),'utf8');
if(!dataCss.includes('.ds-stitch rect')||!dataCss.includes('var(--card-stitch-color)')||!card.includes('<CardStitch')) failures.push('data.css: stitched treatment must use the semantic stitch token');

const layersCss=fs.readFileSync(path.join(src,'design-system/styles/layers.css'),'utf8');
if(!layersCss.includes('opacity:0')||!layersCss.includes('scale(.97)')||!layersCss.includes('prefers-reduced-motion')){
  failures.push('layers.css: anchored layers must use the standard natural-motion contract with reduced-motion support');
}

const shellCss=fs.readFileSync(path.join(src,'app/styles/shell.css'),'utf8');
if(!shellCss.includes('view-transition-name:epav-page')||!shellCss.includes('prefers-reduced-motion')){
  failures.push('shell.css: page navigation must use the route motion contract with reduced-motion support');
}

if(failures.length){
  console.error('Architecture check failed:\n- '+failures.join('\n- '));
  process.exit(1);
}
process.stdout.write('Architecture check passed.\n');
