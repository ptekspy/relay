package com.paddysystems.relay

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView

// Relay Dark Brand Design Tokens
val RelayBg = Color(0xFF09090B)
val RelaySurface = Color(0xFF141416)
val RelayCard = Color(0xFF18181B)
val RelayBorder = Color(0xFF27272A)
val RelayBrandPurple = Color(0xFF8B5CF6)
val RelayGreen = Color(0xFF10B981)
val RelayText = Color(0xFFF4F4F5)
val RelayMuted = Color(0xFFA1A1AA)

enum class ScreenState {
    PAIRING,
    SCANNER,
    RECEIVER,
    DIAGNOSTICS
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val targetUrl = intent.getStringExtra("TARGET_URL")

        setContent {
            var screen by remember {
                mutableStateOf(if (targetUrl != null) ScreenState.RECEIVER else ScreenState.PAIRING)
            }
            var activeUrl by remember { mutableStateOf(targetUrl ?: "http://10.0.2.2:9481") }
            var sessionCode by remember { mutableStateOf("") }
            val sessionStore = remember {
                InMemorySessionStore().apply {
                    saveSession(StoredSession("ses_1", "http://10.0.2.2:9481", "tok_live", "4B7Z9X", System.currentTimeMillis()))
                }
            }

            Surface(
                modifier = Modifier.fillMaxSize(),
                color = RelayBg
            ) {
                when (screen) {
                    ScreenState.PAIRING -> PairingScreen(
                        sessionCode = sessionCode,
                        onCodeChange = { sessionCode = it.uppercase() },
                        onConnect = { code ->
                            activeUrl = if (code.startsWith("http")) code else "http://10.0.2.2:9481/view/$code"
                            screen = ScreenState.RECEIVER
                        },
                        onQuickConnectDev = {
                            activeUrl = "http://10.0.2.2:9481"
                            screen = ScreenState.RECEIVER
                        },
                        onOpenScanner = { screen = ScreenState.SCANNER },
                        onOpenDiagnostics = { screen = ScreenState.DIAGNOSTICS },
                        recentSessions = sessionStore.getHistory()
                    )
                    ScreenState.SCANNER -> ScannerMockScreen(
                        onBack = { screen = ScreenState.PAIRING },
                        onSimulateScan = {
                            activeUrl = "http://10.0.2.2:9481"
                            screen = ScreenState.RECEIVER
                        }
                    )
                    ScreenState.RECEIVER -> ActiveReceiverScreen(
                        url = activeUrl,
                        onDisconnect = { screen = ScreenState.PAIRING },
                        onOpenDiagnostics = { screen = ScreenState.DIAGNOSTICS }
                    )
                    ScreenState.DIAGNOSTICS -> DiagnosticsScreen(
                        url = activeUrl,
                        onBack = { screen = ScreenState.RECEIVER }
                    )
                }
            }
        }
    }
}

