package com.paddysystems.relay

data class AdbTunnelConfig(
    val localPort: Int = 7331,
    val remotePort: Int = 7331,
    val deviceSerial: String? = null
)

object AdbTunnelManager {
    fun buildReverseCommand(config: AdbTunnelConfig): String {
        val target = if (config.deviceSerial != null) "-s ${config.deviceSerial}" else ""
        return "adb $target reverse tcp:${config.remotePort} tcp:${config.localPort}".trim()
    }

    fun buildForwardCommand(config: AdbTunnelConfig): String {
        val target = if (config.deviceSerial != null) "-s ${config.deviceSerial}" else ""
        return "adb $target forward tcp:${config.localPort} tcp:${config.remotePort}".trim()
    }

    fun isUsbConnected(batteryIntentPlugged: Int): Boolean {
        // 2 corresponds to BatteryManager.BATTERY_PLUGGED_USB
        return batteryIntentPlugged == 2
    }
}
