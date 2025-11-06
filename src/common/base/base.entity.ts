import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from 'typeorm'

/**
 * Base Entity Class
 * Provides common fields for all entities:
 * - id: UUID primary key
 * - createdAt: Creation timestamp
 * - updatedAt: Last update timestamp
 * - deletedAt: Soft delete timestamp (optional)
 */
export abstract class BaseEntity {
  /**
   * Unique identifier (UUID)
   */
  @PrimaryGeneratedColumn('uuid')
  id: string

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  @CreateDateColumn({ type: 'bigint', name: 'created_at' })
  createdAt: number

  /**
   * Last update timestamp (Unix timestamp in milliseconds)
   */
  @UpdateDateColumn({ type: 'bigint', name: 'updated_at' })
  updatedAt: number

  /**
   * Soft delete timestamp (Unix timestamp in milliseconds)
   * Null if entity is not deleted
   */
  @DeleteDateColumn({ type: 'bigint', nullable: true, name: 'deleted_at' })
  deletedAt?: number | null
}

/**
 * Base Entity with version field
 * Extends BaseEntity with optimistic locking support
 */
export abstract class BaseEntityWithVersion extends BaseEntity {
  /**
   * Version number for optimistic locking
   */
  @Column({ type: 'int', default: 1 })
  version: number
}









