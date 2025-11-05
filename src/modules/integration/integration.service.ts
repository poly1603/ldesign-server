import { Injectable } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as https from 'https'
import * as http from 'http'
import {
  GitHubRepoDto,
  GitHubIssueDto,
  GitHubPRDto,
  GitHubWorkflowDto,
  GitLabProjectDto,
  GitLabPipelineDto,
  GitLabMergeRequestDto,
  DockerBuildDto,
  DockerRunDto,
  DockerOperationDto,
  DockerImageDto,
  JenkinsJobDto,
  JenkinsQueryDto,
  IntegrationConfigDto,
  ListIntegrationConfigDto,
  IntegrationType,
} from './dto/integration.dto.js'

const execAsync = promisify(exec)

@Injectable()
export class IntegrationService {
  // Operation
  private configs: Map<string, any> = new Map()

  // Operation

  async getGitHubRepo(dto: GitHubRepoDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}`
    const result = await this.githubRequest(url, 'GET', dto.token)
    
    return {
      success: true,
      data: result,
    }
  }

  async listGitHubIssues(dto: GitHubRepoDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}/issues`
    const result = await this.githubRequest(url, 'GET', dto.token)
    
    return {
      success: true,
      data: result,
    }
  }

  async createGitHubIssue(dto: GitHubIssueDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}/issues`
    const body = {
      title: dto.title,
      body: dto.body,
      labels: dto.labels,
      assignees: dto.assignees,
    }
    
    const result = await this.githubRequest(url, 'POST', dto.token, body)
    
    return {
      success: true,
      data: result,
      message: 'Issue',
    }
  }

  async createGitHubPR(dto: GitHubPRDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}/pulls`
    const body = {
      title: dto.title,
      body: dto.body,
      head: dto.head,
      base: dto.base,
    }
    
    const result = await this.githubRequest(url, 'POST', dto.token, body)
    
    return {
      success: true,
      data: result,
      message: 'Pull Request',
    }
  }

  async listGitHubWorkflows(dto: GitHubRepoDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}/actions/workflows`
    const result = await this.githubRequest(url, 'GET', dto.token)
    
    return {
      success: true,
      data: result,
    }
  }

  async triggerGitHubWorkflow(dto: GitHubWorkflowDto) {
    const url = `https://api.github.com/repos/${dto.owner}/${dto.repo}/actions/workflows/${dto.workflowFile}/dispatches`
    const body = {
      ref: dto.ref || 'main',
      inputs: dto.inputs || {},
    }
    
    await this.githubRequest(url, 'POST', dto.token, body)
    
    return {
      success: true,
      message: 'GitHub Workflow',
    }
  }

  // Operation

  async getGitLabProject(dto: GitLabProjectDto) {
    const baseUrl = dto.gitlabUrl || 'https://gitlab.com'
    const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(dto.projectId)}`
    const result = await this.gitlabRequest(url, 'GET', dto.token)
    
    return {
      success: true,
      data: result,
    }
  }

  async listGitLabPipelines(dto: GitLabProjectDto) {
    const baseUrl = dto.gitlabUrl || 'https://gitlab.com'
    const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(dto.projectId)}/pipelines`
    const result = await this.gitlabRequest(url, 'GET', dto.token)
    
    return {
      success: true,
      data: result,
    }
  }

  async triggerGitLabPipeline(dto: GitLabPipelineDto) {
    const baseUrl = dto.gitlabUrl || 'https://gitlab.com'
    const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(dto.projectId)}/pipeline`
    const body = {
      ref: dto.ref,
      variables: dto.variables,
    }
    
    const result = await this.gitlabRequest(url, 'POST', dto.token, body)
    
    return {
      success: true,
      data: result,
      message: 'GitLab Pipeline',
    }
  }

  async createGitLabMR(dto: GitLabMergeRequestDto) {
    const baseUrl = dto.gitlabUrl || 'https://gitlab.com'
    const url = `${baseUrl}/api/v4/projects/${encodeURIComponent(dto.projectId)}/merge_requests`
    const body = {
      title: dto.title,
      description: dto.description,
      source_branch: dto.sourceBranch,
      target_branch: dto.targetBranch,
    }
    
    const result = await this.gitlabRequest(url, 'POST', dto.token, body)
    
    return {
      success: true,
      data: result,
      message: 'Merge Request',
    }
  }

  // Operation

  async dockerBuild(dto: DockerBuildDto) {
    const buildArgsStr = dto.buildArgs
      ? Object.entries(dto.buildArgs).map(([key, value]) => `--build-arg ${key}=${value}`).join(' ')
      : ''
    
    const command = `docker build -f ${dto.dockerfile} ${buildArgsStr} -t ${dto.tag} ${dto.context}`
    
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      data: {
        stdout,
        stderr,
        tag: dto.tag,
      },
      message: 'Docker',
    }
  }

  async dockerRun(dto: DockerRunDto) {
    const portsStr = dto.ports ? dto.ports.map(p => `-p ${p}`).join(' ') : ''
    const envStr = dto.env ? Object.entries(dto.env).map(([k, v]) => `-e ${k}=${v}`).join(' ') : ''
    const volumesStr = dto.volumes ? dto.volumes.map(v => `-v ${v}`).join(' ') : ''
    const nameStr = dto.name ? `--name ${dto.name}` : ''
    const detachStr = dto.detach !== false ? '-d' : ''
    
    const command = `docker run ${detachStr} ${nameStr} ${portsStr} ${envStr} ${volumesStr} ${dto.image}`.replace(/\s+/g, ' ').trim()
    
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      data: {
        stdout,
        stderr,
        containerId: stdout.trim(),
      },
      message: 'Docker',
    }
  }

  async dockerOperation(dto: DockerOperationDto) {
    let command: string
    
    switch (dto.operation) {
      case 'stop':
        command = `docker stop ${dto.container}`
        break
      case 'remove':
        command = `docker rm ${dto.container}`
        break
      case 'logs':
        command = `docker logs ${dto.container}`
        break
      default:
        throw new Error(`: ${dto.operation}`)
    }
    
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      data: {
        stdout,
        stderr,
      },
      message: `Docker ${dto.operation} `,
    }
  }

  async dockerPs() {
    const { stdout } = await execAsync('docker ps -a --format "{{json .}}"')
    const containers = stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
    
    return {
      success: true,
      data: containers,
    }
  }

  async dockerImages() {
    const { stdout } = await execAsync('docker images --format "{{json .}}"')
    const images = stdout.trim().split('\n').filter(Boolean).map(line => JSON.parse(line))
    
    return {
      success: true,
      data: images,
    }
  }

  async dockerPush(dto: DockerImageDto) {
    const tag = dto.tag ? `${dto.image}:${dto.tag}` : dto.image
    const command = `docker push ${tag}`
    
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      data: {
        stdout,
        stderr,
      },
      message: '',
    }
  }

  async dockerPull(dto: DockerImageDto) {
    const tag = dto.tag ? `${dto.image}:${dto.tag}` : dto.image
    const command = `docker pull ${tag}`
    
    const { stdout, stderr } = await execAsync(command)
    
    return {
      success: true,
      data: {
        stdout,
        stderr,
      },
      message: '',
    }
  }

  // Operation

  async triggerJenkinsJob(dto: JenkinsJobDto) {
    const auth = dto.username && dto.token
      ? Buffer.from(`${dto.username}:${dto.token}`).toString('base64')
      : undefined
    
    const url = `${dto.jenkinsUrl}/job/${dto.jobName}/buildWithParameters`
    const params = new URLSearchParams(dto.parameters || {}).toString()
    const fullUrl = params ? `${url}?${params}` : `${dto.jenkinsUrl}/job/${dto.jobName}/build`
    
    await this.jenkinsRequest(fullUrl, 'POST', auth)
    
    return {
      success: true,
      message: 'Jenkins Job',
    }
  }

  async getJenkinsJobStatus(dto: JenkinsQueryDto) {
    const auth = dto.username && dto.token
      ? Buffer.from(`${dto.username}:${dto.token}`).toString('base64')
      : undefined
    
    const url = dto.buildNumber
      ? `${dto.jenkinsUrl}/job/${dto.jobName}/${dto.buildNumber}/api/json`
      : `${dto.jenkinsUrl}/job/${dto.jobName}/lastBuild/api/json`
    
    const result = await this.jenkinsRequest(url, 'GET', auth)
    
    return {
      success: true,
      data: result,
    }
  }

  async listJenkinsJobs(jenkinsUrl: string, username?: string, token?: string) {
    const auth = username && token
      ? Buffer.from(`${username}:${token}`).toString('base64')
      : undefined
    
    const url = `${jenkinsUrl}/api/json?tree=jobs[name,url,color,lastBuild[number,result,timestamp]]`
    const result = await this.jenkinsRequest(url, 'GET', auth)
    
    return {
      success: true,
      data: result,
    }
  }

  // Operation

  async saveConfig(dto: IntegrationConfigDto) {
    const key = `${dto.type}:${dto.name}`
    this.configs.set(key, {
      type: dto.type,
      name: dto.name,
      config: dto.config,
      createdAt: new Date(),
    })
    
    return {
      success: true,
      message: '',
    }
  }

  async listConfigs(dto: ListIntegrationConfigDto) {
    const configs = Array.from(this.configs.values())
    const filtered = dto.type
      ? configs.filter(c => c.type === dto.type)
      : configs
    
    return {
      success: true,
      data: filtered,
    }
  }

  async getConfig(type: IntegrationType, name: string) {
    const key = `${type}:${name}`
    const config = this.configs.get(key)
    
    if (!config) {
      throw new Error('')
    }
    
    return {
      success: true,
      data: config,
    }
  }

  async deleteConfig(type: IntegrationType, name: string) {
    const key = `${type}:${name}`
    const deleted = this.configs.delete(key)
    
    if (!deleted) {
      throw new Error('')
    }
    
    return {
      success: true,
      message: '',
    }
  }

  // Operation

  private githubRequest(url: string, method: string, token?: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers: any = {
        'User-Agent': 'LDesign-Integration',
        'Accept': 'application/vnd.github.v3+json',
      }
      
      if (token) {
        headers['Authorization'] = `token ${token}`
      }
      
      if (body) {
        headers['Content-Type'] = 'application/json'
      }
      
      const options = {
        method,
        headers,
      }
      
      const req = https.request(url, options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : {})
          } else {
            reject(new Error(`GitHub API: ${res.statusCode} - ${data}`))
          }
        })
      })
      
      req.on('error', reject)
      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  }

  private gitlabRequest(url: string, method: string, token?: string, body?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers: any = {
        'User-Agent': 'LDesign-Integration',
      }
      
      if (token) {
        headers['PRIVATE-TOKEN'] = token
      }
      
      if (body) {
        headers['Content-Type'] = 'application/json'
      }
      
      const options = {
        method,
        headers,
      }
      
      const req = https.request(url, options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data ? JSON.parse(data) : {})
          } else {
            reject(new Error(`GitLab API: ${res.statusCode} - ${data}`))
          }
        })
      })
      
      req.on('error', reject)
      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  }

  private jenkinsRequest(url: string, method: string, auth?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers: any = {
        'User-Agent': 'LDesign-Integration',
      }
      
      if (auth) {
        headers['Authorization'] = `Basic ${auth}`
      }
      
      const protocol = url.startsWith('https') ? https : http
      const options = {
        method,
        headers,
      }
      
      const req = protocol.request(url, options, (res) => {
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
            try {
              resolve(data ? JSON.parse(data) : {})
            } catch {
              resolve({ raw: data })
            }
          } else {
            reject(new Error(`Jenkins API: ${res.statusCode} - ${data}`))
          }
        })
      })
      
      req.on('error', reject)
      req.end()
    })
  }
}
