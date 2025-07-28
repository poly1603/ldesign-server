import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permission } from './permission.entity';

export enum MenuType {
  DIRECTORY = 'directory',
  MENU = 'menu',
  BUTTON = 'button',
}

export enum MenuStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('menus')
export class Menu {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, nullable: true })
  title: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  path: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  component: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: MenuType,
    default: MenuType.MENU,
  })
  type: MenuType;

  @Column({
    type: 'enum',
    enum: MenuStatus,
    default: MenuStatus.ACTIVE,
  })
  status: MenuStatus;

  @Column({ type: 'int', default: 0 })
  sort: number;

  @Column({ type: 'boolean', default: true })
  visible: boolean;

  @Column({ type: 'boolean', default: false })
  isExternal: boolean;

  @Column({ type: 'boolean', default: true })
  keepAlive: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  redirect: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  meta: Record<string, any>;

  @Column({ type: 'int', nullable: true })
  parentId: number;

  @ManyToOne(() => Menu, (menu) => menu.children)
  @JoinColumn({ name: 'parentId' })
  parent: Menu;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @ManyToMany(() => Permission, (permission) => permission.menus, {
    eager: true,
  })
  @JoinTable({
    name: 'menu_permissions',
    joinColumn: { name: 'menuId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permissionId', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get fullPath(): string {
    if (this.parent) {
      return `${this.parent.fullPath}/${this.path}`;
    }
    return this.path || '';
  }

  hasPermission(permissionName: string): boolean {
    return (
      this.permissions?.some((permission) => permission.name === permissionName) ||
      false
    );
  }

  isChildOf(parentMenu: Menu): boolean {
    let current = this.parent;
    while (current) {
      if (current.id === parentMenu.id) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  getLevel(): number {
    let level = 1;
    let current = this.parent;
    while (current) {
      level++;
      current = current.parent;
    }
    return level;
  }
}