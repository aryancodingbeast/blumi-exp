from PIL import Image

def remove_background(image_path, output_path):
    print(f"Loading image from {image_path}...")
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        # If the pixel is close to pure white, let's make it transparent
        # Using a smooth threshold to avoid jagged borders (anti-aliasing)
        min_val = min(r, g, b)
        max_val = max(r, g, b)
        
        # Check if the pixel is close to grayscale white
        if min_val > 230 and (max_val - min_val) < 15:
            # Calculate transparency factor
            # 255 -> 0 alpha
            # 230 -> full alpha
            factor = (min_val - 230) / (255 - 230)
            new_alpha = int(255 * (1.0 - factor))
            
            # Clamp alpha to 0-255
            new_alpha = max(0, min(new_alpha, 255))
            
            if new_alpha == 0:
                new_data.append((0, 0, 0, 0))
            else:
                new_data.append((r, g, b, new_alpha))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Successfully saved transparent image to {output_path}!")

if __name__ == "__main__":
    remove_background(
        "/Users/aryansingh/Developer/blumi/public/hero-streetwear.png",
        "/Users/aryansingh/Developer/blumi/public/hero-streetwear.png"
    )
