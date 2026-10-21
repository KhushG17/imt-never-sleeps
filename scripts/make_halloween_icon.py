"""Draw the Halloween version of the app icon and write it to assets/icons/halloween/.

The IMT logo keeps its gold torch and "IMT", on a night sky with a big orange
moon, a few bats, and its four navy dots become four glowing jack-o'-lanterns.
Output sizes match the standard set:

    icon-192.png  icon-512.png  icon-maskable-512.png  apple-touch-icon.png

    python scripts/make_halloween_icon.py

To put the icons in use, or to go back to the ordinary ones:

    python scripts/app_icon.py halloween
    python scripts/app_icon.py standard
"""
import io, pathlib, sys
from PIL import Image
from playwright.sync_api import sync_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from make_diwali_icon import logo_cutout, sparkle     # the same crisp cut-out of the logo

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "icons" / "halloween"


def pumpkin(x, y, s=1.0, face=True):
    """A jack-o'-lantern centred on x, resting on y."""
    eyes = ('<path d="M-17 -27 -5 -27 -11 -37Z M5 -27 17 -27 11 -37Z" fill="#fff0a8"/>'
            '<path d="M-17 -14 -10 -9 -3 -14 3 -9 10 -14 17 -9 17 -4 -17 -4Z" fill="#fff0a8" transform="translate(0 4)"/>') if face else ""
    return f"""
    <g transform="translate({x} {y}) scale({s})">
      <ellipse cx="0" cy="-26" rx="52" ry="42" fill="url(#pglow)"/>
      <ellipse cx="-22" cy="-24" rx="22" ry="26" fill="url(#pump)"/><ellipse cx="22" cy="-24" rx="22" ry="26" fill="url(#pump)"/>
      <ellipse cx="0" cy="-24" rx="20" ry="28" fill="url(#pump2)"/>
      <path d="M-4 -52 C-6 -62 2 -68 8 -70 C6 -64 8 -58 5 -52Z" fill="#4a7a2a"/>
      {eyes}
    </g>"""


def bat(x, y, s=1.0, r=0):
    return (f'<g transform="translate({x} {y}) rotate({r}) scale({s})" fill="#05020d">'
            '<path d="M0 -4 C6 -14 16 -18 30 -14 C24 -10 24 -4 20 2 C16 -4 10 -4 8 2 C6 6 2 6 0 2 C-2 6 -6 6 -8 2 C-10 -4 -16 -4 -20 2 C-24 -4 -24 -10 -30 -14 C-16 -18 -6 -14 0 -4Z"/>'
            '<path d="M-4 -6 -3 -13 0 -8 3 -13 4 -6Z"/></g>')


def svg(mask_b64, size, maskable=False):
    w, h = size
    lh = 250; lw = lh * w / h; lx = 256 - lw / 2; ly = 54
    stars = "".join(sparkle(x, y, r, o) for x, y, r, o in [(66, 70, 11, .8), (446, 54, 9, .8), (96, 214, 8, .7), (470, 232, 10, .7), (40, 150, 6, .6), (190, 30, 6, .6)])
    bats = bat(92, 128, 1.0, -14) + bat(420, 150, .85, 12) + bat(372, 52, .6, -8) + bat(150, 44, .55, 10)
    scene = f"""
    <g>
      {stars}
      <circle cx="256" cy="168" r="176" fill="url(#moon)"/>
      <mask id="logoMask" style="mask-type:alpha"><image href="data:image/png;base64,{mask_b64}" x="{lx}" y="{ly}" width="{lw}" height="{lh}"/></mask>
      <rect x="{lx}" y="{ly}" width="{lw}" height="{lh}" fill="url(#gold)" mask="url(#logoMask)"/>
      {bats}
      <path d="M0 468 Q128 436 256 456 T512 450 V512 H0Z" fill="#05020d"/>
      {pumpkin(104, 462, 1.0)}{pumpkin(206, 470, .8)}{pumpkin(306, 470, .8)}{pumpkin(408, 462, 1.0)}
    </g>"""
    if maskable:
        scene = f'<g transform="translate(256 262) scale(.76) translate(-256 -256)">{scene}</g>'
    return f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="1024" height="1024">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b0620"/><stop offset=".6" stop-color="#27103f"/><stop offset="1" stop-color="#4a1a3a"/></linearGradient>
    <radialGradient id="moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff9a2e" stop-opacity=".62"/><stop offset=".55" stop-color="#e2552c" stop-opacity=".22"/><stop offset="1" stop-color="#e2552c" stop-opacity="0"/></radialGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0a8"/><stop offset=".35" stop-color="#f4c542"/><stop offset=".75" stop-color="#d4a52a"/><stop offset="1" stop-color="#b9831a"/></linearGradient>
    <radialGradient id="pglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb347" stop-opacity=".55"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="pump" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a2e"/><stop offset="1" stop-color="#d4501a"/></linearGradient>
    <linearGradient id="pump2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#e2641e"/></linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#sky)"/>
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
