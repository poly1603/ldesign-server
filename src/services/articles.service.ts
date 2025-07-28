import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateArticleDto } from '../dto/article.dto';
import { Article, ArticleResponse } from '../interfaces/article.interface';

@Injectable()
export class ArticlesService {
  private articles: Article[] = [
    {
      id: 1,
      title: 'Vue 3 组合式 API 入门指南',
      content: 'Vue 3 引入了组合式 API，这是一种全新的编写组件逻辑的方式。它提供了更好的逻辑复用、更清晰的代码组织和更好的 TypeScript 支持...',
      category: '前端开发',
      author: '张三',
      createdAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      title: 'NestJS 微服务架构实践',
      content: 'NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。本文将介绍如何使用 NestJS 构建微服务架构...',
      category: '后端开发',
      author: '李四',
      createdAt: '2024-01-02T00:00:00.000Z'
    },
    {
      id: 3,
      title: 'TypeScript 高级类型系统详解',
      content: 'TypeScript 的类型系统是其最强大的特性之一。本文将深入探讨 TypeScript 的高级类型特性，包括泛型、条件类型、映射类型等...',
      category: '编程语言',
      author: '王五',
      createdAt: '2024-01-03T00:00:00.000Z'
    }
  ];

  private nextId = 4;

  async findAll(page: number = 1, category?: string) {
    let filteredArticles = this.articles;
    
    if (category) {
      filteredArticles = this.articles.filter(article => 
        article.category?.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    const limit = 10;
    const total = filteredArticles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const articles = filteredArticles.slice(startIndex, endIndex);
    
    return {
      code: 200,
      message: 'success',
      data: {
        articles,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findOne(id: number) {
    const article = this.articles.find(a => a.id === id);
    
    if (!article) {
      throw new NotFoundException({
        code: 404,
        message: 'Article not found',
        data: null
      });
    }
    
    return {
      code: 200,
      message: 'success',
      data: article
    };
  }

  async create(createArticleDto: CreateArticleDto) {
    const newArticle: Article = {
      id: this.nextId++,
      title: createArticleDto.title,
      content: createArticleDto.content,
      category: createArticleDto.category,
      author: '当前用户', // 在实际应用中，这应该从认证信息中获取
      createdAt: new Date().toISOString()
    };
    
    this.articles.push(newArticle);
    
    return {
      code: 201,
      message: 'Article created successfully',
      data: newArticle
    };
  }
}