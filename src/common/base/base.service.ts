import { Logger } from '@nestjs/common'
import { Repository } from 'typeorm'

/**
 * Base Service Class
 * Provides common CRUD operations and logging for all services
 * @template T - Entity type
 */
export abstract class BaseService<T> {
  protected abstract readonly logger: Logger
  protected abstract readonly repository: Repository<T>

  /**
   * Find all entities
   * @returns Array of all entities
   */
  async findAll(): Promise<T[]> {
    this.logger.log(`Finding all ${this.getEntityName()} entities`)
    try {
      const entities = await this.repository.find()
      this.logger.log(`Found ${entities.length} ${this.getEntityName()} entities`)
      return entities
    } catch (error) {
      this.logger.error(`Failed to find all ${this.getEntityName()} entities: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Find entity by ID
   * @param id - Entity unique identifier
   * @returns Entity or null if not found
   */
  async findOne(id: string): Promise<T | null> {
    this.logger.log(`Finding ${this.getEntityName()} entity with ID: ${id}`)
    
    if (!id || typeof id !== 'string') {
      this.logger.warn(`Invalid ${this.getEntityName()} ID: ${id}`)
      return null
    }

    try {
      const entity = await this.repository.findOne({ where: { id } as any })
      
      if (entity) {
        this.logger.log(`Found ${this.getEntityName()} entity: ${id}`)
      } else {
        this.logger.warn(`${this.getEntityName()} entity not found: ${id}`)
      }
      
      return entity
    } catch (error) {
      this.logger.error(`Failed to find ${this.getEntityName()} entity ${id}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Remove entity by ID
   * @param id - Entity unique identifier
   * @returns Number of affected rows
   */
  async remove(id: string): Promise<number> {
    this.logger.log(`Removing ${this.getEntityName()} entity with ID: ${id}`)
    
    try {
      const result = await this.repository.delete(id)
      const affected = result.affected || 0
      
      if (affected > 0) {
        this.logger.log(`Successfully removed ${this.getEntityName()} entity: ${id}`)
      } else {
        this.logger.warn(`${this.getEntityName()} entity not found for removal: ${id}`)
      }
      
      return affected
    } catch (error) {
      this.logger.error(`Failed to remove ${this.getEntityName()} entity ${id}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Get entity name for logging purposes
   * Override this method to provide custom entity name
   * @returns Entity name string
   */
  protected getEntityName(): string {
    return 'entity'
  }

  /**
   * Count total entities
   * @returns Total count
   */
  async count(): Promise<number> {
    try {
      return await this.repository.count()
    } catch (error) {
      this.logger.error(`Failed to count ${this.getEntityName()} entities: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  /**
   * Check if entity exists by ID
   * @param id - Entity unique identifier
   * @returns True if entity exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    try {
      const count = await this.repository.count({ where: { id } as any })
      return count > 0
    } catch (error) {
      this.logger.error(`Failed to check existence of ${this.getEntityName()} entity ${id}: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }
}

































