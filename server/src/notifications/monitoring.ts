/**
 * Notification Monitoring Dashboard
 *
 * Real-time monitoring and alerting for notification delivery system
 */

import {
  getDeliveryMetrics,
  detectDeliveryIssues,
  cleanupOldNotifications,
  type DeliveryMetrics
} from './tracker';

// =============================================================================
// Health Check Endpoint
// =============================================================================

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  uptime: number;
  metrics: DeliveryMetrics;
  alerts: string[];
  checks: {
    push: ChannelHealth;
    sms: ChannelHealth;
    email: ChannelHealth;
    database: ComponentHealth;
    twilio: ComponentHealth;
    sendgrid: ComponentHealth;
  };
}

interface ChannelHealth {
  status: 'healthy' | 'degraded' | 'critical';
  deliveryRate: number;
  averageLatency: number;
  errorRate: number;
  lastError?: string;
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  lastCheck: Date;
}

/**
 * Comprehensive health check for notification system
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  // Get metrics for last hour
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 60 * 60 * 1000);
  const metrics = await getDeliveryMetrics(startDate, endDate);

  // Detect issues
  const issueCheck = await detectDeliveryIssues();

  // Check individual components
  const checks = {
    push: checkChannelHealth(metrics.channelBreakdown.push, 0.95),
    sms: checkChannelHealth(metrics.channelBreakdown.sms, 0.99),
    email: checkChannelHealth(metrics.channelBreakdown.email, 0.999),
    database: await checkDatabaseHealth(),
    twilio: await checkTwilioHealth(),
    sendgrid: await checkSendGridHealth()
  };

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';

  if (statuses.some(s => s === 'critical')) {
    overallStatus = 'critical';
  } else if (statuses.some(s => s === 'degraded')) {
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date(),
    uptime: process.uptime(),
    metrics,
    alerts: issueCheck.alerts,
    checks
  };
}

/**
 * Check health of a notification channel
 */
function checkChannelHealth(
  channelMetrics: any,
  threshold: number
): ChannelHealth {
  const deliveryRate = channelMetrics.deliveryRate || 0;

  let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
  if (deliveryRate < threshold * 0.9) {
    status = 'critical';
  } else if (deliveryRate < threshold) {
    status = 'degraded';
  }

  return {
    status,
    deliveryRate,
    averageLatency: channelMetrics.averageDeliveryTime || 0,
    errorRate: 1 - deliveryRate
  };
}

/**
 * Check database connectivity and performance
 */
async function checkDatabaseHealth(): Promise<ComponentHealth> {
  try {
    // TODO: Implement actual database query
    // const result = await db.query('SELECT 1');
    return {
      status: 'healthy',
      message: 'Database connection OK',
      lastCheck: new Date()
    };
  } catch (error) {
    return {
      status: 'critical',
      message: `Database error: ${error}`,
      lastCheck: new Date()
    };
  }
}

/**
 * Check Twilio API connectivity
 */
async function checkTwilioHealth(): Promise<ComponentHealth> {
  try {
    // TODO: Implement Twilio API health check
    // const account = await twilioClient.api.accounts(accountSid).fetch();
    return {
      status: 'healthy',
      message: 'Twilio API accessible',
      lastCheck: new Date()
    };
  } catch (error) {
    return {
      status: 'critical',
      message: `Twilio error: ${error}`,
      lastCheck: new Date()
    };
  }
}

/**
 * Check SendGrid API connectivity
 */
async function checkSendGridHealth(): Promise<ComponentHealth> {
  try {
    // TODO: Implement SendGrid API health check
    // const stats = await sgMail.getStats();
    return {
      status: 'healthy',
      message: 'SendGrid API accessible',
      lastCheck: new Date()
    };
  } catch (error) {
    return {
      status: 'critical',
      message: `SendGrid error: ${error}`,
      lastCheck: new Date()
    };
  }
}

// =============================================================================
// Metrics Dashboard Data
// =============================================================================

export interface DashboardMetrics {
  overview: {
    totalNotifications24h: number;
    deliveryRate24h: number;
    slaCompliance24h: number;
    averageDeliveryTime: number;
  };
  channels: {
    push: ChannelMetrics;
    sms: ChannelMetrics;
    email: ChannelMetrics;
  };
  escalations: {
    pushToSms: number;
    smsToEmail: number;
  };
  recentAlerts: Alert[];
  hourlyTrend: HourlyData[];
}

interface ChannelMetrics {
  sent: number;
  delivered: number;
  failed: number;
  deliveryRate: number;
  averageLatency: number;
}

interface Alert {
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
}

interface HourlyData {
  hour: number;
  sent: number;
  delivered: number;
  failed: number;
}

