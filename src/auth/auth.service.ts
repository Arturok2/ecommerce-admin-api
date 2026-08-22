import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Admin } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface LoginResponse {
  access_token: string;
  admin: {
    id: string;
    email: string;
  };
}

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Busca al admin por email y compara el password ingresado
   * contra el hash almacenado. Retorna el admin si es válido.
   */
  async validateUser(email: string, password: string): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return admin;
  }

  /**
   * Genera y firma el JWT con el id y email del admin en el payload.
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const admin = await this.validateUser(email, password);

    const payload: JwtPayload = {
      sub: admin.id,
      email: admin.email,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      admin: {
        id: admin.id,
        email: admin.email,
      },
    };
  }

  /**
   * Estrategia de semilla: si la tabla Admin está vacía, crea un
   * administrador por defecto para que el evaluador pueda iniciar sesión.
   * Se recomienda invocar este método en un bootstrap/seed script,
   * o desde OnModuleInit de un módulo de arranque.
   */
  async createFirstAdmin(): Promise<void> {
    const adminCount = await this.prisma.admin.count();

    if (adminCount > 0) {
      return;
    }

    const defaultEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
    const defaultPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';

    const hashedPassword = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

    await this.prisma.admin.create({
      data: {
        email: defaultEmail,
        password: hashedPassword,
      },
    });

    this.logger.warn(
      `Admin por defecto creado -> email: ${defaultEmail} / password: ${defaultPassword} (cámbiala en producción)`,
    );
  }
}
