export class Paginated<T> {
  constructor(
    public readonly items: T[],
    public readonly page: number,
    public readonly limit: number,
    public readonly total: number,
  ) {}
}
