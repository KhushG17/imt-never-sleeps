"""Draw the Diwali version of the app icon and write it to assets/icons/diwali/.

The IMT logo keeps its gold torch and "IMT", on a midnight sky with a warm
glow; its four navy dots become four lit diyas (clay lamps). Output sizes
match the standard set:

    icon-192.png  icon-512.png  icon-maskable-512.png  apple-touch-icon.png

Run it (needs Pillow and Playwright, as the other scripts' tests do):

    python scripts/make_diwali_icon.py

To put the icons in use, or to go back to the ordinary ones:

    python scripts/app_icon.py diwali
    python scripts/app_icon.py standard
"""
import base64, io, pathlib, sys
import numpy as np
from PIL import Image, ImageFilter
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "icons" / "diwali"


def logo_cutout():
    """The logo's gold torch and "IMT", lifted off its white background as a crisp alpha mask."""
    im = np.array(Image.open(ROOT / "assets" / "imt-logo.png").convert("RGB")).astype(float)
    part = im[0:150, 38:146]                                   # above the four dots
    alpha = np.clip((255 - part[..., 2]) / (255 - 42), 0, 1)   # gold is (212, 165, 42): its blue channel says how much of the pixel is gold
    img = Image.fromarray((alpha * 255).astype("uint8"), "L")
    # the logo is small, so enlarging it leaves stair-steps: enlarge a lot, blur, then cut the edge sharp again
    big = img.resize((img.width * 8, img.height * 8), Image.BICUBIC).filter(ImageFilter.GaussianBlur(5))
    a = np.asarray(big).astype(float) / 255
    a = np.clip((a - 0.46) / 0.10, 0, 1)
    a = a * a * (3 - 2 * a)
    out = Image.fromarray((a * 255).astype("uint8"), "L")
    rgba = Image.new("RGBA", out.size, (255, 255, 255, 255)); rgba.putalpha(out)
    buf = io.BytesIO(); rgba.save(buf, "PNG")
    return base64.b64encode(buf.getvalue()).decode(), out.size


def diya(x, y, scale=1.0):
    """A clay lamp with a flame, centred on x, resting on y."""
    return f"""
    <g transform="translate({x} {y}) scale({scale})">
      <ellipse cx="0" cy="-34" rx="46" ry="46" fill="url(#flameGlow)"/>
      <path d="M-6 -6 C-26 -26 -12 -50 0 -78 C 12 -50 26 -26 6 -6 Z" fill="url(#flame)"/>
      <path d="M-2.5 -10 C-11 -24 -5 -38 0 -52 C 5 -38 11 -24 2.500 -10 Z" fill="#fff7cc" opacity=".95"/>
      <path d="M-40 -8 C-34 24 34 24 40 -8 Z" fill="url(#clay)"/>
      <path d="M-44 -9 H44" stroke="url(#rim)" stroke-width="6" stroke-linecap="round"/>
      <path d="M40 -8 C52 -9 58 -17 60 -27 C52 -20 46 -18 40 -19 Z" fill="url(#clay)"/>
      <path d="M-22 6 C-10 14 10 14 22 6" stroke="#ffd36b" stroke-width="2.200" stroke-linecap="round" fill="none" opacity=".75"/>
      <circle cx="0" cy="-1" r="2.400" fill="#ffd36b" opacity=".9"/>
    </g>"""


def sparkle(x, y, r, o=1.0):
    """A four-pointed star."""
    return (f'<path d="M{x} {y-r} Q{x+r*.18} {y-r*.18} {x+r} {y} Q{x+r*.18} {y+r*.18} {x} {y+r} '
            f'Q{x-r*.18} {y+r*.18} {x-r} {y} Q{x-r*.18} {y-r*.18} {x} {y-r} Z" fill="#ffe9a8" opacity="{o}"/>')


