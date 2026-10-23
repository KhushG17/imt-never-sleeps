"""Draw the picture shown when a link to the site is shared (WhatsApp, LinkedIn, X, Slack ...): assets/og-image.png, 1200x630.

    python scripts/make_og_image.py
"""
import base64, pathlib, sys
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
logo = base64.b64encode((ROOT / "assets" / "icons" / "standard" / "icon-512.png").read_bytes()).decode()
HTML = """<html><body style="margin:0"><div style="width:1200px;height:630px;box-sizing:border-box;padding:64px 72px;display:flex;align-items:center;gap:56px;
background:radial-gradient(900px 500px at 85% 15%, #2a3f8f 0%, transparent 60%), linear-gradient(135deg,#0d1b4d 0%,#142a73 55%,#1b3a9a 100%);font-family:'Segoe UI',Arial,sans-serif;color:#fff">
<img src="data:image/png;base64,LOGO" style="width:250px;height:250px;border-radius:56px;flex:none;box-shadow:0 18px 50px rgba(0,0,0,.35)">
<div><div style="font-size:30px;letter-spacing:.18em;text-transform:uppercase;color:#f4c542;font-weight:700">IMT Ghaziabad</div>
<div style="font-size:84px;line-height:1.02;font-weight:800;margin:14px 0 22px;letter-spacing:-.02em">IMT Never<br>Sleeps</div>
<div style="font-size:34px;line-height:1.35;color:#dbe4ff;font-weight:500">Class schedule, exam seat,<br>bus timings and mess menu</div>
<div style="margin-top:26px;font-size:26px;color:#9fb2ee">imtneversleeps.com · free, by roll number</div></div></div></body></html>""".replace("LOGO", logo)
with sync_playwright() as p:
    b = p.chromium.launch(channel="chrome"); pg = b.new_page(viewport={"width": 1200, "height": 630})
    pg.set_content(HTML); pg.wait_for_timeout(300)
    pg.screenshot(path=str(ROOT / "assets" / "og-image.png"), clip={"x": 0, "y": 0, "width": 1200, "height": 630}); b.close()
from PIL import Image   # fewer colours: a small file for chat apps that cap the picture size
Image.open(ROOT / "assets" / "og-image.png").convert("RGB").quantize(colors=128, method=Image.MEDIANCUT).save(ROOT / "assets" / "og-image.png", optimize=True)
print("wrote assets/og-image.png")
