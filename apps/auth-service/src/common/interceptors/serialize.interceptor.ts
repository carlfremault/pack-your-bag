import { CallHandler, ExecutionContext, NestInterceptor, UseInterceptors } from '@nestjs/common';

import { ClassConstructor, plainToInstance } from 'class-transformer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Decorator to serialize response data to a specific DTO class.
 * Requires DTO properties to be decorated with @Expose() from class-transformer.
 * @param dto - The DTO class constructor to transform the response into
 */
export function Serialize<T>(dto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}

export class SerializeInterceptor<T> implements NestInterceptor {
  constructor(private readonly dto: ClassConstructor<T>) {}

  intercept(context: ExecutionContext, handler: CallHandler): Observable<T> {
    return handler.handle().pipe(
      map((data: unknown) => {
        if (data == null) {
          return data as T;
        }
        return plainToInstance(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}
