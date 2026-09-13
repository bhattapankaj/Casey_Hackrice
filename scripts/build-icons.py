"""Build Casey's icon set from the original transparent card artwork.

Source of truth is images/casey-card.png, which is never modified. The artwork is
tilted ~9.8 degrees and carries a soft drop shadow, so it is levelled and the
shadow is removed before any icon is cut.

At 16 and 32px the two mirrored handsets and the corner indices collapse into
noise, so those sizes get a simplified variant: the same cream card and gold rule
with a single handset lifted from the artwork.

Every favicon size sits on a rounded felt plate. A cream card on transparency
vanishes against a light tab strip, which is the whole job of a favicon.
"""

import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "images" / "casey-card.png"
PUBLIC = ROOT / "public"

CREAM = (245, 239, 224, 255)
GOLD = (207, 156, 45, 255)
FELT = (53, 106, 80, 255)

TILT = -9.8          # clockwise, levels the card
CARD_FRACTION = 0.92  # card height as a share of the square canvas


def upright_card() -> Image.Image:
    src = Image.open(SRC).convert("RGBA")
    up = src.rotate(TILT, resample=Image.BICUBIC, expand=True)
    r, g, b, a = up.split()
    # Low alpha is drop shadow, high alpha is card. Remap so the shadow drops out
    # while the card's antialiased edge survives.
    a = a.point(lambda p: 0 if p <= 110 else (255 if p >= 205 else int((p - 110) * 255 / 95)))
    up = Image.merge("RGBA", (r, g, b, a))
    return up.crop(a.getbbox())


def largest_handset(card: Image.Image) -> Image.Image:
    """Return the biggest red blob, which is one of the two central handsets."""
    w, h = card.size
    px = card.load()
    red = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 150 and r > 130 and g < 95 and b < 95:
                red[y * w + x] = 1

    best: list[tuple[int, int]] = []
    seen = bytearray(w * h)
    for start in range(w * h):
        if not red[start] or seen[start]:
            continue
        stack = [start]
        seen[start] = 1
        blob: list[tuple[int, int]] = []
        while stack:
            i = stack.pop()
            y, x = divmod(i, w)
            blob.append((x, y))
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < w and 0 <= ny < h:
                    j = ny * w + nx
                    if red[j] and not seen[j]:
                        seen[j] = 1
                        stack.append(j)
        if len(blob) > len(best):
            best = blob

    xs = [p[0] for p in best]
    ys = [p[1] for p in best]
    box = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    glyph = Image.new("RGBA", (box[2] - box[0], box[3] - box[1]), (0, 0, 0, 0))
    gp = glyph.load()
    for x, y in best:
        gp[x - box[0], y - box[1]] = px[x, y]
    return glyph


def felt_tile(px: int) -> Image.Image:
    """Rounded felt plate. A bare cream card disappears on a light tab strip."""
    scale = 8
    big = px * scale
    tile = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(tile).rounded_rectangle(
        [0, 0, big - 1, big - 1], radius=round(big * 0.22), fill=FELT
    )
    return tile.resize((px, px), Image.LANCZOS)


def full_icon(card: Image.Image, px: int, plate=None, fraction: float = CARD_FRACTION) -> Image.Image:
    if plate is None:
        canvas = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    elif isinstance(plate, Image.Image):
        canvas = plate.copy()
    else:
        canvas = Image.new("RGBA", (px, px), plate)
    h = round(px * fraction)
    w = round(card.width / card.height * h)
    canvas.alpha_composite(card.resize((w, h), Image.LANCZOS), ((px - w) // 2, (px - h) // 2))
    return canvas


def simple_icon(
    handset: Image.Image, px: int, plate=None, fraction: float = CARD_FRACTION
) -> Image.Image:
    """Simplified small variant, drawn at 8x then downsampled for clean edges."""
    scale = 8
    big = px * scale
    canvas = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    ch = round(big * fraction)
    cw = round(ch * 0.70)
    x0 = (big - cw) // 2
    y0 = (big - ch) // 2
    radius = round(ch * 0.09)
    draw.rounded_rectangle([x0, y0, x0 + cw, y0 + ch], radius=radius, fill=CREAM)

    inset = round(ch * 0.055)
    draw.rounded_rectangle(
        [x0 + inset, y0 + inset, x0 + cw - inset, y0 + ch - inset],
        radius=round(radius * 0.7),
        outline=GOLD,
        width=max(2, round(ch * 0.022)),
    )

    gh = round(ch * 0.52)
    gw = round(handset.width / handset.height * gh)
    if gw > cw - inset * 4:
        gw = cw - inset * 4
        gh = round(handset.height / handset.width * gw)
    canvas.alpha_composite(
        handset.resize((gw, gh), Image.LANCZOS),
        ((big - gw) // 2, (big - gh) // 2),
    )

    out = canvas.resize((px, px), Image.LANCZOS)
    if plate is None:
        return out
    base = plate.copy() if isinstance(plate, Image.Image) else Image.new("RGBA", (px, px), plate)
    base.alpha_composite(out)
    return base


def write_ico(path: Path, images: list[Image.Image]) -> None:
    """ICO with per-size artwork, each entry stored as PNG (Vista and later)."""
    blobs = []
    for img in images:
        from io import BytesIO

        buf = BytesIO()
        img.save(buf, format="PNG")
        blobs.append(buf.getvalue())

    header = struct.pack("<HHH", 0, 1, len(images))
    offset = len(header) + 16 * len(images)
    entries = b""
    for img, blob in zip(images, blobs):
        entries += struct.pack(
            "<BBBBHHII",
            img.width if img.width < 256 else 0,
            img.height if img.height < 256 else 0,
            0, 0, 1, 32, len(blob), offset,
        )
        offset += len(blob)
    path.write_bytes(header + entries + b"".join(blobs))


def main() -> None:
    card = upright_card()
    handset = largest_handset(card)
    print(f"upright card {card.size}  handset {handset.size}")

    ico16 = simple_icon(handset, 16, plate=felt_tile(16), fraction=0.84)
    ico32 = simple_icon(handset, 32, plate=felt_tile(32), fraction=0.82)
    ico48 = full_icon(card, 48, plate=felt_tile(48), fraction=0.80)

    ico16.save(PUBLIC / "favicon-16x16.png")
    ico32.save(PUBLIC / "favicon-32x32.png")
    write_ico(PUBLIC / "favicon.ico", [ico16, ico32, ico48])

    # iOS composites the touch icon on an opaque tile, so give it the felt plate.
    full_icon(card, 180, plate=FELT).save(PUBLIC / "apple-touch-icon.png")

    # Web copy of the artwork for the wordmark, still tilted as designed.
    web = Image.open(SRC).convert("RGBA")
    r, g, b, a = web.split()
    a2 = a.point(lambda p: 255 if p > 12 else 0)
    web = web.crop(a2.getbbox())
    web.thumbnail((460, 460), Image.LANCZOS)
    web.save(PUBLIC / "casey-card.png", optimize=True)

    for name in ("favicon-16x16.png", "favicon-32x32.png", "favicon.ico", "apple-touch-icon.png", "casey-card.png"):
        print(f"  {name:24s} {(PUBLIC / name).stat().st_size:>7,d} bytes")


if __name__ == "__main__":
    main()
