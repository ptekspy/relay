package com.paddysystems.relay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder

class RelayForegroundService : Service() {
    companion object {
        const val CHANNEL_ID = "relay_connection_channel"
        const val NOTIFICATION_ID = 1001

        fun start(context: Context, sessionUrl: String) {
            val intent = Intent(context, RelayForegroundService::class.java).apply {
                putExtra("SESSION_URL", sessionUrl)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, RelayForegroundService::class.java)
            context.stopService(intent)
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Relay Active Session",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps device paired with your local dev server"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
