export type RawgGame = {
  id: number;
  name: string;
  released: string | null;
  background_image: string | null;
  metacritic: number | null;
  rating: number;
  ratings_count: number;
};

export type RawgListResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};