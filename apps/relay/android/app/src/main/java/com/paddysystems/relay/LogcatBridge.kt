package com.paddysystems.relay

data class LogcatEntry(
    val priority: String,
    val tag: String,
    val message: String,
    val timestampMs: Long = System.currentTimeMillis()
)

object LogcatParser {
    private val LOGCAT_LINE_REGEX = Regex("""^([VDIWEF])/(.+?)\s*\(\s*\d+\s*\):\s*(.*)$""")

    fun parseLine(line: String): LogcatEntry? {
        val trimmed = line.trim()
        if (trimmed.isEmpty()) return null

        val match = LOGCAT_LINE_REGEX.find(trimmed) ?: return null
        val (priority, tag, message) = match.destructured

        return LogcatEntry(
            priority = priority,
            tag = tag.trim(),
            message = message.trim()
        )
    }

    fun filterByTag(entries: List<LogcatEntry>, targetTag: String): List<LogcatEntry> {
        return entries.filter { it.tag.equals(targetTag, ignoreCase = true) }
    }
}
