/**
 * Image transformation options for Cloudinary
 */
export interface ImageTransformationOptions {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Crop mode: 'fill', 'fit', 'scale', 'crop', 'thumb' */
  crop?: 'fill' | 'fit' | 'scale' | 'crop' | 'thumb';
  /** Gravity for crop: 'face', 'auto', 'center', etc. */
  gravity?: 'face' | 'auto' | 'center' | 'north' | 'south' | 'east' | 'west';
  /** Quality: 'auto', 'auto:best', 'auto:good', 'auto:eco', 'auto:low', or number 1-100 */
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number;
  /** Format: 'jpg', 'png', 'webp', 'avif', 'auto' */
  format?: 'jpg' | 'png' | 'webp' | 'avif' | 'auto';
  /** Aspect ratio: '16:9', '1:1', '4:3', etc. */
  aspectRatio?: string;
  /** Radius for rounded corners */
  radius?: number | 'max';
  /** Effect: 'blur', 'sharpen', 'grayscale', 'sepia', etc. */
  effect?: string;
}
