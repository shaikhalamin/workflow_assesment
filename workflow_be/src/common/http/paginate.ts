import type {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsSelect,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { Paginated } from './paginated';

export interface PaginateRepoOptions<T> {
  where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
  order: FindOptionsOrder<T>;
  relations?: FindOptionsRelations<T>;
  select?: FindOptionsSelect<T>;
  page: number;
  limit: number;
}

export async function paginateRepo<T extends ObjectLiteral & { id: string }>(
  repo: Repository<T>,
  opts: PaginateRepoOptions<T>,
): Promise<Paginated<T>> {
  const skip = (opts.page - 1) * opts.limit;
  // id is force-overridden as a stability tiebreaker — sort columns may not be unique.
  const order = { ...opts.order, id: 'DESC' } as FindOptionsOrder<T>;
  const [items, total] = await repo.findAndCount({
    where: opts.where,
    order,
    relations: opts.relations,
    select: opts.select,
    skip,
    take: opts.limit,
  });
  return new Paginated(items, opts.page, opts.limit, total);
}

export interface PaginateQbOptions {
  page: number;
  limit: number;
  idColumn: string;
}

export async function paginateQb<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  opts: PaginateQbOptions,
): Promise<Paginated<T>> {
  const skip = (opts.page - 1) * opts.limit;
  qb.addOrderBy(opts.idColumn, 'DESC').skip(skip).take(opts.limit);
  const [items, total] = await qb.getManyAndCount();
  return new Paginated(items, opts.page, opts.limit, total);
}
