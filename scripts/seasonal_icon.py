"""Put the right app icon in use for today's date (India time).

The festival dates live in js/portal-config.js (festival.themes, each with a
name, from and until). On a day inside one of them the icon set of that name in
assets/icons/ is put in use; on any other day the ordinary one is. The same
dates switch the page decorations on by themselves, so the two stay in step.

    python scripts/seasonal_icon.py              # for today
    python scripts/seasonal_icon.py 2026-11-01   # as if it were that day
    python scripts/seasonal_icon.py --which      # only say which set it would use

.github/workflows/seasonal-icon.yml runs this every night at 23:40
India time for the day about to begin, and commits the change, so nobody has to remember. (Install
buttons on phones: Android refreshes the icon by itself within a day or two;
an iPhone keeps the icon the app was added with.)
"""
import datetime, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = re.compile(r'\{[^{}]*?name:\s*"(\w+)"[^{}]*?from:\s*"([\d-]+)"[^{}]*?until:\s*"([\d-]+)"[^{}]*?\}')


def themes():
    text = (ROOT / "js" / "portal-config.js").read_text(encoding="utf-8")
    block = text[text.index("festival:"):]
    block = block[:block.index("\n\n")] if "\n\n" in block else block
    return THEME.findall(block)


def which(day):
    for name, start, end in themes():
        if start <= day <= end and (ROOT / "assets" / "icons" / name).is_dir():
            return name
    return "standard"


def main(argv):
    only = "--which" in argv
    args = [a for a in argv[1:] if not a.startswith("--")]
    ist = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
    day = args[0] if args else datetime.datetime.now(ist).date().isoformat()
    name = which(day)
    print("%s -> %s" % (day, name))
    if only:
        return 0
    return subprocess.call([sys.executable, str(ROOT / "scripts" / "app_icon.py"), name])


if __name__ == "__main__":
    sys.exit(main(sys.argv))
