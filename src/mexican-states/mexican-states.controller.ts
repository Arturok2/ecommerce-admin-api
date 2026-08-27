import { Controller, Get } from '@nestjs/common';
import { MexicanState } from '@prisma/client';
import { MexicanStatesService } from './mexican-states.service';

@Controller('mexican-states')
export class MexicanStatesController {
  constructor(private readonly mexicanStatesService: MexicanStatesService) {}

  // Lectura pública: el formulario de "Generar Venta Ficticia" necesita
  // poblar el <select> sin requerir sesión de admin, igual que /categories.
  @Get()
  findAll(): Promise<MexicanState[]> {
    return this.mexicanStatesService.findAll();
  }
}
