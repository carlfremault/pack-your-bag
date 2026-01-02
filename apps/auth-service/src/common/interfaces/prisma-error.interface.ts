export interface PrismaDriverError {
  // P2002 fields
  driverAdapterError?: {
    cause?: {
      constraint?: {
        fields: string[];
      };
    };
  };
  target?: string[];

  // P2025 fields
  modelName?: string;
  model?: string;
  operation?: string;
  relation?: string;
}
