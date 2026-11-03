"""Ícones do cartão do cliente a partir do favicon (círculo laranja com o "F" da marca):

- app/assets/img/icon-192.png e icon-512.png  → "Adicionar à tela inicial" (Android) na página do cliente (app/c/)
- app/assets/img/apple-touch-icon.png (180)    → atalho no iPhone
- supabase/functions/wallet-pass/images.ts     → imagens embutidas no passe (Apple Wallet: icon/logo; Google: logo 660 px)

Uso (a partir da raiz):  python tools/make-app-icons.py
"""
import asyncio, base64, io, pathlib
from PIL import Image
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "app" / "assets" / "img"
FN = ROOT / "supabase" / "functions" / "wallet-pass"


async def render(pg, svg, size, bg=None, pad=0.0):
    """SVG → PNG quadrado (fundo transparente ou cor), com margem opcional (fração do lado)."""
    inner = round(size * (1 - 2 * pad))
    s = svg.replace("<svg ", f'<svg width="{inner}" height="{inner}" ', 1)
    await pg.set_viewport_size({"width": size, "height": size})
    await pg.set_content(f"<html><body style='margin:0;background:{bg or 'transparent'}'><div style='width:{size}px;height:{size}px;display:grid;place-items:center'>{s}</div></body></html>")
    png = await pg.screenshot(clip={"x": 0, "y": 0, "width": size, "height": size}, omit_background=bg is None)
    return Image.open(io.BytesIO(png)).convert("RGBA")


def png_bytes(im):
    b = io.BytesIO(); im.save(b, "PNG", optimize=True); return b.getvalue()


async def main():
    svg = (IMG / "favicon.svg").read_text(encoding="utf-8")
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(device_scale_factor=1)
        for n in (192, 512):
            (IMG / f"icon-{n}.png").write_bytes(png_bytes(await render(pg, svg, n)))
        (IMG / "apple-touch-icon.png").write_bytes(png_bytes((await render(pg, svg, 180, bg="#ffffff", pad=0.08)).convert("RGB")))
        out = {}
        for key, size, bg, pad in (("icon", 29, "#ffffff", 0.04), ("icon2x", 58, "#ffffff", 0.04), ("icon3x", 87, "#ffffff", 0.04),
                                   ("logo", 50, None, 0), ("logo2x", 100, None, 0), ("logo3x", 150, None, 0), ("google", 660, None, 0)):
            im = await render(pg, svg, size, bg=bg, pad=pad)
            out[key] = base64.b64encode(png_bytes(im.convert("RGB") if bg else im)).decode()
        await b.close()
    FN.mkdir(parents=True, exist_ok=True)
    ts = ["// GERADO por tools/make-app-icons.py — não edite à mão. PNGs do favicon (círculo com o \"F\") em base64.",
          "// icon*: ícone do passe da Apple (29/58/87 px) · logo*: logo padrão do passe (quando o negócio não tem logo PNG) · google: 660 px",
          "export const IMG_B64: Record<string, string> = {"]
    ts += [f'  {k}: "{v}",' for k, v in out.items()] + ["};", ""]
    (FN / "images.ts").write_text("\n".join(ts), encoding="utf-8")
    for f in ("icon-192.png", "icon-512.png", "apple-touch-icon.png"):
        print("  app/assets/img/" + f, Image.open(IMG / f).size)
    print("  supabase/functions/wallet-pass/images.ts", {k: len(v) for k, v in out.items()})


asyncio.run(main())
