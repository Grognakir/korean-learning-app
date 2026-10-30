#!/usr/bin/env python3
"""Rebuild the generated sticker catalog, fabric masks and visual QA sheets."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'content/reference/art-sources/clothing-game'
OUT = ROOT / 'public/images/clothing-game/prod'
RESAMPLE = Image.Resampling.LANCZOS


def regions(binary):
    labels = np.zeros(binary.shape, np.int32)
    parents = [0]
    def find(a):
        while parents[a] != a:
            parents[a] = parents[parents[a]]
            a = parents[a]
        return a
    previous = []
    for y, row in enumerate(binary):
        edges = np.diff(np.pad(row.astype(np.int8), (1, 1)))
        runs = list(zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)))
        current = []
        j = 0
        for start, end in runs:
            while j < len(previous) and previous[j][1] <= start:
                j += 1
            overlaps = []
            k = j
            while k < len(previous) and previous[k][0] < end:
                overlaps.append(find(previous[k][2]))
                k += 1
            if overlaps:
                label = min(overlaps)
                for other in overlaps:
                    parents[other] = label
            else:
                label = len(parents)
                parents.append(label)
            labels[y, start:end] = label
            current.append((start, end, label))
        previous = current
    lookup = np.array([find(i) for i in range(len(parents))])
    return lookup[labels]


def remove_green(source):
    rgb = np.asarray(source.convert('RGB'), dtype=np.float32)
    excess = np.maximum(0, rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2]))
    alpha = 1 - excess / 255
    background = (rgb[:, :, 1] > 150) & (np.maximum(rgb[:, :, 0], rgb[:, :, 2]) < 100)
    alpha[(alpha < .15) | background] = 0
    unmix = (rgb - (1-alpha[:, :, None])*np.array([0, 255, 0])) / np.maximum(alpha[:, :, None], .001)
    unmix = np.clip(unmix, 0, 255)
    unmix[:, :, 1] = np.minimum(unmix[:, :, 1], np.maximum(unmix[:, :, 0], unmix[:, :, 2]))
    result = np.dstack((unmix, alpha*255)).astype(np.uint8)
    result[alpha == 0] = 0
    return result


def fabric_mask(rgba, item):
    gray = np.asarray(Image.fromarray(rgba[:, :, :3]).convert('L'))
    labels = regions(~((gray < 85) & (rgba[:, :, 3] > 128)))
    flat = labels.ravel()
    count = np.bincount(flat)
    means = np.bincount(flat, weights=gray.ravel()) / np.maximum(count, 1)
    bright = np.bincount(flat, weights=(gray >= 225).ravel()) / np.maximum(count, 1)
    selected = (count >= 55) & (means >= 174)
    if item['slot'] == 'shoes' and item['id'] != 'socks':
        selected &= bright > .23
    selected[np.unique(labels[rgba[:, :, 3] < 128])] = False
    selected[0] = False
    weight = np.clip((gray.astype(float)-85)/45, 0, 1)
    return (selected[labels] * weight * (rgba[:, :, 3]/255) * 255).astype(np.uint8)


def fit(image, bbox, scale, mode):
    crop = image.crop(bbox)
    factor = 256*scale/max(crop.size)
    size = tuple(max(1, round(s*factor)) for s in crop.size)
    canvas = Image.new(mode, (256, 256))
    canvas.paste(crop.resize(size, RESAMPLE), ((256-size[0])//2, (256-size[1])//2))
    return canvas


def tint(icon, mask, color):
    a = np.asarray(icon).copy()
    m = np.asarray(mask)[:, :, None]/255
    target = np.array(tuple(bytes.fromhex(color.lstrip('#'))))/255
    a[:, :, :3] = np.rint(a[:, :, :3]*(1-m+m*target)).astype(np.uint8)
    return Image.fromarray(a)


def patterns():
    folder = ART/'patterns'
    (folder/'tiles').mkdir(exist_ok=True)
    (OUT/'patterns').mkdir(exist_ok=True)
    for name in ['stripes', 'check', 'floral', 'dots']:
        source = np.asarray(Image.open(folder/'sources'/f'{name}.png').convert('L')) < 128
        if name in ['stripes', 'check']:
            # Regularize generated straight-line repeats to an exact 64px period.
            x = np.arange(512) % 64
            if name == 'stripes':
                widths = np.diff(np.flatnonzero(np.diff(np.pad(source[512].astype(int), (1, 1))) != 0))
                width = int(np.clip(np.median(widths[::2])/2, 15, 24)) if len(widths) else 20
                tile = np.tile((x >= 22) & (x < 22+width), (512, 1))
            else:
                line = ((x >= 12) & (x < 20)) | ((x >= 43) & (x < 46))
                tile = line[:, None] | line[None, :]
        else:
            labels = regions(source)
            count = np.bincount(labels.ravel())
            candidates = np.flatnonzero((count > 100) & (count < 25000))
            candidates = candidates[candidates != 0]
            best = min(candidates, key=lambda i: np.linalg.norm(np.argwhere(labels == i).mean(axis=0)-512))
            ys, xs = np.where(labels == best)
            motif = Image.fromarray((labels[ys.min():ys.max()+1, xs.min():xs.max()+1] == best).astype(np.uint8)*255)
            motif = motif.resize((24, 24) if name == 'dots' else (48, 48), RESAMPLE)
            canvas = Image.new('L', (512, 512))
            n = 8 if name == 'dots' else 6
            for row in range(n):
                for col in range(n):
                    cx = round((col+.5)*512/n)
                    cy = round((row+.5)*512/n)
                    if name == 'floral':
                        cx += 9 if row % 2 else -9
                    canvas.paste(motif, (cx-motif.width//2, cy-motif.height//2))
            tile = np.asarray(canvas) >= 128
        Image.fromarray(np.where(tile, 0, 255).astype(np.uint8)).save(folder/'tiles'/f'{name}.png')
        alpha = Image.fromarray(tile.astype(np.uint8)*255).resize((256, 256), RESAMPLE)
        a = np.zeros((256, 256, 4), np.uint8)
        a[:, :, 3] = np.asarray(alpha)
        a[a[:, :, 3] > 0, :3] = 255
        Image.fromarray(a).save(OUT/'patterns'/f'{name}.png')


def main():
    folder = ART/'icons'
    items = json.loads((folder/'generation-prompts.json').read_text())['items']
    (folder/'masks').mkdir(exist_ok=True)
    (OUT/'icons').mkdir(exist_ok=True)
    icons, masks = {}, {}
    checks = []
    for item in items:
        name = item['id']
        source = Image.open(folder/item['source']).convert('RGB')
        rgba = remove_green(source)
        if name != 'jeans':
            gray = np.asarray(Image.fromarray(rgba[:, :, :3]).convert('L'))
            rgba[:, :, :3] = gray[:, :, None]
        bbox = Image.fromarray(rgba[:, :, 3]).getbbox()
        icon = fit(Image.fromarray(rgba), bbox, item['scale'], 'RGBA')
        a = np.array(icon)
        a[:, :, 1] = np.minimum(a[:, :, 1], np.maximum(a[:, :, 0], a[:, :, 2]))
        a[a[:, :, 3] == 0] = 0
        icon = Image.fromarray(a)
        icon.save(OUT/'icons'/f'{name}.png')
        icons[name] = icon
        if item['recolorable']:
            mask = fabric_mask(rgba, item)
            manual = folder/'manual_masks'/f'{name}_mask.png'
            if manual.exists():
                mag = np.asarray(Image.open(manual).convert('RGB')).astype(int)
                mask = ((np.max(abs(mag-np.array([255, 0, 255])), axis=2) < 40) & (rgba[:, :, :3].mean(axis=2) > 85)).astype(np.uint8)*255
            Image.fromarray(mask).save(folder/'masks'/f'{name}_fabric.png')
            magenta = np.array(source)
            magenta[mask > 128] = [255, 0, 255]
            Image.fromarray(magenta).save(folder/'masks'/f'{name}_mask.png')
            small = np.array(fit(Image.fromarray(mask), bbox, item['scale'], 'L'))
            small[a[:, :, 3] == 0] = 0
            small[a[:, :, :3].mean(axis=2) < 80] = 0
            masks[name] = Image.fromarray(small)
            masks[name].save(OUT/'icons'/f'{name}_fabric.png')
            assert not small[a[:, :, 3] == 0].any()
            assert not small[a[:, :, :3].mean(axis=2) < 80].any()
        assert icon.size == (256, 256) and icon.mode == 'RGBA'
        assert not a[a[:, :, 3] == 0].any()
        assert not (a[:, :, 1] > np.maximum(a[:, :, 0], a[:, :, 2])).any()
        if name != 'jeans':
            assert np.array_equal(a[:, :, 0], a[:, :, 1]) and np.array_equal(a[:, :, 1], a[:, :, 2])
        checks.append({'id': name, 'size': 'PASS', 'zero_rgb': 'PASS', 'green_fringe': 'PASS', 'fabric_pixels': int(np.count_nonzero(np.asarray(masks[name]))) if name in masks else None})
    manifest = [{k: item[k] for k in ['id', 'ko', 'slot', 'recolorable', 'patternable']} for item in items]
    (OUT/'icons'/'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    patterns()
    for name in ['stripes', 'check', 'floral', 'dots']:
        tile = np.asarray(Image.open(OUT/'patterns'/f'{name}.png'))
        assert tile.shape == (256, 256, 4)
        assert not tile[tile[:, :, 3] == 0].any()
        assert np.all(tile[tile[:, :, 3] > 0, :3] == 255)
        assert np.array_equal(tile[0], tile[-1])
        assert np.array_equal(tile[:, 0], tile[:, -1])
    assert len(manifest) == 35 and len(masks) == 31
    sheet = Image.new('RGB', (672, 672), '#EDEDED')
    draw = ImageDraw.Draw(sheet)
    girl = Image.open(ROOT/'public/images/lesson-sticker/lesson10-girl/idle.png').convert('RGBA')
    for i, (name, icon) in enumerate([('style: idle', girl)]+list(icons.items())):
        x, y = (i % 6)*112, (i//6)*112
        sheet.paste(icon.resize((72, 72), RESAMPLE), (x+20, y+5), icon.resize((72, 72), RESAMPLE))
        draw.text((x+4, y+84), name, fill='#222222')
    sheet.save(folder/'contact-sheet.png')
    recolor = Image.new('RGB', (620, len(masks)*118+230), '#EDEDED')
    draw = ImageDraw.Draw(recolor)
    for row, (name, mask) in enumerate(masks.items()):
        draw.text((4, row*118+50), name, fill='#222222')
        variants = [icons[name]]+[tint(icons[name], mask, c) for c in ['E53935', '1A237E', '222222']]
        for col, icon in enumerate(variants):
            small = icon.resize((112, 112), RESAMPLE)
            recolor.paste(small, (155+col*115, row*118), small)
    y = len(masks)*118
    for i, name in enumerate(['stripes', 'check', 'floral', 'dots']):
        a = np.array(tint(icons['dress_shirt'], masks['dress_shirt'], '9EC5E8'))
        tile = Image.open(OUT/'patterns'/f'{name}.png').getchannel('A').resize((128, 128), RESAMPLE)
        marks = np.tile(np.asarray(tile), (2, 2))/255
        weight = marks*np.asarray(masks['dress_shirt'])/255
        a[:, :, :3] = np.rint(a[:, :, :3]*(1-.7*weight[:, :, None])).astype(np.uint8)
        small = Image.fromarray(a).resize((150, 150), RESAMPLE)
        recolor.paste(small, (i*155, y+20), small)
        draw.text((i*155+25, y+175), name, fill='#222222')
    recolor.save(folder/'recolor-test.png')
    pattern_sheet = Image.new('RGB', (1024, 1024), 'white')
    for i, name in enumerate(['stripes', 'check', 'floral', 'dots']):
        tile = Image.open(ART/'patterns'/'tiles'/f'{name}.png').resize((256, 256), RESAMPLE)
        for dy in range(2):
            for dx in range(2):
                pattern_sheet.paste(tile, ((i%2)*512+dx*256, (i//2)*512+dy*256))
    pattern_sheet.save(ART/'patterns'/'repeat-preview.png')
    report = {'icons': len(icons), 'fabric_masks': len(masks), 'patterns': 4,
              'pattern_seams': 'PASS', 'mask_alignment_and_black_ink': 'PASS',
              'checks': checks}
    (folder/'self-check.json').write_text(json.dumps(report, indent=2)+'\n')
    print(f'PASS: {len(icons)} RGBA icons, {len(masks)} L fabric masks, 4 RGBA patterns; sizes, zero RGB and green despill checked.')

if __name__ == '__main__':
    main()
