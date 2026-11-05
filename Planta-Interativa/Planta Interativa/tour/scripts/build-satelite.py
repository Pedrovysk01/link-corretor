"""Monta os mosaicos de satélite do chão do tour (Esri World Imagery) em volta do lote e grava
public/img/entorno-satelite.webp (largo, z16) e entorno-satelite-perto.webp (detalhe, z18), mais src/scene/entorno.generated.ts
com tamanhos e deslocamentos em metros, para a torre cair exatamente em cima do ponto informado.

    python scripts/build-satelite.py -27.1561 -48.5745

Troque a coordenada pela do lote exato quando tiver e rode de novo. Imagens: Esri, Maxar, Earthstar Geographics (confirme a licença para uso comercial).
"""
import io, math, sys, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
lat = float(sys.argv[1]) if len(sys.argv) > 1 else -27.1561
lon = float(sys.argv[2]) if len(sys.argv) > 2 else -48.5745


def mosaico(z, R, saida, px):
    n = 2 ** z
    fx = (lon + 180) / 360 * n
    fy = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    xt, yt = int(fx), int(fy)
    lado = 256 * (2 * R + 1)
    img = Image.new("RGB", (lado, lado), (46, 56, 44))
    falhas = 0
    for dy in range(-R, R + 1):
        for dx in range(-R, R + 1):
            u = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{yt + dy}/{xt + dx}"
            try:
                req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 LinkCorretor"})
                img.paste(Image.open(io.BytesIO(urllib.request.urlopen(req, timeout=30).read())).convert("RGB"), (256 * (dx + R), 256 * (dy + R)))
            except Exception:
                falhas += 1
    mpp = 156543.03 * math.cos(math.radians(lat)) / n          # metros por pixel de tile
    # posição do ponto dentro do mosaico, em pixels, e deslocamento do centro do mosaico em relação ao ponto (metros)
    px_x, px_y = (R + (fx - xt)) * 256, (R + (fy - yt)) * 256
    off_x, off_z = (lado / 2 - px_x) * mpp, (lado / 2 - px_y) * mpp
    img.resize((px, px), Image.LANCZOS).save(ROOT / "public" / "img" / saida, "WEBP", quality=76, method=6)
    print(f"z{z}: {saida} · lado {lado * mpp:.0f} m · falhas {falhas} · deslocamento ({off_x:.1f}, {off_z:.1f}) m")
    return {"size": round(lado * mpp, 1), "offX": round(off_x, 1), "offZ": round(off_z, 1)}


larg = mosaico(16, 2, "entorno-satelite.webp", 2048)
perto = mosaico(18, 3, "entorno-satelite-perto.webp", 2048)
(ROOT / "src" / "scene" / "entorno.generated.ts").write_text(
    "/* Gerado por scripts/build-satelite.py — não edite à mão. Coordenada usada: %s, %s */\n"
    "export const ENTORNO = { lat: %s, lon: %s, largo: %s, perto: %s } as const\n" % (lat, lon, lat, lon, larg, perto), encoding="utf-8")