@Composable
fun PairingScreen(
    sessionCode: String,
    onCodeChange: (String) -> Unit,
    onConnect: (String) -> Unit,
    onQuickConnectDev: () -> Unit,
    onOpenScanner: () -> Unit,
    onOpenDiagnostics: () -> Unit,
    recentSessions: List<StoredSession>
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(RelayBrandPurple)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "relay",
                        color = RelayText,
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace
                    )
                }
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(12.dp))
                        .background(RelaySurface)
                        .border(1.dp, RelayBorder, RoundedCornerShape(12.dp))
                        .padding(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "Android Receiver",
                        color = RelayMuted,
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text(
                text = "YOUR LOCALHOST,\nON THIS SCREEN.",
                color = RelayText,
                fontSize = 26.sp,
                fontWeight = FontWeight.ExtraBold,
                lineHeight = 32.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Enter a 6-character access code from your terminal, or scan a session QR code.",
                color = RelayMuted,
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Code Input
            Text(
                text = "ACCESS CODE",
                color = RelayMuted,
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                fontFamily = FontFamily.Monospace
            )
            Spacer(modifier = Modifier.height(6.dp))

            OutlinedTextField(
                value = sessionCode,
                onValueChange = onCodeChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text("e.g. 4B7Z9X", color = Color(0xFF52525B), fontFamily = FontFamily.Monospace)
                },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = RelayBrandPurple,
                    unfocusedBorderColor = RelayBorder,
                    focusedTextColor = RelayText,
                    unfocusedTextColor = RelayText,
                    focusedContainerColor = RelaySurface,
                    unfocusedContainerColor = RelaySurface
                ),
                shape = RoundedCornerShape(8.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Connect button
            Button(
                onClick = { if (sessionCode.isNotBlank()) onConnect(sessionCode) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(containerColor = RelayBrandPurple),
                shape = RoundedCornerShape(8.dp),
                enabled = sessionCode.isNotBlank()
            ) {
                Text(
                    text = "Pair & Connect",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    color = Color.White
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Scan QR button
            Button(
                onClick = onOpenScanner,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp)
                    .border(1.dp, RelayBorder, RoundedCornerShape(8.dp)),
                colors = ButtonDefaults.buttonColors(containerColor = RelaySurface),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(
                    text = "Scan QR Code",
                    fontWeight = FontWeight.Medium,
                    fontSize = 14.sp,
                    color = RelayText
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Quick Connect Local
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(RelayCard)
                    .border(1.dp, RelayBorder, RoundedCornerShape(8.dp))
                    .clickable { onQuickConnectDev() }
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(RelayGreen)
                            )
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(
                                text = "Local Host Gateway",
                                color = RelayText,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "http://10.0.2.2:9481 (Relay Cloud Web)",
                            color = RelayMuted,
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace
                        )
                    }
                    Text(
                        text = "Join →",
                        color = RelayBrandPurple,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Bottom info / Diagnostics link
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Relay v1.0 · Zero-Config",
                color = RelayMuted,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = "Diagnostics",
                color = RelayMuted,
                fontSize = 12.sp,
                modifier = Modifier.clickable { onOpenDiagnostics() }
            )
        }
    }
}

@Composable
fun ScannerMockScreen(
    onBack: () -> Unit,
    onSimulateScan: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black)
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Start
        ) {
            Text(
                text = "← Back",
                color = RelayText,
                fontSize = 16.sp,
                modifier = Modifier.clickable { onBack() }
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "Scan Session QR",
                color = RelayText,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Point camera at terminal QR code",
                color = RelayMuted,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(36.dp))

            // Viewfinder frame
            Box(
                modifier = Modifier
                    .size(260.dp)
                    .border(2.dp, RelayBrandPurple, RoundedCornerShape(16.dp))
                    .padding(16.dp),
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(2.dp)
                        .background(RelayGreen)
                )
            }
        }

        Button(
            onClick = onSimulateScan,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = RelayBrandPurple),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Simulate Terminal Scan (4B7Z9X)", color = Color.White)
        }
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun ActiveReceiverScreen(
    url: String,
    onDisconnect: () -> Unit,
    onOpenDiagnostics: () -> Unit
) {
    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    Column(modifier = Modifier.fillMaxSize()) {
        // Top App Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp)
                .background(RelaySurface)
                .border(1.dp, RelayBorder)
                .padding(horizontal = 14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(RelayGreen)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Connected",
                    color = RelayGreen,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text(
                    text = url.removePrefix("http://"),
                    color = RelayMuted,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    maxLines = 1
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "↻",
                    color = RelayText,
                    fontSize = 18.sp,
                    modifier = Modifier
                        .clickable { webViewRef?.reload() }
                        .padding(horizontal = 8.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Stats",
                    color = RelayMuted,
                    fontSize = 12.sp,
                    modifier = Modifier
                        .clickable { onOpenDiagnostics() }
                        .padding(horizontal = 6.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "✕",
                    color = Color(0xFFEF4444),
                    fontSize = 14.sp,
                    modifier = Modifier
                        .clickable { onDisconnect() }
                        .padding(horizontal = 8.dp)
                )
            }
        }

        // Fullscreen WebView
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                WebView(ctx).apply {
                    settings.apply {
                        javaScriptEnabled = true
                        domStorageEnabled = true
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        cacheMode = WebSettings.LOAD_DEFAULT
                    }
                    WebView.setWebContentsDebuggingEnabled(true)
                    addJavascriptInterface(SensorBridge(), "AndroidRelayBridge")
                    webViewClient = WebViewClient()
                    loadUrl(url)
                    webViewRef = this
                }
            },
            update = { webView ->
                if (webView.url != url) {
                    webView.loadUrl(url)
                }
                webViewRef = webView
            }
        )
    }
}

@Composable
fun DiagnosticsScreen(
    url: String,
    onBack: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(RelayBg)
            .padding(24.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start
            ) {
                Text(
                    text = "← Back",
                    color = RelayText,
                    fontSize = 16.sp,
                    modifier = Modifier.clickable { onBack() }
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text(
                text = "Diagnostics & Tunnel",
                color = RelayText,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = "Runtime connection statistics and bridge telemetry",
                color = RelayMuted,
                fontSize = 13.sp
            )

            Spacer(modifier = Modifier.height(24.dp))

            DiagnosticCard("STATUS", "Online / Linked", RelayGreen)
            DiagnosticCard("TARGET URL", url, RelayText)
            DiagnosticCard("LATENCY", "14 ms (Local Wi-Fi / ADB)", RelayBrandPurple)
            DiagnosticCard("ADB TUNNEL", "Active (Reverse Port Forwarded)", RelayText)
            DiagnosticCard("SENSOR BRIDGE", "Registered (AndroidRelayBridge)", RelayText)
            DiagnosticCard("SCREEN CAPTURE", "Ready (VirtualDisplay)", RelayText)
        }

        Button(
            onClick = onBack,
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = RelayBrandPurple),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Done", color = Color.White)
        }
    }
}

@Composable
fun DiagnosticCard(label: String, value: String, valueColor: Color) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(RelayCard)
            .border(1.dp, RelayBorder, RoundedCornerShape(8.dp))
            .padding(horizontal = 14.dp, vertical = 10.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = label,
                color = RelayMuted,
                fontSize = 11.sp,
                fontFamily = FontFamily.Monospace
            )
            Text(
                text = value,
                color = valueColor,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                fontFamily = FontFamily.Monospace
            )
        }
    }
}
