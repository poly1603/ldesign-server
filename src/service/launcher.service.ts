import { Injectable } from '@nestjs/common';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';

export interface LauncherOptions {
  projectPath: string;
  mode?: string; // development, production, test
  port?: number;
  host?: string;
}

export interface LauncherProcess {
  pid: number;
  projectId: number;
  command: string;
  status: 'running' | 'stopped' | 'error';
  startTime: Date;
  eventEmitter: EventEmitter;
}

@Injectable()
export class LauncherService {
  private processes: Map<string, LauncherProcess> = new Map();

  /**
   * 启动开发服务器
   */
  async dev(projectId: number, options: LauncherOptions): Promise<LauncherProcess> {
    const key = `${projectId}-dev`;
    
    // 如果已经有运行的进程，先停止它
    if (this.processes.has(key)) {
      await this.stop(key);
    }

    // 从 server/dist/service 或 server/src/service 向上查找 launcher
    const launcherPath = path.resolve(__dirname, '../../../launcher/dist/index.cjs');

    if (!await fs.pathExists(launcherPath)) {
      throw new Error(`Launcher not found at ${launcherPath}`);
    }

    const eventEmitter = new EventEmitter();
    const args = ['dev'];
    
    if (options.mode) args.push('--mode', options.mode);
    if (options.port) args.push('--port', String(options.port));
    if (options.host) args.push('--host', options.host);

    const childProcess = spawn('node', [launcherPath, ...args], {
      cwd: options.projectPath,
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    });

    const processInfo: LauncherProcess = {
      pid: childProcess.pid!,
      projectId,
      command: 'dev',
      status: 'running',
      startTime: new Date(),
      eventEmitter,
    };

    this.processes.set(key, processInfo);

    // 发送测试日志
    eventEmitter.emit('log', { 
      type: 'stdout', 
      message: `正在启动项目...\nLauncher: ${launcherPath}\n项目目录: ${options.projectPath}\n`, 
      timestamp: new Date() 
    });

    // 监听输出
    childProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      console.log('[LauncherService] stdout:', message);
      eventEmitter.emit('log', { type: 'stdout', message, timestamp: new Date() });
    });

    childProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      console.log('[LauncherService] stderr:', message);
      eventEmitter.emit('log', { type: 'stderr', message, timestamp: new Date() });
    });

    childProcess.on('error', (error) => {
      processInfo.status = 'error';
      eventEmitter.emit('log', { 
        type: 'error', 
        message: error.message, 
        timestamp: new Date() 
      });
      eventEmitter.emit('exit', { code: 1, signal: null });
    });

    childProcess.on('exit', (code, signal) => {
      processInfo.status = 'stopped';
      eventEmitter.emit('exit', { code, signal });
      this.processes.delete(key);
    });

    return processInfo;
  }

  /**
   * 构建项目
   */
  async build(projectId: number, options: LauncherOptions): Promise<LauncherProcess> {
    const key = `${projectId}-build`;
    
    const launcherPath = path.resolve(__dirname, '../../../launcher/dist/index.cjs');

    if (!await fs.pathExists(launcherPath)) {
      throw new Error(`Launcher not found at ${launcherPath}`);
    }

    const eventEmitter = new EventEmitter();
    const args = ['build'];
    
    if (options.mode) args.push('--mode', options.mode);

    const childProcess = spawn('node', [launcherPath, ...args], {
      cwd: options.projectPath,
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    });

    const processInfo: LauncherProcess = {
      pid: childProcess.pid!,
      projectId,
      command: 'build',
      status: 'running',
      startTime: new Date(),
      eventEmitter,
    };

    this.processes.set(key, processInfo);

    childProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      eventEmitter.emit('log', { type: 'stdout', message, timestamp: new Date() });
    });

    childProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      eventEmitter.emit('log', { type: 'stderr', message, timestamp: new Date() });
    });

    childProcess.on('error', (error) => {
      processInfo.status = 'error';
      eventEmitter.emit('log', { 
        type: 'error', 
        message: error.message, 
        timestamp: new Date() 
      });
      eventEmitter.emit('exit', { code: 1, signal: null });
    });

    childProcess.on('exit', (code, signal) => {
      processInfo.status = 'stopped';
      eventEmitter.emit('exit', { code, signal });
      this.processes.delete(key);
    });

    return processInfo;
  }

  /**
   * 预览构建结果
   */
  async preview(projectId: number, options: LauncherOptions): Promise<LauncherProcess> {
    const key = `${projectId}-preview`;
    
    if (this.processes.has(key)) {
      await this.stop(key);
    }

    const launcherPath = path.resolve(__dirname, '../../../launcher/dist/index.cjs');

    if (!await fs.pathExists(launcherPath)) {
      throw new Error(`Launcher not found at ${launcherPath}`);
    }

    const eventEmitter = new EventEmitter();
    const args = ['preview'];
    
    if (options.port) args.push('--port', String(options.port));
    if (options.host) args.push('--host', options.host);

    const childProcess = spawn('node', [launcherPath, ...args], {
      cwd: options.projectPath,
      shell: true,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
      },
    });

    const processInfo: LauncherProcess = {
      pid: childProcess.pid!,
      projectId,
      command: 'preview',
      status: 'running',
      startTime: new Date(),
      eventEmitter,
    };

    this.processes.set(key, processInfo);

    childProcess.stdout?.on('data', (data) => {
      const message = data.toString();
      eventEmitter.emit('log', { type: 'stdout', message, timestamp: new Date() });
    });

    childProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      eventEmitter.emit('log', { type: 'stderr', message, timestamp: new Date() });
    });

    childProcess.on('error', (error) => {
      processInfo.status = 'error';
      eventEmitter.emit('log', { 
        type: 'error', 
        message: error.message, 
        timestamp: new Date() 
      });
      eventEmitter.emit('exit', { code: 1, signal: null });
    });

    childProcess.on('exit', (code, signal) => {
      processInfo.status = 'stopped';
      eventEmitter.emit('exit', { code, signal });
      this.processes.delete(key);
    });

    return processInfo;
  }

  /**
   * 停止进程
   */
  async stop(key: string): Promise<void> {
    const processInfo = this.processes.get(key);
    if (processInfo && processInfo.status === 'running') {
      try {
        // Windows 使用 taskkill，Unix 使用 kill
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', String(processInfo.pid), '/f', '/t']);
        } else {
          process.kill(processInfo.pid, 'SIGTERM');
        }
        this.processes.delete(key);
      } catch (error) {
        console.error(`Failed to stop process ${key}:`, error);
      }
    }
  }

  /**
   * 获取进程信息
   */
  getProcess(key: string): LauncherProcess | undefined {
    return this.processes.get(key);
  }

  /**
   * 获取所有进程
   */
  getAllProcesses(): Map<string, LauncherProcess> {
    return this.processes;
  }
}
