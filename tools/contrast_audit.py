from math import pow

def channel(value):
    value /= 255
    return value / 12.92 if value <= 0.04045 else pow((value + 0.055) / 1.055, 2.4)

def luminance(hex_color):
    rgb = [int(hex_color[i:i+2], 16) for i in (1, 3, 5)]
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2])

def ratio(foreground, background):
    a, b = luminance(foreground), luminance(background)
    return (max(a, b) + 0.05) / (min(a, b) + 0.05)

pairs = {
    "ink on ivory": ("#1e2430", "#f5f1e8"),
    "muted on ivory": ("#666666", "#f5f1e8"),
    "navy on ivory": ("#111b2b", "#f5f1e8"),
    "ivory on navy": ("#f5f1e8", "#111b2b"),
    "brass on navy": ("#a48a60", "#111b2b"),
    "dark brass on ivory": ("#7a6235", "#f5f1e8"),
    "stone on navy": ("#b8b0a3", "#111b2b"),
}
for name, (fg, bg) in pairs.items():
    print(f"{name}: {ratio(fg, bg):.2f}:1")
