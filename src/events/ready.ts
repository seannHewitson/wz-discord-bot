import {
  REALTIME_LISTEN_TYPES,
  REALTIME_POSTGRES_CHANGES_LISTEN_EVENT,
  RealtimeChannel,
  RealtimePostgresChangesFilter,
} from '@supabase/supabase-js'
import { ClientEvents } from 'discord.js'

import { Client } from '../client'
import { supabase } from '../supabase'
import { getFiles } from '../utils/file'
import { logger } from '../utils/logger'
import { SubscriptionMonitor } from '../utils/subscriptionMonitor'

export const name: keyof ClientEvents = 'ready'
export const once = true

// Store active subscriptions for reconnection
const activeSubscriptions = new Map<
  string,
  {
    file: any
    name: string
    channel: RealtimeChannel | null
    reconnectAttempts: number
    maxReconnectAttempts: number
    reconnectDelay: number
    isReconnecting: boolean
  }
>()

export function execute(client: Client) {
  console.log(`🤖 Logged in as ${client.user?.tag}`)
  logger.info(`Discord client ready - ${client.user?.tag}`, client)

  setupSubscriptions(client)

  // Start subscription health monitoring
  const monitor = new SubscriptionMonitor(client)
  monitor.start()
}

async function setupSubscriptions(client: Client) {
  try {
    const files = await getFiles('subscriptions')

    files.forEach(([file, name]) => {
      if ('table' in file && 'execute' in file) {
        const subscriptionKey = `${name}-${file.table}`

        // Store subscription info for reconnection
        activeSubscriptions.set(subscriptionKey, {
          file,
          name,
          channel: null,
          reconnectAttempts: 0,
          maxReconnectAttempts: 10,
          reconnectDelay: 5000, // Start with 5 seconds
          isReconnecting: false,
        })

        createSubscription(subscriptionKey, client)
      }
    })
  } catch (error) {
    logger.error(
      `Failed to setup subscriptions: ${(error as Error).message}`,
      client
    )
  }
}

function createSubscription(subscriptionKey: string, client: Client) {
  const subscription = activeSubscriptions.get(subscriptionKey)
  if (!subscription) return

  const { file, name } = subscription

  logger.info(
    `Creating subscription ${name} for table ${file.table} (attempt ${subscription.reconnectAttempts + 1})`,
    client
  )

  let event = REALTIME_POSTGRES_CHANGES_LISTEN_EVENT.INSERT
  if ('event' in file) {
    event = file.event
  }

  // Create new channel
  const channel = supabase.channel(`realtime:${file.table}:${Date.now()}`) // Add timestamp for uniqueness

  channel
    .on(
      REALTIME_LISTEN_TYPES.POSTGRES_CHANGES,
      {
        event,
        schema: 'public',
        table: file.table,
      } as RealtimePostgresChangesFilter<any>,
      (payload) => {
        try {
          // Reset reconnect attempts on successful message
          subscription.reconnectAttempts = 0
          subscription.reconnectDelay = 5000

          console.log(
            `📡 Received realtime event: ${payload.eventType} on ${file.table}`
          )

          file.execute(payload, client)
        } catch (error) {
          logger.error(
            `Subscription execute error in ${name} (${file.table}): ${(error as Error).message}`,
            client
          )
        }
      }
    )
    .subscribe((status, err) => {
      console.log(`📊 Subscription ${name} status: ${status}`)
      if (err) {
        console.error(`Subscription ${name} error: ${err.message}`)
      }

      switch (status) {
        case 'SUBSCRIBED':
          logger.info(
            `Subscription established: ${name} (${file.table})`,
            client
          )
          // Reset reconnect attempts on successful connection
          subscription.reconnectAttempts = 0
          subscription.reconnectDelay = 5000
          break

        case 'CHANNEL_ERROR':
          logger.warn(
            `Subscription channel error: ${name} (${file.table}) - ${err?.message}`,
            client
          )
          handleSubscriptionError(subscriptionKey, client, err)
          break

        case 'TIMED_OUT':
          logger.warn(`Subscription timed out: ${name} (${file.table})`, client)
          handleSubscriptionError(
            subscriptionKey,
            client,
            new Error('Subscription timed out')
          )
          break

        case 'CLOSED':
          logger.warn(`Subscription closed: ${name} (${file.table})`, client)
          handleSubscriptionError(
            subscriptionKey,
            client,
            new Error('Subscription closed')
          )
          break
      }
    })

  // Store the channel reference
  subscription.channel = channel
}

