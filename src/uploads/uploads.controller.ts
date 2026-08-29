import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadImageResult, UploadsService } from './uploads.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // Protegido con JwtAuthGuard, igual que el resto de rutas de escritura:
  // solo un admin autenticado puede subir imágenes a tu cuenta de
  // Cloudinary. memoryStorage() mantiene el archivo en RAM (file.buffer)
  // en vez de escribirlo a disco — no necesitas limpiar archivos temporales
  // y funciona igual en un host efímero como Render.
  @Post('image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException('Formato no soportado. Usa JPG, PNG, WEBP o GIF.'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File): Promise<UploadImageResult> {
    return this.uploadsService.uploadImage(file);
  }
}
