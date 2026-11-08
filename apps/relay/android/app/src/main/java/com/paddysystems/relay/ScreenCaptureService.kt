package com.paddysystems.relay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import java.io.OutputStream
import java.net.Socket
import java.nio.ByteBuffer

/**
 * Foreground service capturing physical screen display via MediaProjection and VirtualDisplay,
 * encoding video to H.264 hardware stream and transmitting over local Wi-Fi / ADB socket.
 */
class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "relay_screen_stream_channel"
        const val NOTIFICATION_ID = 1002
        const val EXTRA_RESULT_CODE = "RESULT_CODE"
        const val EXTRA_DATA = "DATA"
        const val EXTRA_WIDTH = "WIDTH"
        const val EXTRA_HEIGHT = "HEIGHT"
        const val EXTRA_DPI = "DPI"
        const val EXTRA_TARGET_PORT = "TARGET_PORT"

        fun start(
            context: Context,
            resultCode: Int,
            data: Intent,
            width: Int = 1080,
            height: Int = 1920,
            dpi: Int = 320,
            targetPort: Int = 7332
        ) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_DATA, data)
                putExtra(EXTRA_WIDTH, width)
                putExtra(EXTRA_HEIGHT, height)
                putExtra(EXTRA_DPI, dpi)
                putExtra(EXTRA_TARGET_PORT, targetPort)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, ScreenCaptureService::class.java)
            context.stopService(intent)
        }
    }

    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var mediaCodec: MediaCodec? = null
    private var isStreaming = false
    private var streamThread: Thread? = null

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent == null) return START_NOT_STICKY

        val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
        val data = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            intent.getParcelableExtra(EXTRA_DATA, Intent::class.java)
        } else {
            @Suppress("DEPRECATION")
            intent.getParcelableExtra(EXTRA_DATA)
        }
        val width = intent.getIntExtra(EXTRA_WIDTH, 1080)
        val height = intent.getIntExtra(EXTRA_HEIGHT, 1920)
        val dpi = intent.getIntExtra(EXTRA_DPI, 320)
        val targetPort = intent.getIntExtra(EXTRA_TARGET_PORT, 7332)

        if (data != null) {
            startForegroundNotification()
            initCaptureAndEncoder(resultCode, data, width, height, dpi, targetPort)
        }

        return START_STICKY
    }

    private fun startForegroundNotification() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val notification = Notification.Builder(this, CHANNEL_ID)
                .setContentTitle("Paddy Relay Live Screen Stream")
                .setContentText("Streaming physical device screen to dashboard")
                .setSmallIcon(android.R.drawable.presence_video_online)
                .build()
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun initCaptureAndEncoder(
        resultCode: Int,
        data: Intent,
        width: Int,
        height: Int,
        dpi: Int,
        targetPort: Int
    ) {
        val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, data)

        val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
            setInteger(MediaFormat.KEY_COLOR_FORMAT, MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface)
            setInteger(MediaFormat.KEY_BIT_RATE, 4_000_000) // 4 Mbps
            setInteger(MediaFormat.KEY_FRAME_RATE, 30) // 30 FPS
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 1) // 1 second keyframe interval
        }

        mediaCodec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC).apply {
            configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
        }

        val surface = mediaCodec!!.createInputSurface()
        mediaCodec!!.start()

        virtualDisplay = mediaProjection!!.createVirtualDisplay(
            "RelayScreenCapture",
            width,
            height,
            dpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            surface,
            null,
            null
        )

        isStreaming = true
        streamThread = Thread {
            runStreamingLoop(targetPort)
        }.apply { start() }
    }

    private fun runStreamingLoop(targetPort: Int) {
        var socket: Socket? = null
        var outputStream: OutputStream? = null
        val bufferInfo = MediaCodec.BufferInfo()

        try {
            socket = Socket("127.0.0.1", targetPort)
            outputStream = socket.getOutputStream()

            while (isStreaming && mediaCodec != null) {
                val outputBufferIndex = mediaCodec!!.dequeueOutputBuffer(bufferInfo, 10_000)
                if (outputBufferIndex >= 0) {
                    val outputBuffer = mediaCodec!!.getOutputBuffer(outputBufferIndex)
                    if (outputBuffer != null && bufferInfo.size > 0) {
                        outputBuffer.position(bufferInfo.offset)
                        outputBuffer.limit(bufferInfo.offset + bufferInfo.size)

                        val chunk = ByteArray(bufferInfo.size)
                        outputBuffer.get(chunk)
                        outputStream.write(chunk)
                        outputStream.flush()
                    }
                    mediaCodec!!.releaseOutputBuffer(outputBufferIndex, false)
                }
            }
        } catch (_: Exception) {
            // Socket or encoder closed
        } finally {
            try { outputStream?.close() } catch (_: Exception) {}
            try { socket?.close() } catch (_: Exception) {}
        }
    }

    override fun onDestroy() {
        isStreaming = false
        streamThread?.interrupt()
        streamThread = null

        virtualDisplay?.release()
        virtualDisplay = null

        mediaCodec?.stop()
        mediaCodec?.release()
        mediaCodec = null

        mediaProjection?.stop()
        mediaProjection = null

        super.onDestroy()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Screen Streaming Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifies when device screen is actively streamed"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }
}
