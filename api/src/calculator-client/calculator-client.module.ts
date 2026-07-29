import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { config } from 'src/config/config';
import { CalculatorClientService } from './calculator-client.service';
import { CALCULATOR_PACKAGE } from './calculator-client.constants';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: CALCULATOR_PACKAGE,
        transport: Transport.GRPC,
        options: {
          package: 'calculator',
          // The proto contract lives in the sibling `calculator/` service at
          // the repo root, not inside `api/` - resolved relative to cwd since
          // both `nest start` and `node dist/main` are always launched with
          // cwd = api/ (see root package.json's `npm run --prefix api ...`).
          protoPath: join(
            process.cwd(),
            '..',
            'calculator',
            'proto',
            'calculator.proto',
          ),
          url: config.get().CALCULATOR_GRPC_URL,
        },
      },
    ]),
  ],
  providers: [CalculatorClientService],
  exports: [CalculatorClientService],
})
export class CalculatorClientModule {}
