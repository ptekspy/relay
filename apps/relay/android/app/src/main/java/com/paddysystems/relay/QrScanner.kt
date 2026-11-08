package com.paddysystems.relay

import java.net.URI

data class RelayQrPayload(
    val url: String,
    val host: String,
    val port: Int,
    val token: String?,
    val shortCode: String?
)

object QrCodeParser {
    fun parse(rawText: String): RelayQrPayload? {
        val trimmed = rawText.trim()
        if (trimmed.isEmpty()) return null

        return try {
            val uri = URI(trimmed)
            val host = uri.host ?: return null
            val port = if (uri.port != -1) uri.port else (if (uri.scheme == "https") 443 else 80)
            
            val queryParams = uri.query?.split("&")?.associate {
                val parts = it.split("=", limit = 2)
                parts[0] to (parts.getOrNull(1) ?: "")
            } ?: emptyMap()

            val token = queryParams["token"]
            val shortCode = queryParams["code"]

            RelayQrPayload(
                url = trimmed,
                host = host,
                port = port,
                token = token,
                shortCode = shortCode
            )
        } catch (_: Exception) {
            null
        }
    }
}
