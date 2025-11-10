import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * 项目类型
 */
export type ProjectType = 'web' | 'api' | 'library' | 'mobile' | 'desktop' | 'other'

/**
 * 项目类别（基于 LDesign 工具）
 */
export type ProjectCategory = 'project' | 'library' | 'project-library' | 'other'

/**
 * 项目实体
 */
@Entity('projects')
@Index('idx_project_name', ['name'])
@Index('idx_project_type_category', ['type', 'category'])
@Index('idx_project_framework', ['framework'])
@Index('idx_project_last_opened', ['lastOpenedAt'])
@Index('idx_project_created_at', ['createdAt'])
export class Project {
  /**
   * 项目 ID（UUID）
   */
  @PrimaryColumn('text')
  id: string

  /**
   * 项目名称
   */
  @Column('text')
  name: string

  /**
   * 项目路径
   */
  @Column('text', { unique: true })
  path: string

  /**
   * 项目类型
   */
  @Column('text')
  type: ProjectType

  /**
   * 项目类别（基于 LDesign 工具：project/library/project-library）
   */
  @Column('text', { nullable: true })
  category?: ProjectCategory

  /**
   * 框架类型（如 vue2、vue3、react、angular 等）
   */
  @Column('text', { nullable: true })
  framework?: string

  /**
   * 框架版本（如 2.x、3.x 等）
   */
  @Column('text', { nullable: true })
  frameworkVersion?: string

  /**
   * 是否使用 TypeScript
   */
  @Column('boolean', { default: false })
  isTypeScript: boolean

  /**
   * 包管理器（npm、pnpm、yarn）
   */
  @Column('text', { nullable: true })
  packageManager?: string

  /**
   * 项目描述
   */
  @Column('text', { nullable: true })
  description?: string

  /**
   * 项目配置（JSON 字符串）
   */
  @Column('text', { nullable: true })
  config?: string

  /**
   * 项目标签（JSON 字符串数组）
   */
  @Column('text', { nullable: true })
  tags?: string

  /**
   * 创建时间
   */
  @CreateDateColumn({ type: 'integer' })
  createdAt: number

  /**
   * 更新时间
   */
  @UpdateDateColumn({ type: 'integer' })
  updatedAt: number

  /**
   * 最后打开时间
   */
  @Column('integer', { nullable: true })
  lastOpenedAt?: number
}

