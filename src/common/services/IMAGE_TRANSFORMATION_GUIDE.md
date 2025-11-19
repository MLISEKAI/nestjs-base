# 🎨 Hướng dẫn Image Transformation

## 📋 Tổng quan

Upload service đã hỗ trợ **image transformation** với Cloudinary, cho phép resize, crop, thay đổi quality, format, và nhiều effects khác ngay khi upload.

---

## 🚀 Cách sử dụng

### **1. Upload ảnh với Resize**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "width=800" \
  -F "height=600" \
  -F "crop=fill"
```

**Response:**

```json
{
  "url": "https://res.cloudinary.com/.../image/upload/w_800,h_600,c_fill/...",
  "filename": "photo.jpg",
  "size": 12345,
  "mimetype": "image/jpeg",
  "transformation": {
    "width": 800,
    "height": 600,
    "crop": "fill"
  }
}
```

---

### **2. Upload với Quality và Format**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "quality=auto" \
  -F "format=webp"
```

**Kết quả:** Ảnh được convert sang WebP với quality tự động optimize.

---

### **3. Upload với Aspect Ratio**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "width=800" \
  -F "aspectRatio=16:9" \
  -F "crop=fill"
```

**Kết quả:** Ảnh được crop theo tỷ lệ 16:9.

---

### **4. Upload với Rounded Corners**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "radius=20"
```

**Kết quả:** Ảnh có góc bo tròn 20px.

---

### **5. Upload với Effects**

```bash
# Grayscale
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "effect=grayscale"

# Blur
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "effect=blur:300"

# Sepia
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "effect=sepia"
```

---

### **6. Upload với Face Detection**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "width=400" \
  -F "height=400" \
  -F "crop=thumb" \
  -F "gravity=face"
```

**Kết quả:** Ảnh được crop tự động focus vào khuôn mặt.

---

## 📝 Transformation Options

### **Width & Height**

- **Type:** `number`
- **Range:** 1-5000 pixels
- **Example:** `width=800`, `height=600`

### **Crop Mode**

- **Type:** `enum`
- **Values:** `fill`, `fit`, `scale`, `crop`, `thumb`
- **Description:**
  - `fill`: Fill dimensions, may crop
  - `fit`: Fit within dimensions, no crop
  - `scale`: Scale to fit, maintain aspect ratio
  - `crop`: Crop to exact dimensions
  - `thumb`: Smart crop for thumbnails

### **Gravity**

- **Type:** `enum`
- **Values:** `face`, `auto`, `center`, `north`, `south`, `east`, `west`
- **Description:** Vị trí crop, `face` để tự động detect khuôn mặt

### **Quality**

- **Type:** `string` hoặc `number`
- **Values:**
  - `auto`: Tự động optimize
  - `auto:best`: Chất lượng tốt nhất
  - `auto:good`: Chất lượng tốt
  - `auto:eco`: Tiết kiệm bandwidth
  - `auto:low`: Chất lượng thấp
  - `1-100`: Số cụ thể (1 = thấp nhất, 100 = cao nhất)

### **Format**

- **Type:** `enum`
- **Values:** `jpg`, `png`, `webp`, `avif`, `auto`
- **Description:** Format output, `auto` để tự động chọn format tốt nhất

### **Aspect Ratio**

- **Type:** `string`
- **Format:** `width:height` (e.g., `16:9`, `1:1`, `4:3`)
- **Example:** `aspectRatio=16:9`

### **Radius**

- **Type:** `string` (number hoặc "max")
- **Description:** Bo góc tròn (pixels)
- **Example:** `radius=20`, `radius=max`

### **Effect**

- **Type:** `string`
- **Examples:**
  - `grayscale`: Chuyển sang đen trắng
  - `sepia`: Hiệu ứng sepia
  - `blur:300`: Làm mờ (300 = độ mờ)
  - `sharpen`: Làm sắc nét
  - `vignette`: Hiệu ứng vignette

---

## 🎯 Use Cases

### **Avatar Upload**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@avatar.jpg" \
  -F "folder=avatars" \
  -F "width=200" \
  -F "height=200" \
  -F "crop=fill" \
  -F "gravity=face" \
  -F "format=webp" \
  -F "quality=auto"
```

### **Thumbnail Upload**

```bash
curl -X POST http://localhost:3001/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "folder=thumbnails" \
  -F "width=300" \
  -F "height=300" \
  -F "crop=thumb" \
  -F "quality=auto:good"
```

### **Gallery Upload (Multiple)**

```bash
curl -X POST http://localhost:3001/upload/images \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.jpg" \
  -F "folder=gallery" \
  -F "width=1200" \
  -F "format=webp" \
  -F "quality=auto"
```

---

## 📊 API Endpoints

### **POST /upload/image**

Upload một ảnh với transformation options.

**Request Body (multipart/form-data):**

- `file` (required): File ảnh
- `folder` (optional): Thư mục lưu trữ
- `width` (optional): Width in pixels
- `height` (optional): Height in pixels
- `crop` (optional): Crop mode
- `gravity` (optional): Gravity for crop
- `quality` (optional): Quality setting
- `format` (optional): Output format
- `aspectRatio` (optional): Aspect ratio
- `radius` (optional): Rounded corners
- `effect` (optional): Image effect

### **POST /upload/images**

Upload nhiều ảnh với transformation options (tối đa 10 files).

**Request Body (multipart/form-data):**

- `files` (required): Array of files
- `folder` (optional): Thư mục lưu trữ
- `width`, `height`, `crop`, `quality`, `format` (optional): Transformation options

---

## ✅ Benefits

1. **Performance:** Images được optimize ngay khi upload
2. **Bandwidth:** Tự động chọn format tốt nhất (WebP, AVIF)
3. **Consistency:** Tất cả images có cùng size/format
4. **User Experience:** Không cần xử lý image ở client
5. **Storage:** Tiết kiệm storage với format tối ưu

---

## 🔗 References

- Cloudinary Transformations: https://cloudinary.com/documentation/image_transformations
- Cloudinary Upload API: https://cloudinary.com/documentation/upload_images
