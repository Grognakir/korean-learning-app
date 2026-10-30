#!/usr/bin/env python3
"""Prepare the lesson-10 dialogue sprites and visual checks from generated art."""
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'content/reference/art-sources/dialogue'
STICKER = ROOT / 'content/reference/art-sources/lesson-sticker/jia-call'
PUBLIC = ROOT / 'public/images'
LANCZOS = Image.Resampling.LANCZOS
JIA = ['idle', 'call-annoyed', 'call-talk', 'call-aside', 'call-smirk', 'happy', 'angry', 'facepalm']
CLERK = ['welcome', 'smile', 'thinking', 'bow']
STICKERS = ['idle', 'blink', 'hover', 'ringing']


def components(binary):
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
        current = []
        j = 0
        for start, end in zip(np.flatnonzero(edges == 1), np.flatnonzero(edges == -1)):
            while j < len(previous) and previous[j][1] <= start:
                j += 1
            overlap = []
            k = j
            while k < len(previous) and previous[k][0] < end:
                overlap.append(find(previous[k][2]))
                k += 1
            if overlap:
                label = min(overlap)
                for other in overlap:
                    parents[other] = label
            else:
                label = len(parents)
                parents.append(label)
            labels[y, start:end] = label
            current.append((start, end, label))
        previous = current
    return np.array([find(i) for i in range(len(parents))])[labels]


def key_green(source, sticker=False):
    rgb = np.asarray(source.convert('RGB'), dtype=np.float32)
    protect = np.zeros(rgb.shape[:2], bool)
    if sticker:
        green = (rgb[:, :, 1] > np.maximum(rgb[:, :, 0], rgb[:, :, 2])+40) & (rgb[:, :, 1] > 100)
        labels = components(green)
        counts = np.bincount(labels.ravel())
        exterior = np.unique(np.concatenate([labels[0], labels[-1], labels[:, 0], labels[:, -1]]))
        keep = counts > 800
        keep[exterior] = False
        keep[0] = False
        protect = np.asarray(Image.fromarray(keep[labels].astype(np.uint8)*255).filter(ImageFilter.MaxFilter(5))) > 0
    excess = np.maximum(0, rgb[:, :, 1]-np.maximum(rgb[:, :, 0], rgb[:, :, 2]))
    alpha = 1-excess/255
    background = (rgb[:, :, 1] > 150) & (np.maximum(rgb[:, :, 0], rgb[:, :, 2]) < 110)
    alpha[(alpha < .15) | background] = 0
    alpha[protect] = 1
    color = np.clip((rgb-(1-alpha[:, :, None])*np.array([0, 255, 0]))/np.maximum(alpha[:, :, None], .001), 0, 255)
    color[:, :, 1] = np.where(protect, rgb[:, :, 1], np.minimum(color[:, :, 1], np.maximum(color[:, :, 0], color[:, :, 2])))
    color[protect] = rgb[protect]
    rgba = np.dstack([color, alpha*255]).astype(np.uint8)
    rgba[alpha == 0] = 0
    return Image.fromarray(rgba), Image.fromarray(protect.astype(np.uint8)*255)


def rgba_clean(image, protected=None):
    a = np.array(image)
    protect = np.array(protected) > 0 if protected is not None else np.zeros(a.shape[:2], bool)
    a[:, :, 1] = np.where(protect, a[:, :, 1], np.minimum(a[:, :, 1], np.maximum(a[:, :, 0], a[:, :, 2])))
    a[a[:, :, 3] == 0] = 0
    return Image.fromarray(a)


def keep_input(folder, name):
    target = folder/'alignment-inputs'/f'{name}.png'
    if not target.exists():
        target.parent.mkdir(exist_ok=True)
        Image.open(folder/'sources'/f'{name}.png').save(target)
    return Image.open(target).convert('RGB')


def source_on_green(rgba):
    bg = Image.new('RGB', rgba.size, '#00FF00')
    bg.paste(rgba, (0, 0), rgba)
    return bg


def align_character(image):
    alpha = np.asarray(image.getchannel('A'))
    occupied = np.flatnonzero((alpha > 200).sum(axis=1) > 5)
    top = int(occupied[0])
    sy = (1280-60)/(1280-top)
    ty = 60-top*sy
    # One fixed horizontal transform for every gesture, with extra hand clearance.
    sx, tx = .96, 1024*.02
    result = image.transform((1024, 1280), Image.Transform.AFFINE,
                             (1/sx, 0, -tx/sx, 0, 1/sy, -ty/sy),
                             resample=Image.Resampling.BICUBIC)
    return rgba_clean(result), {'input_hair_top': top, 'scale_x': sx, 'scale_y': sy, 'translate_x': tx, 'translate_y': ty}


def holo(image):
    a = np.array(image)
    light = a[:, :, :3] @ np.array([.2126, .7152, .0722])/255
    dark, mid, bright = np.array([5,16,10]), np.array([15,191,79]), np.array([192,255,208])
    rgb = np.where((light < .5)[:, :, None], dark+(mid-dark)*light[:, :, None]*2,
                   mid+(bright-mid)*(light[:, :, None]-.5)*2)
    rgb[::4] *= .8
    a[:, :, :3] = np.clip(rgb, 0, 255).astype(np.uint8)
    a[a[:, :, 3] == 0] = 0
    return Image.fromarray(a)


def preview_frames(folder, names, images, filename):
    font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 16)
    sheet = Image.new('RGB', (256*len(names), 364), '#EDEDED')
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(names):
        frame = images[name].resize((256,320), LANCZOS)
        draw.text((i*256+10,10), name, font=font, fill='#222222')
        sheet.paste(frame,(i*256,40),frame)
    sheet.save(folder/filename)


