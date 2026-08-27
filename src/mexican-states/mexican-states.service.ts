import { Injectable, Logger } from '@nestjs/common';
import { MexicanState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Las 32 entidades federativas de México, en orden alfabético, con su
// clave/abreviatura oficial (INEGI) para uso futuro (reportes, filtros, etc.).
const SEED_MEXICAN_STATES: { nombre: string; clave: string; posicion: number }[] = [
  { nombre: 'Aguascalientes', clave: 'AGU', posicion: 1 },
  { nombre: 'Baja California', clave: 'BCN', posicion: 2 },
  { nombre: 'Baja California Sur', clave: 'BCS', posicion: 3 },
  { nombre: 'Campeche', clave: 'CAM', posicion: 4 },
  { nombre: 'Chiapas', clave: 'CHP', posicion: 5 },
  { nombre: 'Chihuahua', clave: 'CHH', posicion: 6 },
  { nombre: 'Ciudad de México', clave: 'CMX', posicion: 7 },
  { nombre: 'Coahuila', clave: 'COA', posicion: 8 },
  { nombre: 'Colima', clave: 'COL', posicion: 9 },
  { nombre: 'Durango', clave: 'DUR', posicion: 10 },
  { nombre: 'Guanajuato', clave: 'GUA', posicion: 11 },
  { nombre: 'Guerrero', clave: 'GRO', posicion: 12 },
  { nombre: 'Hidalgo', clave: 'HID', posicion: 13 },
  { nombre: 'Jalisco', clave: 'JAL', posicion: 14 },
  { nombre: 'Estado de México', clave: 'MEX', posicion: 15 },
  { nombre: 'Michoacán', clave: 'MIC', posicion: 16 },
  { nombre: 'Morelos', clave: 'MOR', posicion: 17 },
  { nombre: 'Nayarit', clave: 'NAY', posicion: 18 },
  { nombre: 'Nuevo León', clave: 'NLE', posicion: 19 },
  { nombre: 'Oaxaca', clave: 'OAX', posicion: 20 },
  { nombre: 'Puebla', clave: 'PUE', posicion: 21 },
  { nombre: 'Querétaro', clave: 'QUE', posicion: 22 },
  { nombre: 'Quintana Roo', clave: 'ROO', posicion: 23 },
  { nombre: 'San Luis Potosí', clave: 'SLP', posicion: 24 },
  { nombre: 'Sinaloa', clave: 'SIN', posicion: 25 },
  { nombre: 'Sonora', clave: 'SON', posicion: 26 },
  { nombre: 'Tabasco', clave: 'TAB', posicion: 27 },
  { nombre: 'Tamaulipas', clave: 'TAM', posicion: 28 },
  { nombre: 'Tlaxcala', clave: 'TLA', posicion: 29 },
  { nombre: 'Veracruz', clave: 'VER', posicion: 30 },
  { nombre: 'Yucatán', clave: 'YUC', posicion: 31 },
  { nombre: 'Zacatecas', clave: 'ZAC', posicion: 32 },
];

@Injectable()
export class MexicanStatesService {
  private readonly logger = new Logger(MexicanStatesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<MexicanState[]> {
    return this.prisma.mexicanState.findMany({ orderBy: { posicion: 'asc' } });
  }

  /**
   * Estrategia de semilla: si la tabla está vacía, inserta las 32 entidades
   * federativas para que el <select> de "Dirección de envío" tenga el
   * catálogo completo desde el primer arranque del servidor.
   */
  async seedMexicanStates(): Promise<void> {
    const count = await this.prisma.mexicanState.count();

    if (count > 0) {
      return;
    }

    await this.prisma.mexicanState.createMany({ data: SEED_MEXICAN_STATES });

    this.logger.warn(
      `${SEED_MEXICAN_STATES.length} entidades federativas sembradas en el catálogo`,
    );
  }
}
