export interface Article {
  id: number;
  title: string;
  content: string;
  category?: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ArticleResponse {
  code: number;
  message: string;
  data: Article | Article[] | any;
}