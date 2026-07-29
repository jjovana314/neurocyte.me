import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { config } from 'src/config/config';
import { CALCULATOR_PACKAGE_NAME } from './generated/calculator';

export const CALCULATOR_PACKAGE = 'CALCULATOR_PACKAGE';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CALCULATOR_PACKAGE,
        transport: Transport.GRPC,
        options: {
          package: CALCULATOR_PACKAGE_NAME,
          protoPath: join(process.cwd(), 'proto', 'calculator.proto'),
          url: config.get().CALCULATOR_GRPC_URL,
        },
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class CalculatorModule {}