def svg(mask_b64, size, maskable=False):
    w, h = size
    # logo: 270 tall, centred; its aspect comes from the cutout
    lh = 262; lw = lh * w / h; lx = 256 - lw / 2; ly = 44
    sparks = "".join([sparkle(78, 96, 15), sparkle(438, 70, 11, .9), sparkle(420, 188, 17), sparkle(92, 222, 9, .8),
                      sparkle(462, 300, 8, .8), sparkle(54, 316, 12, .9), sparkle(150, 52, 7, .7), sparkle(366, 40, 8, .8),
                      sparkle(40, 170, 6, .7), sparkle(478, 120, 6, .7)])
    dots = "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#ffd9a0" opacity="{o}"/>' for x, y, r, o in
                   [(120, 160, 2.4, .8), (396, 120, 2.2, .7), (60, 260, 2.2, .6), (452, 232, 2.6, .7), (180, 36, 2, .6), (330, 70, 2, .6), (30, 60, 2.2, .6), (484, 190, 2, .6)])
    scene = f"""
    <g>
      {sparks}{dots}
      <circle cx="256" cy="150" r="150" fill="url(#halo)"/>
      <mask id="logoMask" style="mask-type:alpha"><image href="data:image/png;base64,{mask_b64}" x="{lx}" y="{ly}" width="{lw}" height="{lh}"/></mask>
      <rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="url(#gold)" mask="url(#logoMask)"/>
      <ellipse cx="256" cy="448" rx="190" ry="20" fill="url(#ground)"/>
      {diya(112, 438, 1.0)}{diya(208, 438, 1.0)}{diya(304, 438, 1.0)}{diya(400, 438, 1.0)}
    </g>"""
    if maskable:   # keep everything inside the central 80% circle, so any mask shape leaves it whole
        scene = f'<g transform="translate(256 262) scale(.76) translate(-256 -256)">{scene}</g>'
    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="1024" height="1024">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0f0b33"/><stop offset=".55" stop-color="#26124f"/><stop offset="1" stop-color="#5b1a4a"/>
    </linearGradient>
    <radialGradient id="glow" cx=".5" cy=".92" r=".75">
      <stop offset="0" stop-color="#ff9a2e" stop-opacity=".78"/><stop offset=".45" stop-color="#e2552c" stop-opacity=".3"/><stop offset="1" stop-color="#e2552c" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="halo" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffcf66" stop-opacity=".5"/><stop offset=".55" stop-color="#ff9a2e" stop-opacity=".16"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff0a8"/><stop offset=".35" stop-color="#f4c542"/><stop offset=".75" stop-color="#d4a52a"/><stop offset="1" stop-color="#b9831a"/>
    </linearGradient>
    <radialGradient id="flameGlow" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffd36b" stop-opacity=".7"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd54a"/><stop offset=".6" stop-color="#ff9d1c"/><stop offset="1" stop-color="#ff6a1f"/>
    </linearGradient>
    <linearGradient id="clay" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f08a3c"/><stop offset="1" stop-color="#a8381a"/>
    </linearGradient>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffcf66"/><stop offset=".5" stop-color="#fff0a8"/><stop offset="1" stop-color="#ffcf66"/>
    </linearGradient>
    <radialGradient id="ground" cx=".5" cy=".5" r=".5">
      <stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
  <rect width="512" height="512" fill="url(#glow)"/>
  {scene}
</svg>"""


def main():
    b64, size = logo_cutout()
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [("icon-512.png", 512, False), ("icon-192.png", 192, False), ("apple-touch-icon.png", 180, False), ("icon-maskable-512.png", 512, True)]
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        page = browser.new_page(viewport={"width": 1024, "height": 1024})
        for maskable in (False, True):
            page.set_content('<html><body style="margin:0;background:#000">' + svg(b64, size, maskable) + "</body></html>")
            page.wait_for_timeout(300)
            big = Image.open(io.BytesIO(page.screenshot(clip={"x": 0, "y": 0, "width": 1024, "height": 1024}))).convert("RGB")
            for name, px, m in jobs:
                if m == maskable:
                    big.resize((px, px), Image.LANCZOS).save(OUT / name, "PNG", optimize=True)
                    print("wrote", (OUT / name).relative_to(ROOT), px)
        browser.close()


if __name__ == "__main__":
    sys.exit(main())
