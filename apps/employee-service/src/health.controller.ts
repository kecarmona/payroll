import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { status: 'ok', service: 'employee-service' };
  }

  @Get('ready')
  ready() {
    return { status: 'ok', service: 'employee-service' };
  }
}

