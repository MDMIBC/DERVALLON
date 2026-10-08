from math import pow
def c(v):
    v /= 255
    return v / 12.92 if v <= 0.04045 else pow((v + 0.055) / 1.055, 2.4)
def lum(h):
    return sum(w*c(int(h[i:i+2], 16)) for i,w in zip((1,3,5),(0.2126,0.7152,0.0722)))
def r(a,b):
    x,y=lum(a),lum(b)
    return (max(x,y)+.05)/(min(x,y)+.05)
for color in ('#7a6235','#765d32','#6f572f','#8a6a3c'):
    print(color, 'on ivory', round(r(color,'#f5f1e8'),2), 'on navy', round(r(color,'#111b2b'),2))
