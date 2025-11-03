import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * 项目类型
 */
export type ProjectType = 'web' | 'api' | 'library' | 'mobile' | 'desktop' | 'other'

/**
 * 项目实体
 */
@Entity('projects')
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
   * 框架类型（如 vue、react、angular 等）
   */
  @Column('text', { nullable: true })
  framework?: string

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

