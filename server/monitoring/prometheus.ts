/**
 * Prometheus 指标收集模块
 * 用于收集系统性能、代理、注册等关键指标
 */

export interface PrometheusMetrics {
  // 系统指标
  systemUptime: number; // 系统运行时间（秒）
  cpuUsage: number; // CPU 使用率（%）
  memoryUsage: number; // 内存使用率（%）
  diskUsage: number; // 磁盘使用率（%）

  // 注册指标
  totalRegistrations: number; // 总注册数
  successfulRegistrations: number; // 成功注册数
  failedRegistrations: number; // 失败注册数
  registrationSuccessRate: number; // 注册成功率（%）
  averageRegistrationTime: number; // 平均注册时间（秒）

  // 代理指标
  totalProxiesUsed: number; // 使用的代理总数
  healthyProxies: number; // 健康代理数
  unhealthyProxies: number; // 不健康代理数
  proxySuccessRate: number; // 代理成功率（%）
  averageProxyResponseTime: number; // 平均代理响应时间（毫秒）

  // 任务指标
  activeTasks: number; // 活跃任务数
  completedTasks: number; // 已完成任务数
  failedTasks: number; // 失败任务数
  averageTaskDuration: number; // 平均任务耗时（秒）

  // 用户指标
  activeUsers: number; // 活跃用户数
  totalUsers: number; // 总用户数
  usersWithValidCardKeys: number; // 有效卡密用户数

  // 错误指标
  totalErrors: number; // 总错误数
  recentErrors: string[]; // 最近的错误信息
}

export class PrometheusCollector {
  private metrics: PrometheusMetrics = {
    systemUptime: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    totalRegistrations: 0,
    successfulRegistrations: 0,
    failedRegistrations: 0,
    registrationSuccessRate: 0,
    averageRegistrationTime: 0,
    totalProxiesUsed: 0,
    healthyProxies: 0,
    unhealthyProxies: 0,
    proxySuccessRate: 0,
    averageProxyResponseTime: 0,
    activeTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTaskDuration: 0,
    activeUsers: 0,
    totalUsers: 0,
    usersWithValidCardKeys: 0,
    totalErrors: 0,
    recentErrors: [],
  };

  private startTime = Date.now();
  private registrationTimes: number[] = [];
  private proxyResponseTimes: number[] = [];
  private taskDurations: number[] = [];
  private errorQueue: string[] = [];
  private maxErrorQueueSize = 100;

  /**
   * 获取所有指标
   */
  getMetrics(): PrometheusMetrics {
    return { ...this.metrics };
  }