def main():
    report = {'characters': [], 'stickers': [], 'alignment': {}, 'blink_outside_eyes': None}
    all_frames = []
    for person, names in [('jia', JIA), ('clerk', CLERK)]:
        folder = ART/person
        out = PUBLIC/'dialogue'/person
        out.mkdir(parents=True, exist_ok=True)
        images = {}
        for name in names:
            source = keep_input(folder, name)
            assert source.size == (1024,1280)
            rgba, _ = key_green(source)
            rgba, alignment = align_character(rgba)
            source_on_green(rgba).save(folder/'sources'/f'{name}.png')
            final = rgba_clean(rgba.resize((640,800), LANCZOS))
            final.save(out/f'{name}.png')
            a = np.asarray(final)
            assert final.size == (640,800) and final.mode == 'RGBA'
            assert not a[a[:, :, 3] == 0].any()
            assert not (a[:, :, 1] > np.maximum(a[:, :, 0],a[:, :, 2])).any()
            assert (a[-1,:,3] > 128).any()
            images[name] = final
            all_frames.append((f'{person}/{name}', final))
            report['alignment'][f'{person}/{name}'] = alignment
            report['characters'].append({'file':f'{person}/{name}.png','size':'PASS','zero_rgb':'PASS','green_fringe':'PASS','hips_at_bottom':'PASS'})
        preview_frames(ART,names,images,f'frames-{person}.png')
    out = PUBLIC/'lesson-sticker/jia-call'
    out.mkdir(parents=True, exist_ok=True)
    originals = {n: keep_input(STICKER,n) for n in STICKERS}
    blink_mask = Image.new('L',(1024,1024))
    draw = ImageDraw.Draw(blink_mask)
    # Precisely limited eye patches keep all other source pixels identical to idle.
    for box in [(394,389,545,478),(581,439,705,534)]:
        draw.ellipse(box,fill=255)
    blink_mask = blink_mask.filter(ImageFilter.GaussianBlur(2))
    originals['blink'] = Image.composite(originals['blink'], originals['idle'], blink_mask)
    idle_array = np.asarray(originals['idle'])
    blink_array = np.asarray(originals['blink'])
    assert np.array_equal(idle_array[np.asarray(blink_mask)==0], blink_array[np.asarray(blink_mask)==0])
    report['blink_outside_eyes'] = 'PASS: source pixels identical outside two eye masks'
    sticker_images = {}
    for name in STICKERS:
        rgba, protected = key_green(originals[name], sticker=True)
        transform = (1/.86,0,-(1024*.07)/.86,0,1/.86,-(1024*.07)/.86)
        rgba = rgba.transform((1024,1024),Image.Transform.AFFINE,transform,resample=Image.Resampling.BICUBIC)
        protected = protected.transform((1024,1024),Image.Transform.AFFINE,transform,resample=Image.Resampling.BICUBIC)
        rgba = rgba_clean(rgba,protected)
        source_on_green(rgba).save(STICKER/'sources'/f'{name}.png')
        final_protect = protected.resize((256,256),LANCZOS)
        final = rgba_clean(rgba.resize((256,256),LANCZOS),final_protect)
        final.save(out/f'{name}.png')
        a = np.asarray(final)
        assert not a[a[:,:,3]==0].any()
        assert not ((a[:,:,1]>np.maximum(a[:,:,0],a[:,:,2])) & (np.asarray(final_protect)==0)).any()
        assert (np.asarray(final_protect)>128).sum()>200
        sticker_images[name] = final
        report['stickers'].append({'file':name+'.png','size':'PASS','zero_rgb':'PASS','green_fringe_outside_phone_and_icon':'PASS'})
    allowed = blink_mask.transform((1024,1024),Image.Transform.AFFINE,transform,
                                   resample=Image.Resampling.BICUBIC)
    allowed = allowed.resize((256,256),LANCZOS).filter(ImageFilter.MaxFilter(5))
    changed = np.any(np.asarray(sticker_images['idle']) != np.asarray(sticker_images['blink']),axis=2)
    assert not (changed & (np.asarray(allowed)==0)).any()
    report['blink_final_export_outside_eye_areas'] = 'PASS'
    sheet=Image.new('RGB',(1024,294),'white')
    draw=ImageDraw.Draw(sheet)
    for i,name in enumerate(STICKERS):
        draw.text((i*256+12,8),name,fill='black')
        sheet.paste(sticker_images[name],(i*256,30),sticker_images[name])
    sheet.save(STICKER/'preview.png')
    bg = Image.open(ART/'bg/office-entrance.png').convert('RGB')
    assert bg.size == (1600,1000)
    (PUBLIC/'dialogue/bg').mkdir(parents=True,exist_ok=True)
    bg.save(PUBLIC/'dialogue/bg/office-entrance.webp',quality=82,method=6)
    report['background']={'size':'PASS','format':'WEBP','quality':82}
    sheet=Image.new('RGB',(1230,1120),'#050a06')
    draw=ImageDraw.Draw(sheet)
    font=ImageFont.truetype('/System/Library/Fonts/Menlo.ttc',14)
    for i,(name,frame) in enumerate(all_frames):
        x=(i%3)*410;y=(i//3)*280
        draw.text((x+8,y+8),name+'  /  COLOR | HOLO',font=font,fill='#0fbf4f')
        for dx,im in [(8,frame),(208,holo(frame))]:
            im=im.resize((192,240),LANCZOS)
            sheet.paste(im,(x+dx,y+32),im)
    sheet.save(ART/'holo-test.png')
    (ART/'self-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print('PASS: 12 character frames, four stickers, one WebP background; alignment, green despill, transparency and blink identity checked.')

if __name__ == '__main__':
    main()
