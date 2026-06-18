import asyncio, json, re, base64
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-screenshots'
OUT.mkdir(exist_ok=True)
html=(ROOT/'index.html').read_text()
css=(ROOT/'styles.css').read_text()
js=(ROOT/'app.js').read_text()

# Inline the generated SVG artwork so the sandboxed test page can display it without a web origin.
for relative in ['assets/hero-garden.svg','assets/icons/number-grid.svg','assets/icons/tile-pairs.svg','assets/icons/falling-shapes.svg','assets/icons/crate-trail.svg']:
    payload=base64.b64encode((ROOT/relative).read_bytes()).decode('ascii')
    js=js.replace(relative, 'data:image/svg+xml;base64,'+payload)
html=re.sub(r'<link rel="stylesheet" href="styles.css">', f'<style>{css}</style>', html)
html=re.sub(r'<script src="app.js" defer></script>', '', html)
html=re.sub(r'<link rel="manifest"[^>]+>', '', html)

async def load(page, hash_value=''):
    await page.set_content(html, wait_until='domcontentloaded')
    await page.add_script_tag(content=js)
    if hash_value:
        await page.evaluate("h => { location.hash = h; window.dispatchEvent(new HashChangeEvent('hashchange')); }", hash_value)
    await page.wait_for_timeout(100)

async def route(page, hash_value):
    await page.evaluate("h => { location.hash = h; window.dispatchEvent(new HashChangeEvent('hashchange')); }", hash_value)
    await page.wait_for_timeout(100)

async def test_view(browser, name, width, height):
    context=await browser.new_context(viewport={'width':width,'height':height}, device_scale_factor=1, has_touch=True, is_mobile=True)
    page=await context.new_page()
    errors=[]
    page.on('console', lambda msg: errors.append(f'console:{msg.type}:{msg.text}') if msg.type=='error' else None)
    page.on('pageerror', lambda exc: errors.append(f'pageerror:{exc}'))
    await load(page)
    await page.screenshot(path=str(OUT/f'{name}-home.png'), full_page=True)
    metrics=await page.evaluate('''() => ({
      innerWidth, innerHeight,
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      cards: [...document.querySelectorAll('.game-card')].map(e=>({w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}))
    })''')
    if metrics['scrollWidth'] > width + 1:
        errors.append(f'horizontal-overflow:{metrics}')

    # Sudoku touch flow
    await page.locator('[data-game="sudoku"]').click()
    await page.wait_for_timeout(100)
    await page.locator('.sudoku-cell:not(.given)').first.click()
    await page.locator('.number-button').first.click()
    await page.screenshot(path=str(OUT/f'{name}-sudoku.png'), full_page=True)
    sw=await page.evaluate('document.documentElement.scrollWidth')
    if sw > width + 1: errors.append(f'sudoku-overflow:{sw}')

    # Tile pair flow
    await route(page, '#/tiles')
    pair=await page.evaluate('''() => {
      const by={};
      for (const e of document.querySelectorAll('.mahjong-tile.free')) {
        const k=e.textContent;
        (by[k] ||= []).push(e.dataset.id);
      }
      const key=Object.keys(by).find(k=>by[k].length>=2);
      return key ? by[key].slice(0,2) : null;
    }''')
    if pair:
        await page.locator(f'.mahjong-tile[data-id="{pair[0]}"]').click()
        await page.locator(f'.mahjong-tile[data-id="{pair[1]}"]').click()
    else:
        errors.append('no-free-tile-pair')
    await page.screenshot(path=str(OUT/f'{name}-tiles.png'), full_page=True)

    # Falling shapes
    await route(page, '#/falling')
    await page.locator('#fallingNew').click()
    await page.locator('#fallLeft').click()
    await page.locator('#fallRotate').click()
    await page.locator('#fallDrop').click()
    await page.locator('#fallingPause').click()
    await page.screenshot(path=str(OUT/f'{name}-falling.png'), full_page=True)

    # Crates
    await route(page, '#/crates')
    tower=page.locator('.crate-cell.reachable').filter(has=page.locator('.crate-tower')).first
    if await tower.count():
        await tower.click()
        enabled=page.locator('.direction-button:not([disabled])').first
        if await enabled.count(): await enabled.click()
        else: errors.append('no-enabled-crate-direction')
    else: errors.append('no-reachable-crate-tower')
    await page.screenshot(path=str(OUT/f'{name}-crates.png'), full_page=True)

    small=await page.evaluate('''() => [...document.querySelectorAll('button:not(.crate-cell):not(.sudoku-cell):not(.mahjong-tile)')]
      .filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && r.height>0 && !e.disabled && (r.width<44 || r.height<44)})
      .map(e=>({id:e.id,cls:e.className,w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height),text:e.textContent.trim().slice(0,20)}))''')
    if small: errors.append(f'small-controls:{small}')
    await context.close()
    return {'name':name,'metrics':metrics,'errors':errors}

async def main():
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        results=[]
        for name,w,h in [('iphone-se',320,568),('android-small',360,640),('iphone-14',390,844),('large-phone',430,932),('landscape',844,390)]:
            results.append(await test_view(browser,name,w,h))
        await browser.close()
    print(json.dumps(results,indent=2))

asyncio.run(main())
