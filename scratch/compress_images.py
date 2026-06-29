import os
from PIL import Image

def compress_hero():
    png_path = "/Users/aryansingh/Developer/blumi/public/hero-streetwear.png"
    webp_path = "/Users/aryansingh/Developer/blumi/public/hero-streetwear.webp"
    
    if os.path.exists(png_path):
        print(f"Compressing hero image: {png_path}...")
        orig_size = os.path.getsize(png_path)
        img = Image.open(png_path)
        img.save(webp_path, "WEBP", quality=80, optimize=True)
        new_size = os.path.getsize(webp_path)
        reduction = (orig_size - new_size) / orig_size * 100
        print(f"Hero Image compressed successfully!")
        print(f"Original size: {orig_size / 1024 / 1024:.2f} MB")
        print(f"New size (WebP): {new_size / 1024 / 1024:.2f} MB ({reduction:.1f}% reduction)")
    else:
        print(f"Hero image not found at {png_path}")

def compress_collages():
    public_dir = "/Users/aryansingh/Developer/blumi/public"
    for i in range(1, 7):
        filename = f"collage-{i}.jpg"
        filepath = os.path.join(public_dir, filename)
        webp_path = os.path.join(public_dir, f"collage-{i}.webp")
        if os.path.exists(filepath):
            orig_size = os.path.getsize(filepath)
            img = Image.open(filepath)
            img.save(webp_path, "WEBP", quality=75, optimize=True)
            new_size = os.path.getsize(webp_path)
            reduction = (orig_size - new_size) / orig_size * 100
            print(f"collage-{i}.webp created:")
            print(f"  Original JPG: {orig_size / 1024:.1f} KB")
            print(f"  WebP Size: {new_size / 1024:.1f} KB ({reduction:.1f}% reduction)")
        else:
            print(f"Collage not found: {filepath}")

if __name__ == "__main__":
    compress_hero()
    compress_collages()
