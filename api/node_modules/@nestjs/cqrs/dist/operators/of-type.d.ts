import { Type } from '@nestjs/common';
import { Observable } from 'rxjs';
import { IEvent } from '../interfaces';
/**
 * Filter values depending on their instance type (comparison is made
 * using native `instanceof`).
 *
 * @param types List of types implementing `IEvent`.
 *
 * @return A stream only emitting the filtered instances.
 */
export declare function ofType<TInput extends IEvent, T extends Type<IEvent>[]>(...types: T): (source: Observable<TInput>) => Observable<T[number] extends infer T_1 ? T_1 extends T[number] ? T_1 extends Type<infer I> ? I : never : never : never>;
