import { BadRequestException, Injectable } from '@nestjs/common';
import { Readable } from 'stream';
import { cloudinary } from './cloudinary.config';

export interface UploadImageResult {
  url: string;
  publicId: string;
}

@Injectable()
export class UploadsService {
  // Carpeta dentro de tu cuenta de Cloudinary donde caerán todas las
  // imágenes de producto — así se ven organizadas en su dashboard y no
  // mezcladas con otros usos futuros de la misma cuenta.
  private readonly folder = 'ecommerce-admin/products';

  uploadImage(file?: Express.Multer.File): Promise<UploadImageResult> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    return new Promise<UploadImageResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: 'image',
          // Cloudinary optimiza automáticamente formato y calidad de salida
          // (ej. entrega WebP a navegadores que lo soportan) sin tocar el
          // archivo que subió el usuario.
          transformation: [{ fetch_format: 'auto', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            reject(new BadRequestException(error?.message ?? 'No se pudo subir la imagen'));
            return;
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }
}