  /**
   * 获取 Prometheus 格式的指标文本
   */
  getPrometheusText(): string {
    const lines: string[] = [];

    // 系统指标
    lines.push(`# HELP system_uptime_seconds System uptime in seconds`);
    lines.push(`# TYPE system_uptime_seconds gauge`);
    lines.push(`system_uptime_seconds ${this.metrics.systemUptime}`);

    lines.push(`# HELP system_cpu_usage_percent CPU usage percentage`);
    lines.push(`# TYPE system_cpu_usage_percent gauge`);
    lines.push(`system_cpu_usage_percent ${this.metrics.cpuUsage}`);

    lines.push(`# HELP system_memory_usage_percent Memory usage percentage`);
    lines.push(`# TYPE system_memory_usage_percent gauge`);
    lines.push(`system_memory_usage_percent ${this.metrics.memoryUsage}`);

    lines.push(`# HELP system_disk_usage_percent Disk usage percentage`);
    lines.push(`# TYPE system_disk_usage_percent gauge`);
    lines.push(`system_disk_usage_percent ${this.metrics.diskUsage}`);

    // 注册指标
    lines.push(`# HELP registrations_total Total number of registration attempts`);
    lines.push(`# TYPE registrations_total counter`);
    lines.push(`registrations_total ${this.metrics.totalRegistrations}`);

    lines.push(`# HELP registrations_successful_total Total successful registrations`);
    lines.push(`# TYPE registrations_successful_total counter`);
    lines.push(`registrations_successful_total ${this.metrics.successfulRegistrations}`);

    lines.push(`# HELP registrations_failed_total Total failed registrations`);
    lines.push(`# TYPE registrations_failed_total counter`);
    lines.push(`registrations_failed_total ${this.metrics.failedRegistrations}`);

    lines.push(`# HELP registration_success_rate_percent Registration success rate`);
    lines.push(`# TYPE registration_success_rate_percent gauge`);
    lines.push(`registration_success_rate_percent ${this.metrics.registrationSuccessRate}`);

    lines.push(`# HELP registration_average_time_seconds Average registration time`);
    lines.push(`# TYPE registration_average_time_seconds gauge`);
    lines.push(`registration_average_time_seconds ${this.metrics.averageRegistrationTime}`);

    // 代理指标
    lines.push(`# HELP proxies_used_total Total proxies used`);
    lines.push(`# TYPE proxies_used_total counter`);
    lines.push(`proxies_used_total ${this.metrics.totalProxiesUsed}`);

    lines.push(`# HELP proxies_healthy_count Healthy proxies count`);
    lines.push(`# TYPE proxies_healthy_count gauge`);
    lines.push(`proxies_healthy_count ${this.metrics.healthyProxies}`);

    lines.push(`# HELP proxies_unhealthy_count Unhealthy proxies count`);
    lines.push(`# TYPE proxies_unhealthy_count gauge`);
    lines.push(`proxies_unhealthy_count ${this.metrics.unhealthyProxies}`);

    lines.push(`# HELP proxy_success_rate_percent Proxy success rate`);
    lines.push(`# TYPE proxy_success_rate_percent gauge`);
    lines.push(`proxy_success_rate_percent ${this.metrics.proxySuccessRate}`);

    lines.push(`# HELP proxy_average_response_time_ms Average proxy response time`);
    lines.push(`# TYPE proxy_average_response_time_ms gauge`);
    lines.push(`proxy_average_response_time_ms ${this.metrics.averageProxyResponseTime}`);

    // 任务指标
    lines.push(`# HELP tasks_active_count Active tasks count`);
    lines.push(`# TYPE tasks_active_count gauge`);
    lines.push(`tasks_active_count ${this.metrics.activeTasks}`);

    lines.push(`# HELP tasks_completed_total Completed tasks total`);
    lines.push(`# TYPE tasks_completed_total counter`);
    lines.push(`tasks_completed_total ${this.metrics.completedTasks}`);

    lines.push(`# HELP tasks_failed_total Failed tasks total`);
    lines.push(`# TYPE tasks_failed_total counter`);
    lines.push(`tasks_failed_total ${this.metrics.failedTasks}`);

    lines.push(`# HELP task_average_duration_seconds Average task duration`);
    lines.push(`# TYPE task_average_duration_seconds gauge`);
    lines.push(`task_average_duration_seconds ${this.metrics.averageTaskDuration}`);

    // 用户指标
    lines.push(`# HELP users_active_count Active users count`);
    lines.push(`# TYPE users_active_count gauge`);
    lines.push(`users_active_count ${this.metrics.activeUsers}`);

    lines.push(`# HELP users_total_count Total users count`);
    lines.push(`# TYPE users_total_count gauge`);
    lines.push(`users_total_count ${this.metrics.totalUsers}`);

    lines.push(`# HELP users_with_valid_cardkeys_count Users with valid card keys`);
    lines.push(`# TYPE users_with_valid_cardkeys_count gauge`);
    lines.push(`users_with_valid_cardkeys_count ${this.metrics.usersWithValidCardKeys}`);

    // 错误指标
    lines.push(`# HELP errors_total_count Total errors count`);
    lines.push(`# TYPE errors_total_count counter`);
    lines.push(`errors_total_count ${this.metrics.totalErrors}`);

    return lines.join("\n");
  }

  /**
   * 记录注册事件
   */
  recordRegistration(success: boolean, duration: number): void {
    this.metrics.totalRegistrations++;

    if (success) {
      this.metrics.successfulRegistrations++;
    } else {
      this.metrics.failedRegistrations++;
    }

    this.registrationTimes.push(duration);
    if (this.registrationTimes.length > 1000) {
      this.registrationTimes.shift();
    }

    this.updateRegistrationMetrics();
  }

