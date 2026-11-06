"""Fecha a emenda esquerda/direita de panoramas equirretangulares gerados por IA (as duas bordas não casam) e grava 4096x2048.

Funde as últimas W colunas com as primeiras W (smoothstep) e descarta o excesso: a imagem fica W colunas mais estreita e é
reesticada para 2:1, então o fim de uma borda continua exatamente no começo da outra.
Uso: python tools/fechar-emenda-360.py <pasta de entrada com PNG 8192x4096> <pasta de saída> [faixa=400] [qualidade=92]
"""
import sys, pathlib, numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

def fechar(im, w):
    a = np.asarray(im.convert("RGB")).astype(np.float32)
    H, W, _ = a.shape
    t = np.linspace(0, 1, w, dtype=np.float32); t = t * t * (3 - 2 * t)  # smoothstep
    t = t[None, :, None]
    mix = a[:, W - w:] * (1 - t) + a[:, :w] * t        # sai da borda direita e entra na esquerda
    out = np.concatenate([mix, a[:, w:W - w]], axis=1)  # largura W-w, e o fim casa com o começo
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))

if __name__ == "__main__":
    ent, sai = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); sai.mkdir(parents=True, exist_ok=True)
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 400; q = int(sys.argv[4]) if len(sys.argv) > 4 else 92
    for p in sorted(ent.glob("*.png")):
        im = fechar(Image.open(p), w).resize((4096, 2048), Image.LANCZOS)
        im.save(sai / (p.stem + ".webp"), quality=q, method=6)
        a = np.asarray(im).astype(float)
        print(f"{p.stem:20} emenda agora = {np.abs(a[:, 0] - a[:, -1]).mean():.1f}")
