package com.paddysystems.relay

data class StoredSession(
    val sessionId: String,
    val targetUrl: String,
    val token: String?,
    val shortCode: String?,
    val pairedAt: Long
)

class InMemorySessionStore {
    private var currentSession: StoredSession? = null
    private val sessionHistory = mutableListOf<StoredSession>()

    fun saveSession(session: StoredSession) {
        currentSession = session
        sessionHistory.add(0, session)
        if (sessionHistory.size > 10) {
            sessionHistory.removeAt(sessionHistory.lastIndex)
        }
    }

    fun getActiveSession(): StoredSession? = currentSession

    fun clearActiveSession() {
        currentSession = null
    }

    fun getHistory(): List<StoredSession> = sessionHistory.toList()
}
