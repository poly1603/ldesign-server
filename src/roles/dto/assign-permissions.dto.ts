import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: '权限ID列表',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  permissionIds: number[];
}