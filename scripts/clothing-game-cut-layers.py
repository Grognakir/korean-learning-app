# Режет картинки игры «Примерочная» на прозрачные слои: убирает белый фон у base,
# вырезает белые вещи (служебные цвета других вещей игнорируются). Нужны Pillow, numpy, scipy.
from PIL import Image; import numpy as np, sys
from scipy import ndimage as nd
R='public/images/clothing-game/'  # запуск из корня репозитория
OUT=R+'test2/layers/'
import os; os.makedirs(OUT,exist_ok=True)
base=np.array(Image.open(R+'test2/base.png').convert('RGB')).astype(float)/255
def save(rgb,mask,name):
    a=np.dstack([rgb,mask.astype(float)]); Image.fromarray((a*255).astype('uint8')).save(OUT+name+'.png',optimize=True)
# база: убрать белый фон (связный с краем + крупные чисто белые области)
wh=(base.min(2)>=0.96)
lab,n=nd.label(wh); sizes=nd.sum(wh,lab,range(1,n+1))
bg=np.isin(lab,np.where(sizes>1500)[0]+1)
# мягкий край: полупрозрачность для светлых пикселей у границы
edge=nd.binary_dilation(bg,iterations=2)&~bg
alpha=(~bg).astype(float)
L=base.mean(2); alpha[edge]=np.clip((1-L[edge])/0.25,0,1)
save(base,alpha,'base')
lb,nb=nd.label(bg); border=set(np.unique(np.concatenate([lb[0],lb[-1],lb[:,0],lb[:,-1]])))-{0}
gap=bg&~np.isin(lb,list(border))
for n in ['base_blink','base_happy','base_oops']:
    f=np.array(Image.open(R+'test2/'+n+'.png').convert('RGB')).astype(float)/255
    save(f,alpha,n)
def cut(name,white=True,grow=4,onbody=False):
    g=np.array(Image.open(R+'test/clothes/'+name+'.png').convert('RGB')).astype(float)/255
    diff=np.abs(g-base).sum(2)
    if white:
        mx=g.max(2); mn=g.min(2); sat=(mx-mn)/(mx+1e-6); Lg0=g.mean(2)
        light=Lg0>0.45
        lab,k=nd.label(light)
        bgfrac=nd.mean(bg.astype(float),lab,range(1,k+1))
        comp_bg=np.isin(lab,np.where(np.array(bgfrac)>0.97)[0]+1)
        fill=light&~comp_bg&(sat<0.08)&(mx>0.55)&((diff>0.15)|bg)
        fill=nd.binary_opening(fill,iterations=1)
        lab,k=nd.label(fill); s_=nd.sum(fill,lab,range(1,k+1))
        keep=np.isin(lab,np.where(np.array(s_)>800)[0]+1)
        keep=nd.binary_closing(keep,iterations=4); keep=nd.binary_fill_holes(keep)&~comp_bg
        ring=nd.binary_dilation(keep,iterations=grow+2)&~keep
        dark=(Lg0<0.45)&((diff>0.15)|nd.binary_dilation(bg,iterations=3))
        keep=keep|(ring&dark)
        if onbody: keep&=~nd.binary_erosion(bg,iterations=3)
        keep&=~nd.binary_erosion(gap,iterations=2)
    else:
        keep=nd.binary_dilation(nd.binary_closing(diff>0.25,iterations=2),iterations=1)
    Lg=g@[0.299,0.587,0.114]
    rgb=np.dstack([Lg]*3) if white else g
    save(rgb,keep&~bg if False else keep,name)
    return keep
for n in ['shirt','pants','jacket','shoes']: cut(n)
cut('tie',onbody=True)
cut('glasses',white=False)