function handleSubscriptionError(
  subscriptionKey: string,
  client: Client,
  error?: Error
) {
  const subscription = activeSubscriptions.get(subscriptionKey)
  if (!subscription) return

  // Prevent recursive error handling
  if (subscription.isReconnecting) {
    return
  }

  const { name, file } = subscription
  subscription.isReconnecting = true

  // Clean up existing channel
  if (subscription.channel) {
    try {
      supabase.removeChannel(subscription.channel)
    } catch (cleanupError) {
      console.log(
        `Error cleaning up channel for ${name}: ${(cleanupError as Error).message}`
      )
    }
    subscription.channel = null
  }

  // Check if we should attempt reconnection
  if (subscription.reconnectAttempts >= subscription.maxReconnectAttempts) {
    logger.error(
      `Max reconnection attempts reached for ${name} (${file.table}): ${subscription.reconnectAttempts}/${subscription.maxReconnectAttempts}`,
      client
    )
    activeSubscriptions.delete(subscriptionKey)
    return
  }

  // Increment attempt counter and delay
  subscription.reconnectAttempts++
  subscription.reconnectDelay = Math.min(
    subscription.reconnectDelay * 1.5, // Exponential backoff
    60000 // Max 1 minute delay
  )

  logger.info(
    `Scheduling reconnection for ${name} (${file.table}) - attempt ${subscription.reconnectAttempts} in ${subscription.reconnectDelay}ms`,
    client
  )

  // Schedule reconnection with a delay to prevent immediate recursion
  setTimeout(() => {
    subscription.isReconnecting = false
    logger.info(
      `Attempting reconnection for ${name} (${file.table}) - attempt ${subscription.reconnectAttempts}`,
      client
    )
    createSubscription(subscriptionKey, client)
  }, subscription.reconnectDelay)
}

// Utility function to manually reconnect all subscriptions (if needed)
export function reconnectAllSubscriptions(client: Client) {
  logger.info(
    `Manually reconnecting all subscriptions (${activeSubscriptions.size} total)`,
    client
  )

  activeSubscriptions.forEach((subscription, key) => {
    // Clean up existing channel
    if (subscription.channel) {
      try {
        supabase.removeChannel(subscription.channel)
      } catch (error) {
        console.log(
          `Error cleaning up channel for ${subscription.name}: ${(error as Error).message}`
        )
      }
    }

    // Reset reconnection state
    subscription.reconnectAttempts = 0
    subscription.reconnectDelay = 5000
    subscription.channel = null
    subscription.isReconnecting = false

    // Recreate subscription
    createSubscription(key, client)
  })
}

// Health check function to verify subscription status
export function checkSubscriptionHealth() {
  const healthReport = {
    total: activeSubscriptions.size,
    connected: 0,
    errored: 0,
    subscriptions: [] as any[],
  }

  activeSubscriptions.forEach((subscription, key) => {
    const status = subscription.channel?.state || 'unknown'
    const isConnected = status === 'joined'

    if (isConnected) {
      healthReport.connected++
    } else {
      healthReport.errored++
    }

    healthReport.subscriptions.push({
      name: subscription.name,
      table: subscription.file.table,
      status,
      reconnectAttempts: subscription.reconnectAttempts,
      isConnected,
    })
  })

  console.log(
    `Subscription health check - Total: ${healthReport.total}, Connected: ${healthReport.connected}, Errored: ${healthReport.errored}`
  )

  return healthReport
}
