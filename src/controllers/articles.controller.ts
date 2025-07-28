import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ArticlesService } from '../services/articles.service';
import { CreateArticleDto } from '../dto/article.dto';
import { ArticleResponse } from '../interfaces/article.interface';

@Controller('api/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async getArticles(
    @Query('page') page: string = '1',
    @Query('category') category?: string
  ): Promise<ArticleResponse> {
    const pageNum = parseInt(page, 10);
    return this.articlesService.findAll(pageNum, category);
  }

  @Get(':id')
  async getArticle(@Param('id') id: string): Promise<ArticleResponse> {
    return this.articlesService.findOne(parseInt(id, 10));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createArticle(@Body() createArticleDto: CreateArticleDto): Promise<ArticleResponse> {
    return this.articlesService.create(createArticleDto);
  }
}