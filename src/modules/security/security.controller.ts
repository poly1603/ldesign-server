/** API Operation
 * @module security/security.controller
 */

import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger'
import { SecurityService } from './security.service.js'
import {
  SecurityScanDto,
  SecurityAuditDto,
  FixVulnerabilityDto,
  CodeCheckDto,
  SecretScanDto,
  LicenseCheckDto,
} from './dto/security.dto.js'

/** API Operation
 * API Operation
 */
@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  /**
 * API Operation
 */
  @Post('scan')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: SecurityScanDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async scan(@Body() dto: SecurityScanDto) {
    const result = await this.securityService.scan(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('audit')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: SecurityAuditDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async audit(@Body() dto: SecurityAuditDto) {
    const result = await this.securityService.audit(dto)
    return {
      success: result.success,
      message: result.message,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Get('vulnerabilities')
  @ApiOperation({ summary: 'API Operation' })
  @ApiQuery({ name: 'path', description: '', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Success' })
  async getVulnerabilities(@Query('path') path: string) {
    const vulnerabilities = await this.securityService.getVulnerabilities(path)
    return {
      success: true,
      data: vulnerabilities,
    }
  }

  /**
 * API Operation
 */
  @Post('fix')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: FixVulnerabilityDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async fixVulnerability(@Body() dto: FixVulnerabilityDto) {
    const result = await this.securityService.fixVulnerability(dto)
    return {
      success: result.success,
      message: result.message,
    }
  }

  /** API Operation
   */
  @Post('code-check')
  @ApiOperation({ summary: 'API Operation' })
  @ApiResponse({ status: 200, description: 'Success' })
  async checkCode(@Body() dto: CodeCheckDto) {
    const result = await this.securityService.checkCode(dto)
    return {
      success: result.success,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Post('secrets')
  @ApiOperation({ summary: 'API Operation' })
  @ApiBody({ type: SecretScanDto })
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 200, description: 'Success' })
  async scanSecrets(@Body() dto: SecretScanDto) {
    const result = await this.securityService.scanSecrets(dto)
    return {
      success: result.success,
      data: result,
    }
  }

  /** API Operation
   */
  @Post('licenses')
  @ApiOperation({ summary: 'API Operation' })
  async checkLicenses(@Body() dto: LicenseCheckDto) {
    const result = await this.securityService.checkLicenses(dto)
    return {
      success: result.success,
      data: result,
    }
  }

  /**
 * API Operation
 */
  @Get('report')
  @ApiOperation({ summary: 'API Operation' })
  @ApiQuery({ name: 'path', description: '', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Success' })
  async generateReport(@Query('path') path: string) {
    const result = await this.securityService.generateReport(path)
    return {
      success: result.success,
      data: result.report,
    }
  }
}
