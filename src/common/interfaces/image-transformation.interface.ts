/**
 * ImageTransformationOptions - Interface cho Cloudinary image transformation options
 *
 * Lưu ý:
 * - Tất cả fields đều optional
 * - Sử dụng trong CloudinaryService để transform images
 * - Hỗ trợ nhiều transformations: resize, crop, quality, format, aspect ratio, radius, effects
 */
export interface ImageTransformationOptions {
  /** Width in pixels (optional) */
  readonly width?: number;
  /** Height in pixels (optional) */
  readonly height?: number;
  /** Crop mode: 'fill', 'fit', 'scale', 'crop', 'thumb' (optional) */
  readonly crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  /** Gravity for crop: 'face', 'auto', 'center', 'north', 'south', 'east', 'west' (optional) */
  readonly gravity?: 'face' | 'auto' | 'center' | 'north' | 'south' | 'east' | 'west';
  /** Quality: 'auto', 'auto:best', 'auto:good', 'auto:eco', 'auto:low', or number 1-100 (optional) */
  readonly quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  /** Format: 'jpg', 'png', 'webp', 'avif', 'auto' (optional) */
  readonly format?: 'jpg' | 'png' | 'webp' | 'avif' | 'auto';
  /** Aspect ratio: '16:9', '1:1', '4:3', etc. (optional) */
  readonly aspectRatio?: string;
  /** Radius for rounded corners: number hoặc 'max' (optional) */
  readonly radius?: number | 'max';
  /** Effect: 'blur', 'sharpen', 'grayscale', 'sepia', etc. (optional) */
  readonly effect?: string;
}
