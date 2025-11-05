import { 
  Controller, 
  Post, 
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { DocsGeneratorService } from './docs-generator.service.js'
import {
  GenerateDocsDto,
  GenerateApiDocsDto,
  GenerateReadmeDto,
  GenerateComponentDocsDto,
  ServeDocsDto,
  ValidateDocsDto,
  ConfigureSearchDto,
  DeployDocsDto,
} from './dto/docs-generator.dto.js'

@ApiTags('docs-generator')
@Controller('docs-generator')
export class DocsGeneratorController {
  constructor(private readonly docsService: DocsGeneratorService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate documentation' })
  @ApiResponse({ status: 200, description: 'Documentation generated successfully' })
  async generateDocs(@Body() generateDto: GenerateDocsDto) {
    try {
      return await this.docsService.generateDocs(generateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Documentation generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('api')
  @ApiOperation({ summary: 'Generate API documentation' })
  @ApiResponse({ status: 200, description: 'API documentation generated' })
  async generateApiDocs(@Body() apiDocsDto: GenerateApiDocsDto) {
    try {
      return await this.docsService.generateApiDocs(apiDocsDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'API documentation generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('readme')
  @ApiOperation({ summary: 'Generate README file' })
  @ApiResponse({ status: 200, description: 'README generated successfully' })
  async generateReadme(@Body() readmeDto: GenerateReadmeDto) {
    try {
      return await this.docsService.generateReadme(readmeDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'README generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('components')
  @ApiOperation({ summary: 'Generate component documentation' })
  @ApiResponse({ status: 200, description: 'Component docs generated' })
  async generateComponentDocs(@Body() componentDto: GenerateComponentDocsDto) {
    try {
      return await this.docsService.generateComponentDocs(componentDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Component documentation generation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('serve')
  @ApiOperation({ summary: 'Serve documentation locally' })
  @ApiResponse({ status: 200, description: 'Documentation server started' })
  async serveDocs(@Body() serveDto: ServeDocsDto) {
    try {
      return await this.docsService.serveDocs(serveDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Failed to start documentation server',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate documentation' })
  @ApiResponse({ status: 200, description: 'Validation completed' })
  async validateDocs(@Body() validateDto: ValidateDocsDto) {
    try {
      return await this.docsService.validateDocs(validateDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Documentation validation failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('search/configure')
  @ApiOperation({ summary: 'Configure documentation search' })
  @ApiResponse({ status: 200, description: 'Search configured' })
  async configureSearch(@Body() searchDto: ConfigureSearchDto) {
    try {
      return await this.docsService.configureSearch(searchDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Search configuration failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy documentation' })
  @ApiResponse({ status: 200, description: 'Documentation deployed' })
  async deployDocs(@Body() deployDto: DeployDocsDto) {
    try {
      return await this.docsService.deployDocs(deployDto)
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Documentation deployment failed',
        HttpStatus.BAD_REQUEST,
      )
    }
  }
}
