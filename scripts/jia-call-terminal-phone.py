#!/usr/bin/env python3
"""Replay masked image-generator edits for the jia-call terminal phone."""
import importlib.util
import json
import sys
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT/'content/reference/art-sources/lesson-sticker/jia-call'
REV = ART/'revisions/neon-phone'
OUT = ROOT/'public/images/lesson-sticker/jia-call'
NAMES = ['idle','blink','hover','ringing']
LANCZOS = Image.Resampling.LANCZOS
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('dialogue_cut_helpers',ROOT/'scripts/dialogue-cut-assets.py')
helpers = importlib.util.module_from_spec(spec)
spec.loader.exec_module(helpers)


def exterior_green(rgb):
    a=rgb.astype(int)
    green=(a[:,:,1]>np.maximum(a[:,:,0],a[:,:,2])+35)&(a[:,:,1]>80)
    labels=helpers.components(green)
    exterior=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]])
    exterior=exterior[exterior!=0]
    return np.isin(labels,exterior)


def white_border(rgb):
    labels=helpers.components((rgb.min(2)>235)&(rgb.max(2).astype(int)-rgb.min(2)<20))
    counts=np.bincount(labels.ravel());counts[0]=0
    return labels==int(counts.argmax())


def green_palette(rgb):
    a=rgb.astype(float).copy()
    green=a[:,:,1]>np.maximum(a[:,:,0],a[:,:,2])+20
    t=np.clip((a[:,:,1]-20)/235,0,1)
    color=np.array([6,20,11])+(np.array([0,255,102])-np.array([6,20,11]))*t[:,:,None]
    a[green]=color[green]
    dark=(a.max(2)<45)&(a[:,:,1]>np.maximum(a[:,:,0],a[:,:,2]))
    a[dark]=[6,20,11]
    return np.rint(a).clip(0,255).astype('uint8')


def cut_background(rgb):
    exterior=exterior_green(rgb)
    edge=np.array(Image.fromarray(exterior.astype('uint8')*255).filter(ImageFilter.MaxFilter(5)))>0
    a=rgb.astype(float);excess=np.maximum(0,a[:,:,1]-np.maximum(a[:,:,0],a[:,:,2]))
    alpha=np.ones(a.shape[:2]);alpha[edge]=1-excess[edge]/255;alpha[alpha<.15]=0
    color=(a-(1-alpha[:,:,None])*np.array([0,255,0]))/np.maximum(alpha[:,:,None],.001)
    color=color.clip(0,255)
    color[:,:,1]=np.where(edge,np.minimum(color[:,:,1],np.maximum(color[:,:,0],color[:,:,2])),color[:,:,1])
    out=np.dstack([color,alpha*255]).astype('uint8');out[alpha==0]=0
    return Image.fromarray(out)


def make_masks(name):
    old=np.array(Image.open(REV/'sources'/f'{name}.png').convert('RGB'))
    screen=np.array(Image.open(REV/'masks'/f'{name}-screen.png'))>0
    alpha=Image.open(REV/'exports'/f'{name}.png').getchannel('A').resize((1024,1024),Image.Resampling.NEAREST)
    interior=np.asarray(alpha.filter(ImageFilter.MinFilter(9)))>250
    roi=np.zeros((1024,1024),bool);roi[307:473,760:934]=True
    yy,xx=np.indices(roi.shape)
    roi &= yy < 459+.24*(xx-785)
    icon=interior&roi
    edge=(np.asarray(alpha)>0)&~interior
    border=(white_border(old)&(old.min(2)>=250))|edge
    icon &= ~border
    screen &= ~border
    applied=screen|icon
    Image.fromarray(applied.astype('uint8')*255).save(REV/'masks'/f'{name}-applied.png')
    return old,screen,icon,applied,border


def canonical_icon(candidate,common_mask):
    a=candidate.copy();a[exterior_green(a)]=255
    region=np.full_like(a,255);region[315:460,760:934]=a[315:460,760:934]
    marks=(region.min(2)<210)
    ys,xs=np.where(marks)
    crop=Image.fromarray(region).crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
    for size in range(96,55,-1):
        factor=size/max(crop.size);scaled=crop.resize(tuple(round(v*factor) for v in crop.size),LANCZOS)
        canvas=Image.new('RGB',(1024,1024),'white')
        canvas.paste(scaled,(round(822-scaled.width/2),round(397-scaled.height/2)))
        ink=np.asarray(canvas).min(2)<210
        if not (ink&~common_mask).any():
            print('Neutral icon fits unchanged white backing:',size,'px')
            return green_palette(np.array(canvas))
    raise AssertionError('Generated icon does not fit the protected original border')


