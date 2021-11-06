export interface IPaginateOption {
  sortBy?: string;
  populate?: IPaginatePopulate[];
  limit?: number;
  page?: number;
}

interface IPaginatePopulate {
  path: string;
  match?: any;
}