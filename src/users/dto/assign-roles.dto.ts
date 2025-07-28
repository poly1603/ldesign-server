import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignRolesDto {
  @ApiProperty({
    description: '角色ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  roleIds: number[];
}