export class DataLayerError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
