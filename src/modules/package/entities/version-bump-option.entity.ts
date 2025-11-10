import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * 版本提升选项实体
 * 存储版本提升策略的配置信息
 */
@Entity('version_bump_options')
@Index(['type'], { unique: true })
export class VersionBumpOption {
  /**
   * 版本提升类型（唯一标识）
   */
  @PrimaryColumn('text')
  type: string

  /**
   * 显示标签（中文）
   */
  @Column('text')
  label: string

  /**
   * Lucide 图标名称
   */
  @Column('text')
  icon: string

  /**
   * 版本格式示例（如 0.0.x）
   */
  @Column('text', { nullable: true })
  example?: string

  /**
   * 详细描述（使用场景说明）
   */
  @Column('text', { nullable: true })
  description?: string

  /**
   * 是否启用
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













