import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';
import { Role } from './role.entity';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255 })
  @Exclude()
  password: string;

  @Column({ length: 50, nullable: true })
  firstName: string;

  @Column({ length: 50, nullable: true })
  lastName: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastLoginIp: string;

  @Column({ type: 'int', default: 0 })
  loginCount: number;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpires: Date;

  @Column({ type: 'timestamp', nullable: true })
  passwordChangedAt: Date;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  hasRole(roleName: string): boolean {
    return this.roles?.some((role) => role.name === roleName) || false;
  }

  hasPermission(permissionName: string): boolean {
    return (
      this.roles?.some((role) =>
        role.permissions?.some((permission) => permission.name === permissionName)
      ) || false
    );
  }
}