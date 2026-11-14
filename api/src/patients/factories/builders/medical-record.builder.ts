export abstract class MedicalRecordBuilder<TInput, TOutput> {
  public abstract build(data: TInput): Promise<TOutput>;
}
