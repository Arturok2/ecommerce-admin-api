import { v2 as cloudinary } from 'cloudinary';

// Se configura una sola vez al importarse este módulo (side-effect), igual
// que ya hace `dotenv/config` en prisma.service.ts. Las 3 variables deben
// existir en el .env (ver README de este módulo / mensaje de Claude).
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };
