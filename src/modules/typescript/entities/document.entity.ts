import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'

/**
 * 文档类型
 */
export type DocumentType = 'typescript-config' | 'package-config' | 'other'

/**
 * 文档实体
 */
@Entity('documents')
export class Document {
  /**
   * 文档 ID（唯一标识符，如 'typescript-config-guide'）
   */
  @PrimaryColumn('text')
  id: string

  /**
   * 文档类型
   */
  @Column('text')
  type: DocumentType

  /**
   * 文档标题
   */
  @Column('text')
  title: string

  /**
   * 文档内容（Markdown 格式）
   */
  @Column('text')
  content: string

  /**
   * 文档描述
   */
  @Column('text', { nullable: true })
  description?: string

  /**
   * 文档版本（可选，用于版本控制）
   */
  @Column('text', { nullable: true })
  version?: string

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


