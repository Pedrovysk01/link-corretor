# Aumenta a resolução dos panoramas 360° com Real-ESRGAN (IA, roda na placa de vídeo) e grava WebP otimizado.
# Entrada:  Planta-Interativa\Montemerano\Panoramas-360\*.jpg  (2048×1024)
# Saída:    apresentacao-montemerano\media\360\<nome>.webp       (4096×2048, ~0,8 MB cada)
#           tour\public\360\pano\<nome>-360.webp                  (mesmo arquivo, para o tour)
# Uso:  powershell -File tools\upscale-360.ps1
#       (precisa do realesrgan-ncnn-vulkan.exe: baixe de https://github.com/xinntao/Real-ESRGAN/releases e descompacte em tools\realesrgan, ou passe -ESRGAN <pasta>)
param([string]$ESRGAN = "$PSScriptRoot\realesrgan")   # pasta com realesrgan-ncnn-vulkan.exe e models\ (https://github.com/xinntao/Real-ESRGAN/releases)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$src = "$root\Planta-Interativa\Montemerano\Panoramas-360"
$tmp = "$root\Planta-Interativa\Montemerano\Panoramas-360\x4"
New-Item -ItemType Directory -Force $tmp | Out-Null
$mapa = @{ "living-estar-360" = "living-estar"; "living-jantar-360" = "living-jantar"; "sacada-360" = "sacada"; "suite-master-360" = "suite" }
foreach ($f in Get-ChildItem "$src\*.jpg") {
  $n = $f.BaseName
  Write-Host "Real-ESRGAN x4: $n"
  cmd /c "`"$ESRGAN\realesrgan-ncnn-vulkan.exe`" -i `"$($f.FullName)`" -o `"$tmp\$n.png`" -n realesrgan-x4plus -s 4 -t 512 -g 1 2>nul"
  if (-not (Test-Path "$tmp\$n.png")) { throw "falhou: $n" }
}
python - @"
from PIL import Image; import os, pathlib
root = pathlib.Path(r"$root"); tmp = pathlib.Path(r"$tmp")
mapa = {"living-estar-360":"living-estar","living-jantar-360":"living-jantar","sacada-360":"sacada","suite-master-360":"suite"}
for p in sorted(tmp.glob("*.png")):
    im = Image.open(p).convert("RGB").resize((4096, 2048), Image.LANCZOS)  # 8192 fica pesado e o celular não usa
    out = root/"apresentacao-montemerano"/"media"/"360"/f"{mapa.get(p.stem, p.stem)}.webp"
    im.save(out, quality=86, method=6)
    tour = root/"Planta-Interativa"/"Planta Interativa"/"tour"/"public"/"360"/"pano"/f"{p.stem}.webp"
    tour.parent.mkdir(parents=True, exist_ok=True); im.save(tour, quality=86, method=6)
    print(f"{p.stem:20} -> {out.name} {os.path.getsize(out)//1024} KB, tour {tour.name}")
"@
