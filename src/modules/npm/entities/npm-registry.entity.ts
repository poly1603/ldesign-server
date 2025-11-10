import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'

/**
 * NPM 仓库配置实体
 */
@Entity('npm_registry')
export class NpmRegistry {
  @PrimaryGeneratedColumn('uuid')
  id: string

  /** 仓库名称 */
  @Column({ type: 'varchar', length: 100 })
  name: string

  /** 仓库 URL */
  @Column({ type: 'varchar', length: 500 })
  registry: string

  /** 是否为默认仓库 */
  @Column({ type: 'boolean', default: false })
  isDefault: boolean

  /** 是否启用 */
  @Column({ type: 'boolean', default: true })
  enabled: boolean

  /** 排序 */
  @Column({ type: 'integer', default: 0 })
  order: number

  /** 是否已登录 */
  @Column({ type: 'boolean', default: false })
  isLoggedIn: boolean

  /** 登录用户名 */
  @Column({ type: 'varchar', length: 200, nullable: true })
  username: string | null

  /** 登录邮箱 */
  @Column({ type: 'varchar', length: 200, nullable: true })
  email: string | null

  /** 创建时间 */
  @CreateDateColumn()
  createdAt: Date

  /** 更新时间 */
  @UpdateDateColumn()
  updatedAt: Date
}











