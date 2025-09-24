#!/usr/bin/env python3
"""
prepare_yolo_dataset.py
Usage examples (Windows):
1) If images+labels are in one folder and you want 80/20 split:
   python prepare_yolo_dataset.py --src "C:\path\to\my_all_images_and_labels" --dest datasets\guns_dataset --val 0.2

2) If images and labels are in separate folders:
   python prepare_yolo_dataset.py --src_images "C:\images" --src_labels "C:\labels" --dest datasets\guns_dataset --val 0.2

3) If your data is ALREADY split like src\train, src\val:
   python prepare_yolo_dataset.py --src "C:\mydata" --already_split
"""
import os, shutil, random, argparse, glob

IMG_EXTS = ('.jpg','.jpeg','.png','.bmp','.tif','.tiff')

def is_image(fn): return fn.lower().endswith(IMG_EXTS)

def copy_pairs(pairs, dst_img_dir, dst_label_dir, create_empty=False):
    os.makedirs(dst_img_dir, exist_ok=True)
    os.makedirs(dst_label_dir, exist_ok=True)
    missing_labels = []
    for img_path in pairs:
        base = os.path.basename(img_path)
        name = os.path.splitext(base)[0]
        label_name = name + '.txt'
        # copy image
        shutil.copy2(img_path, os.path.join(dst_img_dir, base))
        # copy label if exists
        if os.path.exists(os.path.join(args.src_labels or args.src, label_name)):
            shutil.copy2(os.path.join(args.src_labels or args.src, label_name), os.path.join(dst_label_dir, label_name))
        else:
            if create_empty:
                open(os.path.join(dst_label_dir, label_name), 'w').close()
            else:
                missing_labels.append(label_name)
    return missing_labels

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--src', help='Source folder (images and labels together OR contains train/val if --already_split)', default=None)
    parser.add_argument('--src_images', help='Source images folder (optional)', default=None)
    parser.add_argument('--src_labels', help='Source labels folder (optional)', default=None)
    parser.add_argument('--dest', help='Destination dataset root', default='datasets/guns_dataset')
    parser.add_argument('--val', type=float, help='Validation split ratio (0-1)', default=0.2)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--create_empty_labels', action='store_true', help='Create empty .txt files for images with no label')
    parser.add_argument('--already_split', action='store_true', help='If src has train/val subfolders already')
    args = parser.parse_args()

    random.seed(args.seed)
    # dirs:
    dest_img_train = os.path.join(args.dest, 'images', 'train')
    dest_img_val   = os.path.join(args.dest, 'images', 'val')
    dest_lbl_train = os.path.join(args.dest, 'labels', 'train')
    dest_lbl_val   = os.path.join(args.dest, 'labels', 'val')

    # Case A: already split inside src into train/val
    if args.already_split:
        if not args.src:
            raise SystemExit("When using --already_split provide --src path containing train/ and val/")
        for split in ('train','val'):
            s_img = os.path.join(args.src, 'images', split)
            s_lbl = os.path.join(args.src, 'labels', split)
            d_img = os.path.join(args.dest, 'images', split)
            d_lbl = os.path.join(args.dest, 'labels', split)
            os.makedirs(d_img, exist_ok=True); os.makedirs(d_lbl, exist_ok=True)
            if os.path.isdir(s_img):
                imgs = [os.path.join(s_img,f) for f in os.listdir(s_img) if is_image(f)]
                for imgp in imgs:
                    shutil.copy2(imgp, d_img)
                    name = os.path.splitext(os.path.basename(imgp))[0]
                    lbl = os.path.join(s_lbl, name + '.txt')
                    if os.path.exists(lbl):
                        shutil.copy2(lbl, d_lbl)
                    elif args.create_empty_labels:
                        open(os.path.join(d_lbl, name + '.txt'), 'w').close()
                print(f"Copied {len(imgs)} images for {split}")
            else:
                print(f"Missing directory: {s_img}")
        print("Done (already_split).")
        raise SystemExit(0)

    # Case B: single images folder (labels maybe same folder or separate)
    src_images = args.src_images or args.src
    if not src_images:
        raise SystemExit("Provide --src_images or --src (single-folder mode)")

    all_imgs = [os.path.join(src_images,f) for f in os.listdir(src_images) if is_image(f)]
    if len(all_imgs) == 0:
        raise SystemExit("No images found in " + src_images)

    random.shuffle(all_imgs)
    n_val = max(1, int(len(all_imgs) * args.val))
    val_imgs = all_imgs[:n_val]
    train_imgs = all_imgs[n_val:]

    missing_train = copy_pairs(train_imgs, dest_img_train, dest_lbl_train, create_empty=args.create_empty_labels)
    missing_val   = copy_pairs(val_imgs,   dest_img_val,   dest_lbl_val,   create_empty=args.create_empty_labels)

    print(f"Total images: {len(all_imgs)} (train: {len(train_imgs)}, val: {len(val_imgs)})")
    if missing_train or missing_val:
        print("Warning - missing labels for some images. Use --create_empty_labels to create empty .txt files if those images have no objects.")
        print("Missing examples (showing first 10):", (missing_train + missing_val)[:10])
    print("Done. Destination:", os.path.abspath(args.dest))