def main():
    manifest=json.loads((REV/'terminal-edits.json').read_text())
    candidates={n:np.array(Image.open(REV/'edits'/f'{n}.png').convert('RGB')) for n in ['idle','hover','ringing']}
    masks={n:make_masks(n) for n in NAMES}
    common=np.logical_and.reduce([masks[n][2]&~white_border(masks[n][0]) for n in NAMES])
    icon_art=canonical_icon(candidates['idle'],common)
    Image.fromarray(icon_art).save(REV/'edits/neutral-icon.png')
    results={};source_results={};checks=[]
    for n in NAMES:
        old,screen,icon,mask,border=masks[n]
        candidate=candidates['idle' if n=='blink' else n].copy()
        ext=exterior_green(candidate)
        candidate[screen&ext]=[6,20,11]
        # Never introduce generated skin into the protected original fingers.
        a=candidate.astype(int);skin=(a[:,:,0]>100)&(a[:,:,0]>a[:,:,1]+15)&(a[:,:,2]<170)
        candidate[screen&skin]=[6,20,11]
        candidate=green_palette(candidate)
        edited=old.copy();edited[screen]=candidate[screen];edited[icon]=icon_art[icon]
        assert np.array_equal(edited[~mask],old[~mask])
        assert np.array_equal(edited[border],old[border])
        Image.fromarray(edited).save(ART/'sources'/f'{n}.png')
        source_results[n]=edited
        cut=cut_background(edited)
        small=np.array(cut.resize((256,256),LANCZOS))
        original=np.array(Image.open(REV/'exports'/f'{n}.png').convert('RGBA'))
        changed=np.asarray(Image.fromarray(mask.astype('uint8')*255).resize((256,256),LANCZOS))>0
        near_old=(original[:,:,1]>200)&(original[:,:,0]<80)&(original[:,:,2]<80)&(original[:,:,3]>0)
        changed |= near_old
        changed &= ~(white_border(original[:,:,:3])&(original[:,:,:3].min(2)>=250))
        final=original.copy();final[changed,:3]=small[changed,:3]
        final[final[:,:,3]==0]=0
        assert np.array_equal(final[~changed],original[~changed])
        assert np.array_equal(final[:,:,3],original[:,:,3])
        assert not final[final[:,:,3]==0].any()
        near=(final[:,:,1]>200)&(final[:,:,0]<80)&(final[:,:,2]<80)&(final[:,:,3]>0)
        pure=(final[:,:,:3]==[0,255,0]).all(2)&(final[:,:,3]>0)
        assert not near.any(),(n,'near chroma',int(near.sum()))
        assert not pure.any()
        Image.fromarray(final).save(OUT/f'{n}.png')
        Image.fromarray(changed.astype('uint8')*255).save(REV/'masks'/f'{n}-export.png')
        results[n]=Image.fromarray(final)
        checks.append({'frame':n,'source_diff_outside_mask':0,'export_diff_outside_mask':0,'outer_white_source_border_diff':0,'alpha_changed_pixels':0,'near_chroma_pixels':int(near.sum()),'pure_chroma_pixels':int(pure.sum()),'size':[256,256],'mode':'RGBA'})
    source_eye_diff=np.any(source_results['idle']!=source_results['blink'],axis=2)
    old_idle=np.array(Image.open(REV/'sources/idle.png'));old_blink=np.array(Image.open(REV/'sources/blink.png'))
    original_eye_diff=np.any(old_idle!=old_blink,axis=2)
    assert not (source_eye_diff&~original_eye_diff).any()
    final_diff=np.any(np.asarray(results['idle'])!=np.asarray(results['blink']),axis=2)
    old_final_diff=np.any(np.array(Image.open(REV/'exports/idle.png'))!=np.array(Image.open(REV/'exports/blink.png')),axis=2)
    assert not (final_diff&~old_final_diff).any()
    report={'date':'2026-10-29','frames':checks,'idle_blink_source_diff_outside_original_eye_region':0,'idle_blink_export_diff_outside_original_eye_region':0,'silhouette_and_alpha':'Identical to original exports for all four frames','palette':'Screen dark green; bright green marks normalized to #00ff66, not #00ff00','phone_icon':'Image-generated standalone handset and curved waves, fitted inside original white backing; no circle or bubble tail','blink':'Reuses exact idle phone/icon correction'}
    (ART/'self-check.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    font=ImageFont.truetype('/System/Library/Fonts/Menlo.ttc',16)
    preview=Image.new('RGB',(1024,920),'white');draw=ImageDraw.Draw(preview)
    for block,color in enumerate(['#FFFFFF','#f1ebdc']):
        y=block*460;draw.rectangle((0,y,1024,y+460),fill=color)
        draw.text((12,y+8),color+' / 256 px',font=font,fill='#252525')
        for i,n in enumerate(NAMES):
            draw.text((i*256+12,y+32),n,font=font,fill='#252525');preview.paste(results[n],(i*256,y+54),results[n])
        draw.text((12,y+318),'96 px',font=font,fill='#252525')
        for i,n in enumerate(NAMES):
            im=results[n].resize((96,96),LANCZOS);preview.paste(im,(i*256+80,y+345),im)
    preview.save(ART/'preview.png')
    prompts_path=ART/'generation-prompts.json';prompts=json.loads(prompts_path.read_text())
    prompts['terminal_phone_edit']={**manifest,'applied_source_masks':[f'revisions/neon-phone/masks/{n}-applied.png' for n in NAMES],'export_masks':[f'revisions/neon-phone/masks/{n}-export.png' for n in NAMES],'postprocess':'Masked composites only; original outer white border and RGBA alpha preserved exactly; canonical generated icon fitted into original backing. Blink reuses idle patch.','replay_script':'scripts/jia-call-terminal-phone.py'}
    prompts_path.write_text(json.dumps(prompts,ensure_ascii=False,indent=2)+'\n')
    print('PASS: four masked phone edits; zero diff outside masks, zero pure/near chroma pixels, alpha unchanged, blink differs only in eyes.')

if __name__=='__main__':
    main()