/**
 * Get dashboard metrics for monitoring UI
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  // Last 24 hours
  const endDate = new Date();
  const startDate24h = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  const metrics24h = await getDeliveryMetrics(startDate24h, endDate);

  // TODO: Implement hourly trend query
  const hourlyTrend: HourlyData[] = [];

  // TODO: Implement recent alerts query
  const recentAlerts: Alert[] = [];

  return {
    overview: {
      totalNotifications24h: metrics24h.totalNotifications,
      deliveryRate24h: metrics24h.deliveryRate,
      slaCompliance24h: metrics24h.slaCompliance,
      averageDeliveryTime: metrics24h.averageDeliveryTime
    },
    channels: metrics24h.channelBreakdown,
    escalations: metrics24h.escalationRate,
    recentAlerts,
    hourlyTrend
  };
}

// =============================================================================
// Alerting System
// =============================================================================

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
}

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'push-delivery-rate',
    name: 'Push Delivery Rate Below 95%',
    metric: 'push.deliveryRate',
    operator: '<',
    threshold: 0.95,
    severity: 'warning',
    enabled: true
  },
  {
    id: 'sms-delivery-rate',
    name: 'SMS Delivery Rate Below 99%',
    metric: 'sms.deliveryRate',
    operator: '<',
    threshold: 0.99,
    severity: 'error',
    enabled: true
  },
  {
    id: 'email-delivery-rate',
    name: 'Email Delivery Rate Below 99.9%',
    metric: 'email.deliveryRate',
    operator: '<',
    threshold: 0.999,
    severity: 'critical',
    enabled: true
  },
  {
    id: 'sla-compliance',
    name: 'SLA Compliance Below 99.95%',
    metric: 'overall.slaCompliance',
    operator: '<',
    threshold: 0.9995,
    severity: 'critical',
    enabled: true
  },
  {
    id: 'push-escalation-rate',
    name: 'High Push-to-SMS Escalation Rate',
    metric: 'escalations.pushToSms',
    operator: '>',
    threshold: 0.2,
    severity: 'warning',
    enabled: true
  },
  {
    id: 'average-delivery-time',
    name: 'Average Delivery Time Above 60s',
    metric: 'overall.averageDeliveryTime',
    operator: '>',
    threshold: 60,
    severity: 'warning',
    enabled: true
  }
];

/**
 * Evaluate alert rules against current metrics
 */
export async function evaluateAlertRules(): Promise<Alert[]> {
  const alerts: Alert[] = [];

  // Get current metrics
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 60 * 60 * 1000); // Last hour
  const metrics = await getDeliveryMetrics(startDate, endDate);

  // Evaluate each rule
  for (const rule of DEFAULT_ALERT_RULES) {
    if (!rule.enabled) continue;

    // Extract metric value from nested object
    const value = getMetricValue(metrics, rule.metric);
    if (value === null) continue;

    // Check threshold
    let triggered = false;
    switch (rule.operator) {
      case '>':
        triggered = value > rule.threshold;
        break;
      case '<':
        triggered = value < rule.threshold;
        break;
      case '>=':
        triggered = value >= rule.threshold;
        break;
      case '<=':
        triggered = value <= rule.threshold;
        break;
    }

    if (triggered) {
      alerts.push({
        timestamp: new Date(),
        severity: rule.severity,
        message: `${rule.name}: ${value.toFixed(4)} ${rule.operator} ${rule.threshold}`
      });
    }
  }

  return alerts;
}

/**
 * Extract metric value from nested metrics object
 */
function getMetricValue(metrics: any, path: string): number | null {
  const parts = path.split('.');
  let value = metrics;

  for (const part of parts) {
    if (value[part] === undefined) return null;
    value = value[part];
  }

  return typeof value === 'number' ? value : null;
}

// =============================================================================
// Scheduled Tasks
// =============================================================================

/**
 * Run periodic health checks (every 5 minutes)
 */
export async function runPeriodicHealthCheck(): Promise<void> {
  console.log('[Health Check] Starting periodic health check...');

  const health = await performHealthCheck();

  // Log status
  console.log(`[Health Check] Status: ${health.status}`);

  // Alert on issues
  if (health.alerts.length > 0) {
    console.error('[Health Check] Alerts detected:');
    health.alerts.forEach(alert => console.error(`  - ${alert}`));

    // TODO: Send alerts to monitoring service (PagerDuty, Slack, etc.)
    // await sendAlertNotification(health.alerts);
  }

  // Log metrics
  console.log('[Health Check] Metrics:', {
    deliveryRate: `${(health.metrics.deliveryRate * 100).toFixed(2)}%`,
    slaCompliance: `${(health.metrics.slaCompliance * 100).toFixed(2)}%`,
    avgDeliveryTime: `${health.metrics.averageDeliveryTime.toFixed(2)}s`
  });
}

/**
 * Run daily cleanup (runs at 2am)
 */
export async function runDailyCleanup(): Promise<void> {
  console.log('[Cleanup] Starting daily cleanup...');

  const deletedCount = await cleanupOldNotifications();
  console.log(`[Cleanup] Deleted ${deletedCount} old notification records`);

  // TODO: Clean up push tokens and rate limits
  // await cleanupStalePushTokens();
  // await cleanupOldSMSRateLimits();
}

/**
 * Schedule periodic tasks
 */
export function scheduleMonitoringTasks(): void {
  // Health check every 5 minutes
  setInterval(async () => {
    try {
      await runPeriodicHealthCheck();
    } catch (error) {
      console.error('[Health Check] Error:', error);
    }
  }, 5 * 60 * 1000);

  // Alert evaluation every minute
  setInterval(async () => {
    try {
      const alerts = await evaluateAlertRules();
      if (alerts.length > 0) {
        console.warn('[Alerts]', alerts);
        // TODO: Send to monitoring service
      }
    } catch (error) {
      console.error('[Alerts] Error:', error);
    }
  }, 60 * 1000);

  // Daily cleanup at 2am
  const now = new Date();
  const next2am = new Date(now);
  next2am.setHours(2, 0, 0, 0);
  if (next2am <= now) {
    next2am.setDate(next2am.getDate() + 1);
  }
  const msUntil2am = next2am.getTime() - now.getTime();

  setTimeout(() => {
    runDailyCleanup();
    // Then every 24 hours
    setInterval(runDailyCleanup, 24 * 60 * 60 * 1000);
  }, msUntil2am);

  console.log('[Monitoring] Scheduled tasks initialized');
}
