import { Client } from '../client'
import {
  checkSubscriptionHealth,
  reconnectAllSubscriptions,
} from '../events/ready'
import { logger } from './logger'

export class SubscriptionMonitor {
  private client: Client
  private healthCheckInterval: NodeJS.Timeout | null = null
  private readonly HEALTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  constructor(client: Client) {
    this.client = client
  }

  start() {
    logger.info(
      `Starting subscription health monitor (${this.HEALTH_CHECK_INTERVAL / 1000}s interval)`,
      this.client
    )

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.HEALTH_CHECK_INTERVAL)
  }

  stop() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
      logger.info('Subscription health monitor stopped', this.client)
    }
  }

  private performHealthCheck() {
    try {
      const health = checkSubscriptionHealth()

      // If more than 50% of subscriptions are errored, trigger reconnection
      const errorThreshold = health.total * 0.5

      if (health.errored > errorThreshold && health.total > 0) {
        logger.warn(
          `High subscription error rate detected (${health.errored}/${health.total}), triggering reconnection`,
          this.client
        )

        reconnectAllSubscriptions(this.client)
      }
    } catch (error) {
      logger.error(
        `Health check failed: ${(error as Error).message}`,
        this.client
      )
    }
  }
}
