import os
from PIL import Image

DEST_DIRS = [
    r"c:\Users\pacc1\Documents\Antigravity\Link Corretor\Planta-Interativa\Montemerano\Panoramas-360",
    r"c:\Users\pacc1\Documents\Antigravity\Link Corretor\Planta-Interativa\Planta Interativa\tour\public\360\panoramas"
]

def process_panorama(src_path: str, filename_base: str, target_width: int = 2048, target_height: int = 1024):
    """
    Takes an input image and outputs an exact 2:1 equirectangular panorama.
    Saves in high quality JPG and WEBP to all destination directories.
    """
    for d in DEST_DIRS:
        os.makedirs(d, exist_ok=True)

    with Image.open(src_path) as img:
        img_rgb = img.convert("RGB")
        # Resize to exact 2:1 equirectangular dimensions using Lanczos filter
        pano_2to1 = img_rgb.resize((target_width, target_height), Image.Resampling.LANCZOS)
        
        for d in DEST_DIRS:
            jpg_path = os.path.join(d, f"{filename_base}.jpg")
            webp_path = os.path.join(d, f"{filename_base}.webp")
            
            pano_2to1.save(jpg_path, format="JPEG", quality=95, optimize=True)
            pano_2to1.save(webp_path, format="WEBP", quality=92)
            print(f"Saved: {jpg_path} ({target_width}x{target_height})")
            print(f"Saved: {webp_path} ({target_width}x{target_height})")

if __name__ == "__main__":
    import sys
    if len(sys.argv) >= 3:
        src = sys.argv[1]
        name = sys.argv[2]
        w = int(sys.argv[3]) if len(sys.argv) > 3 else 2048
        h = int(sys.argv[4]) if len(sys.argv) > 4 else 1024
        process_panorama(src, name, w, h)

