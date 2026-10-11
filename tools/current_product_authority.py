"""Validate current public authority without freezing future product counts."""
import json

CORE_IDS=('guilu-gao','guilu-drink-30','guilu-drink-180','luerong-fen')

def current_public_ids(root):
    master=json.loads((root/'public-product-master.json').read_text(encoding='utf-8'))
    products=master.get('products') or []
    ids=[p.get('id') for p in products]
    assert master.get('authority')=='user-confirmed-current', '產品母資料權威錯誤'
    assert ids and all(isinstance(pid,str) and pid.strip() for pid in ids), '公開產品ID空白'
    assert master.get('productCount')==len(ids)==len(set(ids)), '公開產品數或ID不一致'
    assert set(CORE_IDS).issubset(ids), '核心公開產品缺失'
    assert not set(ids) & {'guilu-jiao','guilu-tangkuai'}, '暫緩產品不得回流公開'
    assert 'qixuan-guilu-drink-powder' not in ids, '柒玄茶暫緩公開'
    return ids

def current_media_ids(root):
    media=json.loads((root/'data/formal-media-authority-v20260810.json').read_text(encoding='utf-8'))
    aliases={'guilu-drink-30cc':'guilu-drink-30','guilu-drink-180cc':'guilu-drink-180'}
    public=set(current_public_ids(root))
    ids=[aliases.get(str(p.get('id') or ''),str(p.get('id') or '')) for p in media.get('products') or [] if p.get('status')=='approved_display' and aliases.get(p.get('id'),p.get('id')) in public]
    assert len(ids)==len(set(ids)), '核准媒體ID重複'
    assert set(ids)==set(current_public_ids(root)), '核准媒體與公開母資料清單不一致'
    return ids
