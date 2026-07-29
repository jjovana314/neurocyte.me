import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { status as GrpcStatus } from '@grpc/grpc-js';
import { firstValueFrom, Observable } from 'rxjs';
import { CALCULATOR_PACKAGE } from './calculator-client.constants';

interface EdssRequest {
  pyramidalSystem: number;
  cerebellarSystem: number;
  brainstemSystem: number;
  sensorySystem: number;
  bowelBladderSystem: number;
  visualSystem: number;
  mentalSystem: number;
  unassistedWalkingDistanceMeters?: number;
  requiresUnilateralAid: boolean;
  requiresBilateralAid: boolean;
  wheelchairBound: boolean;
}

interface EdssResponse {
  totalScore: number;
}

interface CalculatorServiceClient {
  calculateEdss(request: EdssRequest): Observable<EdssResponse>;
}

// Client for the shared `calculator` gRPC service (calculator/ at the repo
// root) - the single place clinical scoring math lives. Future score types
// should get their own method here alongside calculateEdssScore.
@Injectable()
export class CalculatorClientService implements OnModuleInit {
  private calculatorService: CalculatorServiceClient;

  constructor(
    @Inject(CALCULATOR_PACKAGE) private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.calculatorService =
      this.client.getService<CalculatorServiceClient>('CalculatorService');
  }

  async calculateEdssScore(scores: EdssRequest): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.calculatorService.calculateEdss({ ...scores }),
      );
      return response.totalScore;
    } catch (error) {
      if (error?.code === GrpcStatus.INVALID_ARGUMENT) {
        throw new BadRequestException(error.details);
      }
      throw error;
    }
  }
}
