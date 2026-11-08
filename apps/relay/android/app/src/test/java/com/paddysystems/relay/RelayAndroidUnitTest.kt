package com.paddysystems.relay

import org.junit.Test
import kotlin.test.assertEquals
import kotlin.test.assertNotNull
import kotlin.test.assertTrue

class RelayAndroidUnitTest {

    @Test
    fun testQrCodeParserValidUrl() {
        val raw = "http://192.168.1.100:7331?token=test_token_abc&code=4B7Z9X"
        val payload = QrCodeParser.parse(raw)

        assertNotNull(payload)
        assertEquals("http://192.168.1.100:7331?token=test_token_abc&code=4B7Z9X", payload.url)
        assertEquals("192.168.1.100", payload.host)
        assertEquals(7331, payload.port)
        assertEquals("test_token_abc", payload.token)
        assertEquals("4B7Z9X", payload.shortCode)
    }

    @Test
    fun testSessionStoreHistoryAndActiveSession() {
        val store = InMemorySessionStore()
        val s1 = StoredSession("ses_1", "http://192.168.1.10:3000", "tok1", "CODE1", System.currentTimeMillis())
        val s2 = StoredSession("ses_2", "http://192.168.1.10:3001", "tok2", "CODE2", System.currentTimeMillis())

        store.saveSession(s1)
        store.saveSession(s2)

        assertEquals("ses_2", store.getActiveSession()?.sessionId)
        assertEquals(2, store.getHistory().size)

        store.clearActiveSession()
        kotlin.test.assertNull(store.getActiveSession())
    }

    @Test
    fun testAdbTunnelCommands() {
        val config = AdbTunnelConfig(localPort = 7331, remotePort = 7331, deviceSerial = "HA1TGPDC")
        val reverseCmd = AdbTunnelManager.buildReverseCommand(config)
        val forwardCmd = AdbTunnelManager.buildForwardCommand(config)

        assertEquals("adb -s HA1TGPDC reverse tcp:7331 tcp:7331", reverseCmd)
        assertEquals("adb -s HA1TGPDC forward tcp:7331 tcp:7331", forwardCmd)
        assertTrue(AdbTunnelManager.isUsbConnected(2))
    }

    @Test
    fun testLogcatParser() {
        val line = "E/RelayWebView( 1234): WebSocket connection failed: net::ERR_CONNECTION_REFUSED"
        val entry = LogcatParser.parseLine(line)

        assertNotNull(entry)
        assertEquals("E", entry.priority)
        assertEquals("RelayWebView", entry.tag)
        assertEquals("WebSocket connection failed: net::ERR_CONNECTION_REFUSED", entry.message)
    }

    @Test
    fun testSensorBridgeJson() {
        val bridge = SensorBridge(
            getBatteryLevel = { 92 },
            isCharging = { false },
            getOrientation = { "portrait" }
        )
        val info = bridge.getDeviceInfo()
        assertTrue(info.contains(""""batteryLevel": 92"""))
        assertTrue(info.contains(""""charging": false"""))
        assertTrue(info.contains(""""orientation": "portrait""""))
    }
}
