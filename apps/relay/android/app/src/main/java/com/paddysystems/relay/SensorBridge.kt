package com.paddysystems.relay

import android.webkit.JavascriptInterface

class SensorBridge(
    private val getBatteryLevel: () -> Int = { 88 },
    private val isCharging: () -> Boolean = { true },
    private val getOrientation: () -> String = { "landscape" }
) {
    @JavascriptInterface
    fun getDeviceInfo(): String {
        val battery = getBatteryLevel()
        val charging = isCharging()
        val orientation = getOrientation()
        return """{"batteryLevel": $battery, "charging": $charging, "orientation": "$orientation", "platform": "android"}"""
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        // Triggers haptic feedback
    }
}
