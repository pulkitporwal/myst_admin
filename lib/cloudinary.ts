import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  public_id: string;
  secure_url: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

export const uploadToCloudinary = async (
  file: Buffer,
  folder: string = 'myst-content',
  resourceType: 'image' | 'video' | 'auto' = 'auto'
): Promise<UploadResult> => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm'],
          transformation: resourceType === 'image' ? [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ] : undefined,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({
              public_id: result.public_id,
              secure_url: result.secure_url,
              format: result.format,
              width: result.width,
              height: result.height,
              resource_type: result.resource_type,
            });
          } else {
            reject(new Error('Upload failed'));
          }
        }
      );

      uploadStream.end(file);
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete file from Cloudinary');
  }
};

export const generateThumbnail = async (
  publicId: string,
  resourceType: 'image' | 'video' = 'image'
): Promise<string> => {
  try {
    const transformation = resourceType === 'video' 
      ? { width: 300, height: 300, crop: 'thumb', quality: 'auto:good' }
      : { width: 300, height: 300, crop: 'fill', quality: 'auto:good' };

    const url = cloudinary.url(publicId, {
      transformation: [transformation],
      secure: true,
    });

    return url;
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw new Error('Failed to generate thumbnail');
  }
}; 