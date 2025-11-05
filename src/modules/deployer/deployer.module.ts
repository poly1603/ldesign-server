import { Module } from '@nestjs/common'
import { DeployerController } from './deployer.controller.js'
import { DeployerService } from './deployer.service.js'

@Module({
  controllers: [DeployerController],
  providers: [DeployerService],
  exports: [DeployerService],
})
export class DeployerModule {}