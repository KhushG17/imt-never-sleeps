"""Choose which app icon is in use: the ordinary one or a festival one.

    python scripts/app_icon.py diwali      # the Diwali icons (assets/icons/diwali/)
    python scripts/app_icon.py standard    # back to the ordinary icons (assets/icons/standard/)

The four files in assets/icons/<set>/ are copied over the ones the site uses
(assets/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png),
and every address that points at them gets "?v=<set>", so phones and browsers
fetch the new picture instead of a copy they kept. The tab icon (the plain
logo, assets/imt-logo.png) is left as it is.

A phone that already has the app: Android updates the icon by itself within a
day or two; an iPhone keeps the icon it was given when the app was added, so
the app has to be removed and added again to get the new one.
"""
import pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FILES = ["icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"]
ADDRESS = re.compile(r"(assets/(?:icon-192|icon-512|icon-maskable-512|apple-touch-icon)\.png)(\?v=[A-Za-z0-9._-]+)?")


def main(argv):
    if len(argv) != 2 or not (ROOT / "assets" / "icons" / argv[1]).is_dir():
        sets = sorted(p.name for p in (ROOT / "assets" / "icons").iterdir() if p.is_dir())
        print("usage: python scripts/app_icon.py <%s>" % "|".join(sets)); return 1
    name = argv[1]; src = ROOT / "assets" / "icons" / name
    missing = [f for f in FILES if not (src / f).exists()]
    if missing:
        print("the %s set is missing: %s" % (name, ", ".join(missing))); return 1
    for f in FILES:
        shutil.copyfile(src / f, ROOT / "assets" / f)
    changed = []
    for path in [ROOT / "manifest.webmanifest", ROOT / "js" / "install.js"] + sorted(ROOT.glob("*/index.html")) + [ROOT / "index.html"]:
        text = path.read_text(encoding="utf-8")
        new = ADDRESS.sub(lambda m: m.group(1) + "?v=" + name, text)
        if new != text:
            path.write_text(new, encoding="utf-8", newline="\n"); changed.append(path.relative_to(ROOT).as_posix())
    print("app icon set to %s; addresses updated in: %s" % (name, ", ".join(changed) or "nothing (already set)"))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
