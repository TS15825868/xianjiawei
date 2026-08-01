from pathlib import Path
import re, shutil, json
ROOT=Path('.')
OUT=Path('_site')
if OUT.exists(): shutil.rmtree(OUT)
OUT.mkdir()
root_files=[]
for pat in ('*.html','*.css','*.js','*.json','*.xml','*.txt','*.webmanifest'):
    root_files += [p for p in ROOT.glob(pat) if p.is_file()]
for special in (Path('.nojekyll'),):
    if special.exists(): root_files.append(special)
# Exclude internal/test documents from public deployment.
exclude_prefixes=('README_','AUDIT_','WEBSITE_','BUTTON_','rich-menu-','site-fix-')
root_files=[p for p in root_files if not p.name.startswith(exclude_prefixes) and p.name not in {'artifact.tar'}]
for p in root_files: shutil.copy2(p,OUT/p.name)
text='\n'.join(p.read_text('utf-8',errors='ignore') for p in root_files if p.suffix.lower() in {'.html','.css','.js','.json','.xml','.txt','.webmanifest'})
assets=set(re.findall(r'images/[A-Za-z0-9_./#\-\u4e00-\u9fff]+\.(?:png|jpe?g|webp|avif)',text))
# Dynamic mascot filenames are combined at runtime; include all optimized WebP files.
assets.update(str(p) for p in Path('images/brand/approved-v405').glob('*.webp'))
# LINE Messaging API only accepts JPEG/PNG. Publish deterministic JPEG copies
# derived from the same approved website scenes; no crop or redraw is permitted.
assets.update(str(p) for p in Path('images/brand/line-oa').glob('*.jpg'))
line_manifest=Path('images/brand/line-oa/manifest.json')
if line_manifest.is_file(): assets.add(str(line_manifest))
# The ingredient-principle visual is an ERP/social approved candidate that must be
# shipped even before a public HTML page starts referencing it. Its bytes and SHA
# are verified by tools/materialize_ingredient_principle.py and verify_public_site.py.
assets.add('images/posts/generated/post-ingredient-principle.webp')
for rel in sorted(assets):
    src=Path(rel)
    if not src.is_file(): raise SystemExit(f'Missing referenced asset: {rel}')
    dst=OUT/src
    dst.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(src,dst)
# Verification and size report.
for html in OUT.glob('*.html'):
    s=html.read_text('utf-8',errors='ignore')
    for link in re.findall(r'(?:href|src|data-dm-src)=["\']([^"\']+)["\']',s):
        if link.startswith(('http:','https:','mailto:','tel:','#','javascript:')): continue
        local=link.split('?')[0].split('#')[0]
        if local and not (OUT/local).exists(): raise SystemExit(f'Broken local reference in {html.name}: {local}')
size=sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
print(f'Public files: {sum(1 for p in OUT.rglob("*") if p.is_file())}; bytes: {size}')
if size>45*1024*1024: raise SystemExit(f'Public artifact too large: {size}')