  /**
   * 记录代理使用
   */
  recordProxyUsage(success: boolean, responseTime: number): void {
    this.metrics.totalProxiesUsed++;
    this.proxyResponseTimes.push(responseTime);

    if (this.proxyResponseTimes.length > 1000) {
      this.proxyResponseTimes.shift();
    }

    this.updateProxyMetrics();
  }

  /**
   * 更新代理健康状态
   */
  updateProxyHealth(healthy: number, unhealthy: number): void {
    this.metrics.healthyProxies = healthy;
    this.metrics.unhealthyProxies = unhealthy;

    const total = healthy + unhealthy;
    this.metrics.proxySuccessRate = total > 0 ? (healthy / total) * 100 : 0;
  }

  /**
   * 记录任务事件
   */
  recordTask(active: number, completed: number, failed: number, duration: number): void {
    this.metrics.activeTasks = active;
    this.metrics.completedTasks = completed;
    this.metrics.failedTasks = failed;

    this.taskDurations.push(duration);
    if (this.taskDurations.length > 1000) {
      this.taskDurations.shift();
    }

    this.updateTaskMetrics();
  }

  /**
   * 更新用户指标
   */
  updateUserMetrics(active: number, total: number, withValidKeys: number): void {
    this.metrics.activeUsers = active;
    this.metrics.totalUsers = total;
    this.metrics.usersWithValidCardKeys = withValidKeys;
  }

  /**
   * 记录错误
   */
  recordError(error: string): void {
    this.metrics.totalErrors++;
    this.errorQueue.push(`[${new Date().toISOString()}] ${error}`);

    if (this.errorQueue.length > this.maxErrorQueueSize) {
      this.errorQueue.shift();
    }

    this.metrics.recentErrors = [...this.errorQueue];
  }

  /**
   * 更新系统指标
   */
  updateSystemMetrics(cpu: number, memory: number, disk: number): void {
    this.metrics.cpuUsage = cpu;
    this.metrics.memoryUsage = memory;
    this.metrics.diskUsage = disk;
    this.metrics.systemUptime = (Date.now() - this.startTime) / 1000;
  }

  /**
   * 私有方法：更新注册指标
   */
  private updateRegistrationMetrics(): void {
    if (this.metrics.totalRegistrations > 0) {
      this.metrics.registrationSuccessRate =
        (this.metrics.successfulRegistrations / this.metrics.totalRegistrations) * 100;
    }

    if (this.registrationTimes.length > 0) {
      const sum = this.registrationTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageRegistrationTime = sum / this.registrationTimes.length;
    }
  }

  /**
   * 私有方法：更新代理指标
   */
  private updateProxyMetrics(): void {
    if (this.proxyResponseTimes.length > 0) {
      const sum = this.proxyResponseTimes.reduce((a, b) => a + b, 0);
      this.metrics.averageProxyResponseTime = sum / this.proxyResponseTimes.length;
    }
  }

  /**
   * 私有方法：更新任务指标
   */
  private updateTaskMetrics(): void {
    if (this.taskDurations.length > 0) {
      const sum = this.taskDurations.reduce((a, b) => a + b, 0);
      this.metrics.averageTaskDuration = sum / this.taskDurations.length;
    }
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.metrics = {
      systemUptime: 0,
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      totalRegistrations: 0,
      successfulRegistrations: 0,
      failedRegistrations: 0,
      registrationSuccessRate: 0,
      averageRegistrationTime: 0,
      totalProxiesUsed: 0,
      healthyProxies: 0,
      unhealthyProxies: 0,
      proxySuccessRate: 0,
      averageProxyResponseTime: 0,
      activeTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageTaskDuration: 0,
      activeUsers: 0,
      totalUsers: 0,
      usersWithValidCardKeys: 0,
      totalErrors: 0,
      recentErrors: [],
    };

    this.registrationTimes = [];
    this.proxyResponseTimes = [];
    this.taskDurations = [];
    this.errorQueue = [];
    this.startTime = Date.now();
  }
}

// 全局指标收集器实例
export const prometheusCollector = new PrometheusCollector();
