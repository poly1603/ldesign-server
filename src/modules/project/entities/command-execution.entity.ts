import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'

/**
 * Command Execution Status
 */
export type CommandStatus = 'pending' | 'running' | 'completed' | 'failed' | 'stopped'

/**
 * Command Execution Entity
 * Represents a command execution record for a project
 */
@Entity('command_executions')
@Index(['projectId']) // Index for filtering by project
@Index(['command']) // Index for filtering by command name
@Index(['status']) // Index for filtering by status
@Index(['createdAt']) // Index for sorting by creation date
@Index(['projectId', 'command']) // Composite index for common queries
@Index(['projectId', 'status']) // Composite index for filtering project commands by status
@Index(['projectId', 'command', 'environment']) // Composite index for filtering by project, command and environment
@Index(['projectId', 'command', 'status']) // Composite index for filtering by project, command and status
@Index(['completedAt']) // Index for filtering by completion time
@Index(['duration']) // Index for filtering by duration
export class CommandExecution {
  /**
   * Execution ID (UUID)
   */
  @PrimaryColumn('text')
  id: string

  /**
   * Project ID (foreign key to projects table)
   */
  @Column('text')
  projectId: string

  /**
   * Command name (e.g., dev, build, preview)
   */
  @Column('text')
  command: string

  /**
   * Environment name (e.g., development, production, staging, test, preview)
   * Used to distinguish multiple instances of the same command running in different environments
   */
  @Column('text', { nullable: true })
  environment?: string

  /**
   * Full command line executed
   */
  @Column('text')
  commandLine: string

  /**
   * Command execution status
   */
  @Column('text')
  status: CommandStatus

  /**
   * Command output logs
   */
  @Column('text', { nullable: true })
  output?: string

  /**
   * Service URL (for dev commands after successful start)
   */
  @Column('text', { nullable: true })
  serviceUrl?: string

  /**
   * Process ID
   */
  @Column('integer', { nullable: true })
  pid?: number

  /**
   * Error message (if execution failed)
   */
  @Column('text', { nullable: true })
  error?: string

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  @CreateDateColumn({ type: 'integer' })
  createdAt: number

  /**
   * Update timestamp (Unix timestamp in milliseconds)
   */
  @UpdateDateColumn({ type: 'integer' })
  updatedAt: number

  /**
   * Completion timestamp (Unix timestamp in milliseconds)
   */
  @Column('integer', { nullable: true })
  completedAt?: number

  /**
   * Execution duration in milliseconds
   * Calculated as completedAt - createdAt (or updatedAt - createdAt for running commands)
   */
  @Column('integer', { nullable: true })
  duration?: number
}



