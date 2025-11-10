import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Builder 默认输出目录实体
 * 存储库项目打包时的默认输出目录配置
 */
@Entity('builder_output_dirs')
@Index(['name'], { unique: true })
export class BuilderOutputDir {
  /**
   * 目录名称（唯一标识，如 'es', 'lib', 'dist'）
   */
  @PrimaryColumn('text')
  name: string

  /**
   * 显示标签（中文）
   */
  @Column('text')
  label: string

  /**
   * 目录描述
   */
  @Column('text', { nullable: true })
  description?: string

  /**
   * 是否启用（默认启用）
   */
  @Column('boolean', { default: true })
  enabled: boolean

  /**
   * 排序顺序
   */
  @Column('integer', { default: 0 })
  order: number

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
}












