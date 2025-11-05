/**
 * API Operation
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import {
  GenerateCodeDto,
  GenerateComponentDto,
  GeneratePageDto,
  GenerateApiDto,
  GenerateType,
  TemplateType,
} from './dto/generator.dto.js'

/**
 * API Operation
 */
export interface GenerateResult {
  success: boolean
  message: string
  files?: GeneratedFile[]
  duration?: number
}

/**
 * API Operation
 */
export interface GeneratedFile {
  path: string
  content: string
  type: string
}

/**
 * API Operation
 */
export interface TemplateInfo {
  id: string
  name: string
  description: string
  type: TemplateType
  category: GenerateType
  config: {
    typescript?: boolean
    styles?: string[]
    frameworks?: string[]
  }
}

/**
 * API Operation
 */
@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name)

  /**
 * API Operation
 */
  async generate(dto: GenerateCodeDto): Promise<GenerateResult> {
    this.logger.log(`: ${dto.type} - ${dto.name}`)

    try {
      const startTime = Date.now()

      // Operation
      const files = this.mockGenerateFiles(dto)

      const duration = Date.now() - startTime

      this.logger.log(` ${duration}ms`)

      return {
        success: true,
        message: ` ${dto.type}: ${dto.name}`,
        files,
        duration,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      return {
        success: false,
        message: `: ${error.message}`,
      }
    }
  }

  /**
 * API Operation
 */
  async generateComponent(dto: GenerateComponentDto): Promise<GenerateResult> {
    this.logger.log(`: ${dto.name}`)

    try {
      const framework = dto.framework || TemplateType.REACT
      const ext = dto.typescript ? 'tsx' : 'jsx'
      const styleExt = dto.styles || 'scss'

      const files: GeneratedFile[] = [
        {
          path: `src/components/${dto.name}/${dto.name}.${ext}`,
          content: this.generateComponentContent(dto.name, framework, dto.typescript),
          type: 'component',
        },
        {
          path: `src/components/${dto.name}/${dto.name}.${styleExt}`,
          content: this.generateStyleContent(dto.name),
          type: 'style',
        },
      ]

      if (dto.withTests) {
        files.push({
          path: `src/components/${dto.name}/${dto.name}.test.${ext}`,
          content: this.generateTestContent(dto.name, framework),
          type: 'test',
        })
      }

      if (dto.withStories) {
        files.push({
          path: `src/components/${dto.name}/${dto.name}.stories.${ext}`,
          content: this.generateStoryContent(dto.name),
          type: 'story',
        })
      }

      return {
        success: true,
        message: `: ${dto.name}`,
        files,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      return {
        success: false,
        message: `: ${error.message}`,
      }
    }
  }

  /**
 * API Operation
 */
  async generatePage(dto: GeneratePageDto): Promise<GenerateResult> {
    this.logger.log(`: ${dto.name}`)

    try {
      const files: GeneratedFile[] = [
        {
          path: `src/pages/${dto.name}/${dto.name}.tsx`,
          content: this.generatePageContent(dto.name, dto.withLayout, dto.withApi),
          type: 'page',
        },
        {
          path: `src/pages/${dto.name}/${dto.name}.scss`,
          content: this.generateStyleContent(dto.name),
          type: 'style',
        },
      ]

      if (dto.withApi) {
        files.push({
          path: `src/pages/${dto.name}/api.ts`,
          content: this.generateApiContent(dto.name),
          type: 'api',
        })
      }

      return {
        success: true,
        message: `: ${dto.name}`,
        files,
      }
    }
    catch (error: any) {
      this.logger.error(`: ${error.message}`)
      return {
        success: false,
        message: `: ${error.message}`,
      }
    }
  }

  /**
 * API Operation
 */
  async generateApi(dto: GenerateApiDto): Promise<GenerateResult> {
    this.logger.log(` API: ${dto.name}`)

    try {
      const files: GeneratedFile[] = [
        {
          path: `src/api/${dto.name}.ts`,
          content: this.generateApiServiceContent(dto.name, dto.basePath, dto.methods),
          type: 'api',
        },
      ]

      if (dto.withTypes) {
        files.push({
          path: `src/types/${dto.name}.ts`,
          content: this.generateTypeContent(dto.name),
          type: 'types',
        })
      }

      return {
        success: true,
        message: ` API: ${dto.name}`,
        files,
      }
    }
    catch (error: any) {
      this.logger.error(` API : ${error.message}`)
      return {
        success: false,
        message: `: ${error.message}`,
      }
    }
  }

  /**
 * API Operation
 */
  async getTemplates(type?: TemplateType, category?: GenerateType): Promise<TemplateInfo[]> {
    // Operation
    const templates: TemplateInfo[] = [
      {
        id: 'react-component',
        name: 'React ',
        description: 'React ',
        type: TemplateType.REACT,
        category: GenerateType.COMPONENT,
        config: {
          typescript: true,
          styles: ['css', 'scss', 'less', 'styled-components'],
        },
      },
      {
        id: 'vue-component',
        name: 'Vue ',
        description: 'Vue 3 ',
        type: TemplateType.VUE,
        category: GenerateType.COMPONENT,
        config: {
          typescript: true,
          styles: ['css', 'scss', 'less'],
        },
      },
      {
        id: 'nestjs-controller',
        name: 'NestJS ',
        description: 'NestJS REST API ',
        type: TemplateType.NESTJS,
        category: GenerateType.API,
        config: {
          typescript: true,
        },
      },
      {
        id: 'express-router',
        name: 'Express ',
        description: 'Express ',
        type: TemplateType.EXPRESS,
        category: GenerateType.API,
        config: {
          typescript: true,
        },
      },
    ]

    let filtered = templates

    if (type) {
      filtered = filtered.filter(t => t.type === type)
    }

    if (category) {
      filtered = filtered.filter(t => t.category === category)
    }

    return filtered
  }

  /**
 * API Operation
 */
  private mockGenerateFiles(dto: GenerateCodeDto): GeneratedFile[] {
    return [
      {
        path: `${dto.output || 'src'}/${dto.name}.tsx`,
        content: `// Generated ${dto.type}: ${dto.name}\nexport default function ${dto.name}() {\n  return <div>${dto.name}</div>\n}`,
        type: dto.type,
      },
    ]
  }

  /**
 * API Operation
 */
  private generateComponentContent(name: string, framework: TemplateType, typescript: boolean): string {
    if (framework === TemplateType.REACT) {
      return `import React from 'react'
import './${name}.scss'

${typescript ? `interface ${name}Props {
  // Add your props here
}

` : ''}const ${name}${typescript ? `: React.FC<${name}Props>` : ''} = (${typescript ? 'props' : ''}) => {
  return (
    <div className="${name.toLowerCase()}">
      <h2>${name}</h2>
      {/* Add your component content here */}
    </div>
  )
}

export default ${name}
`
    }
    return `// ${name} component`
  }

  /**
 * API Operation
 */
  private generateStyleContent(name: string): string {
    return `.${name.toLowerCase()} {
  padding: 20px;
  
  h2 {
    font-size: 24px;
    margin-bottom: 16px;
  }
}
`
  }

  /**
 * API Operation
 */
  private generateTestContent(name: string, framework: TemplateType): string {
    return `import { render, screen } from '@testing-library/react'
import ${name} from './${name}.js'

describe('${name}', () => {
  it('should render successfully', () => {
    render(<${name} />)
    expect(screen.getByText('${name}')).toBeInTheDocument()
  })
})
`
  }

  /**
 * API Operation
 */
  private generateStoryContent(name: string): string {
    return `import type { Meta, StoryObj } from '@storybook/react'
import ${name} from './${name}.js'

const meta: Meta<typeof ${name}> = {
  title: 'Components/${name}',
  component: ${name},
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ${name}>

export const Default: Story = {
  args: {},
}
`
  }

  /**
 * API Operation
 */
  private generatePageContent(name: string, withLayout: boolean, withApi: boolean): string {
    return `import React${withApi ? ', { useEffect, useState }' : ''} from 'react'
${withLayout ? `import Layout from '@/components/Layout'` : ''}
${withApi ? `import * as api from './api.js'` : ''}
import './${name}.scss'

const ${name}Page: React.FC = () => {
  ${withApi ? `const [data, setData] = useState(null)

  useEffect(() => {
    api.fetch${name}Data().then(setData)
  }, [])` : ''}

  const content = (
    <div className="${name.toLowerCase()}-page">
      <h1>${name}</h1>
      {/* Add your page content here */}
    </div>
  )

  ${withLayout ? `return <Layout>{content}</Layout>` : `return content`}
}

export default ${name}Page
`
  }

  /**
 * API Operation
 */
  private generateApiContent(name: string): string {
    return `import axios from 'axios'

export const fetch${name}Data = async () => {
  const response = await axios.get('/api/${name.toLowerCase()}')
  return response.data
}
`
  }

  /**
 * API Operation
 */
  private generateApiServiceContent(
    name: string,
    basePath?: string,
    methods?: string[],
  ): string {
    const path = basePath || `/api/${name}`
    const supportedMethods = methods || ['GET', 'POST', 'PUT', 'DELETE']

    const methodImpls = supportedMethods.map((method) => {
      const methodName = method.toLowerCase()
      switch (method) {
        case 'GET':
          return `export const get${name} = async (id: string) => {
  return axios.get(\`${path}/\${id}\`)
}`
        case 'POST':
          return `export const create${name} = async (data: any) => {
  return axios.post('${path}', data)
}`
        case 'PUT':
          return `export const update${name} = async (id: string, data: any) => {
  return axios.put(\`${path}/\${id}\`, data)
}`
        case 'DELETE':
          return `export const delete${name} = async (id: string) => {
  return axios.delete(\`${path}/\${id}\`)
}`
        default:
          return ''
      }
    }).join('\n\n')

    return `import axios from 'axios'

${methodImpls}
`
  }

  /**
 * API Operation
 */
  private generateTypeContent(name: string): string {
    return `export interface ${name} {
  id: string
  // Add your fields here
}

export interface Create${name}Dto {
  // Add your fields here
}

export interface Update${name}Dto {
  // Add your fields here
}
`
  }
}
