export function errorHandler(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      this.logger.error(`Error in ${propertyKey}: ${error.message}`);
      throw error;
    }
  };

  return descriptor;
}