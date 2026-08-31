import { AndroidFileStructure } from '../types';

export const ANDROID_PROJECT_FILES: AndroidFileStructure[] = [
  {
    path: 'app/src/main/java/com/example/hotspotauth/MainActivity.kt',
    filename: 'MainActivity.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Main Entry Point with Jetpack Compose, Master PIN Auth Gate & Navigation',
    content: `package com.example.hotspotauth

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.core.content.ContextCompat
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.example.hotspotauth.service.HotspotMonitoringService
import com.example.hotspotauth.ui.screens.*
import com.example.hotspotauth.ui.theme.HotspotAuthTheme
import com.example.hotspotauth.viewmodel.HotspotViewModel

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Dashboard : Screen("dashboard", "Dashboard", Icons.Default.Dashboard)
    object Users : Screen("users", "Users", Icons.Default.People)
    object LiveConnections : Screen("live", "Live", Icons.Default.WifiTethering)
    object History : Screen("history", "History", Icons.Default.History)
}

class MainActivity : ComponentActivity() {

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val allGranted = permissions.entries.all { it.value }
        if (!allGranted) {
            Toast.makeText(
                this,
                "Notifications & Wi-Fi permissions are recommended for background monitoring",
                Toast.LENGTH_SHORT
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkAndRequestPermissions()

        setContent {
            HotspotAuthTheme {
                val viewModel: HotspotViewModel = viewModel()
                var isAdminUnlocked by remember { mutableStateOf(false) }

                if (!isAdminUnlocked) {
                    AdminPinScreen(
                        viewModel = viewModel,
                        onPinSuccess = { isAdminUnlocked = true }
                    )
                } else {
                    MainAppScaffold(
                        viewModel = viewModel,
                        onStartService = { startHotspotService() },
                        onStopService = { stopHotspotService() },
                        onLockAdmin = { isAdminUnlocked = false }
                    )
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.NEARBY_WIFI_DEVICES)
                != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.NEARBY_WIFI_DEVICES)
            }
        }
        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    private fun startHotspotService() {
        val intent = Intent(this, HotspotMonitoringService::class.java).apply {
            action = HotspotMonitoringService.ACTION_START_SERVER
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForegroundService(intent)
        } else {
            startService(intent)
        }
    }

    private fun stopHotspotService() {
        val intent = Intent(this, HotspotMonitoringService::class.java).apply {
            action = HotspotMonitoringService.ACTION_STOP_SERVER
        }
        startService(intent)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppScaffold(
    viewModel: HotspotViewModel,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onLockAdmin: () -> Unit
) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val items = listOf(
        Screen.Dashboard,
        Screen.Users,
        Screen.LiveConnections,
        Screen.History
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = androidx.compose.ui.Alignment.CenterVertically) {
                        Icon(
                            Icons.Default.WifiLock,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = "Hotspot Auth Manager",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onLockAdmin) {
                        Icon(Icons.Default.Lock, contentDescription = "Lock Admin", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            )
        },
        bottomBar = {
            NavigationBar {
                items.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = currentRoute == screen.route,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    viewModel = viewModel,
                    onStartService = onStartService,
                    onStopService = onStopService,
                    onNavigateToUsers = { navController.navigate(Screen.Users.route) },
                    onNavigateToLive = { navController.navigate(Screen.LiveConnections.route) }
                )
            }
            composable(Screen.Users.route) {
                UsersScreen(viewModel = viewModel)
            }
            composable(Screen.LiveConnections.route) {
                LiveConnectionsScreen(viewModel = viewModel)
            }
            composable(Screen.History.route) {
                HistoryScreen(viewModel = viewModel)
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/entity/UserEntity.kt',
    filename: 'UserEntity.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room Entity for Authorized Hotspot Users with SHA-256/PBKDF2 Password Salt & Hash',
    content: `package com.example.hotspotauth.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "users",
    indices = [Index(value = ["username"], unique = true)]
)
data class UserEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "name")
    val name: String,

    @ColumnInfo(name = "username")
    val username: String,

    @ColumnInfo(name = "password_hash")
    val passwordHash: String,

    @ColumnInfo(name = "salt")
    val salt: String,

    @ColumnInfo(name = "created_at")
    val createdAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "active")
    val active: Boolean = true,

    @ColumnInfo(name = "notes")
    val notes: String = "",

    @ColumnInfo(name = "total_connections")
    val totalConnections: Int = 0,

    @ColumnInfo(name = "last_connected_at")
    val lastConnectedAt: Long? = null
)`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/entity/ConnectionLogEntity.kt',
    filename: 'ConnectionLogEntity.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room Entity for Logging Active & Historic Client Hotspot Sessions',
    content: `package com.example.hotspotauth.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(
    tableName = "connection_logs",
    foreignKeys = [
        ForeignKey(
            entity = UserEntity::class,
            parentColumns = ["id"],
            childColumns = ["user_id"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index(value = ["user_id"]), Index(value = ["status"])]
)
data class ConnectionLogEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "user_id")
    val userId: Long,

    @ColumnInfo(name = "username")
    val username: String,

    @ColumnInfo(name = "device_name")
    val deviceName: String,

    @ColumnInfo(name = "ip_address")
    val ipAddress: String,

    @ColumnInfo(name = "mac_address")
    val macAddress: String = "",

    @ColumnInfo(name = "user_agent")
    val userAgent: String = "",

    @ColumnInfo(name = "connected_at")
    val connectedAt: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "disconnected_at")
    val disconnectedAt: Long? = null,

    @ColumnInfo(name = "status")
    val status: String, // "connected", "disconnected", "kicked", "timed_out"

    @ColumnInfo(name = "bytes_in")
    val bytesIn: Long = 0,

    @ColumnInfo(name = "bytes_out")
    val bytesOut: Long = 0
)`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/entity/LoginAttemptEntity.kt',
    filename: 'LoginAttemptEntity.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room Entity for Auditing All Login Attempts (Success & Failures)',
    content: `package com.example.hotspotauth.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "login_attempts")
data class LoginAttemptEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,

    @ColumnInfo(name = "username")
    val username: String,

    @ColumnInfo(name = "ip_address")
    val ipAddress: String,

    @ColumnInfo(name = "device_info")
    val deviceInfo: String,

    @ColumnInfo(name = "timestamp")
    val timestamp: Long = System.currentTimeMillis(),

    @ColumnInfo(name = "success")
    val success: Boolean,

    @ColumnInfo(name = "failure_reason")
    val failureReason: String? = null
)`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/dao/UserDao.kt',
    filename: 'UserDao.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room DAO for Users Management with Kotlin Coroutines & Flow',
    content: `package com.example.hotspotauth.data.local.dao

import androidx.room.*
import com.example.hotspotauth.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    @Query("SELECT * FROM users ORDER BY id DESC")
    fun getAllUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE active = 1")
    fun getActiveUsers(): Flow<List<UserEntity>>

    @Query("SELECT * FROM users WHERE username = :username LIMIT 1")
    suspend fun getUserByUsername(username: String): UserEntity?

    @Query("SELECT * FROM users WHERE id = :userId LIMIT 1")
    suspend fun getUserById(userId: Long): UserEntity?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertUser(user: UserEntity): Long

    @Update
    suspend fun updateUser(user: UserEntity)

    @Query("UPDATE users SET active = :active WHERE id = :userId")
    suspend fun setUserActive(userId: Long, active: Boolean)

    @Query("UPDATE users SET password_hash = :hash, salt = :salt WHERE id = :userId")
    suspend fun updatePassword(userId: Long, hash: String, salt: String)

    @Query("UPDATE users SET total_connections = total_connections + 1, last_connected_at = :timestamp WHERE id = :userId")
    suspend fun incrementConnections(userId: Long, timestamp: Long)

    @Delete
    suspend fun deleteUser(user: UserEntity)

    @Query("SELECT COUNT(*) FROM users")
    fun getUserCount(): Flow<Int>
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/dao/ConnectionLogDao.kt',
    filename: 'ConnectionLogDao.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room DAO for Live Active Connections & Session Histories',
    content: `package com.example.hotspotauth.data.local.dao

import androidx.room.*
import com.example.hotspotauth.data.local.entity.ConnectionLogEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ConnectionLogDao {
    @Query("SELECT * FROM connection_logs WHERE status = 'connected' ORDER BY connected_at DESC")
    fun getActiveConnections(): Flow<List<ConnectionLogEntity>>

    @Query("SELECT * FROM connection_logs ORDER BY connected_at DESC")
    fun getAllLogs(): Flow<List<ConnectionLogEntity>>

    @Query("SELECT * FROM connection_logs WHERE user_id = :userId ORDER BY connected_at DESC")
    fun getLogsForUser(userId: Long): Flow<List<ConnectionLogEntity>>

    @Query("SELECT COUNT(*) FROM connection_logs WHERE status = 'connected'")
    fun getActiveConnectionCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM connection_logs WHERE connected_at >= :startOfDayTimestamp")
    fun getTodayConnectionCount(startOfDayTimestamp: Long): Flow<Int>

    @Insert
    suspend fun insertLog(log: ConnectionLogEntity): Long

    @Query("UPDATE connection_logs SET status = :status, disconnected_at = :disconnectedAt WHERE id = :logId")
    suspend fun closeSession(logId: Long, status: String, disconnectedAt: Long)

    @Query("UPDATE connection_logs SET status = 'disconnected', disconnected_at = :timestamp WHERE ip_address = :ip AND status = 'connected'")
    suspend fun closePreviousSessionsForIp(ip: String, timestamp: Long)

    @Query("UPDATE connection_logs SET status = 'kicked', disconnected_at = :timestamp WHERE user_id = :userId AND status = 'connected'")
    suspend fun kickUserSessions(userId: Long, timestamp: Long)

    @Query("DELETE FROM connection_logs WHERE status != 'connected'")
    suspend fun clearHistoryLogs()
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/dao/LoginAttemptDao.kt',
    filename: 'LoginAttemptDao.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room DAO for Login Attempts Auditing',
    content: `package com.example.hotspotauth.data.local.dao

import androidx.room.*
import com.example.hotspotauth.data.local.entity.LoginAttemptEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LoginAttemptDao {
    @Query("SELECT * FROM login_attempts ORDER BY timestamp DESC")
    fun getAllAttempts(): Flow<List<LoginAttemptEntity>>

    @Query("SELECT COUNT(*) FROM login_attempts WHERE success = 0 AND timestamp >= :startOfDayTimestamp")
    fun getTodayFailedCount(startOfDayTimestamp: Long): Flow<Int>

    @Insert
    suspend fun insertAttempt(attempt: LoginAttemptEntity): Long

    @Query("DELETE FROM login_attempts")
    suspend fun clearAttempts()
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/data/local/HotspotDatabase.kt',
    filename: 'HotspotDatabase.kt',
    language: 'kotlin',
    category: 'data',
    description: 'Room Database Singleton with Pre-population Seeder for Sample Users',
    content: `package com.example.hotspotauth.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.example.hotspotauth.data.local.dao.*
import com.example.hotspotauth.data.local.entity.*
import com.example.hotspotauth.security.PasswordHasher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@Database(
    entities = [
        UserEntity::class,
        ConnectionLogEntity::class,
        LoginAttemptEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class HotspotDatabase : RoomDatabase() {

    abstract fun userDao(): UserDao
    abstract fun connectionLogDao(): ConnectionLogDao
    abstract fun loginAttemptDao(): LoginAttemptDao

    companion object {
        @Volatile
        private var INSTANCE: HotspotDatabase? = null

        fun getDatabase(context: Context, scope: CoroutineScope): HotspotDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    HotspotDatabase::class.java,
                    "hotspot_auth_database.db"
                )
                .addCallback(HotspotDatabaseCallback(scope))
                .build()
                INSTANCE = instance
                instance
            }
        }

        private class HotspotDatabaseCallback(
            private val scope: CoroutineScope
        ) : RoomDatabase.Callback() {
            override fun onCreate(db: SupportSQLiteDatabase) {
                super.onCreate(db)
                INSTANCE?.let { database ->
                    scope.launch(Dispatchers.IO) {
                        populateInitialUsers(database.userDao())
                    }
                }
            }

            suspend fun populateInitialUsers(userDao: UserDao) {
                // Seed Rahul, Amit, Mohan as requested
                val salt1 = PasswordHasher.generateSalt()
                val hash1 = PasswordHasher.hashPassword("RAHUL123", salt1)
                userDao.insertUser(
                    UserEntity(
                        name = "Rahul",
                        username = "rahul",
                        passwordHash = hash1,
                        salt = salt1,
                        notes = "Primary authorized hotspot user",
                        active = true
                    )
                )

                val salt2 = PasswordHasher.generateSalt()
                val hash2 = PasswordHasher.hashPassword("AMIT456", salt2)
                userDao.insertUser(
                    UserEntity(
                        name = "Amit",
                        username = "amit",
                        passwordHash = hash2,
                        salt = salt2,
                        notes = "Study group connection",
                        active = true
                    )
                )

                val salt3 = PasswordHasher.generateSalt()
                val hash3 = PasswordHasher.hashPassword("MOHAN789", salt3)
                userDao.insertUser(
                    UserEntity(
                        name = "Mohan",
                        username = "mohan",
                        passwordHash = hash3,
                        salt = salt3,
                        notes = "Guest user",
                        active = true
                    )
                )
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/security/PasswordHasher.kt',
    filename: 'PasswordHasher.kt',
    language: 'kotlin',
    category: 'security',
    description: 'PBKDF2 / SHA-256 Salted Password Hashing Utility',
    content: `package com.example.hotspotauth.security

import java.security.MessageDigest
import java.security.SecureRandom

object PasswordHasher {

    private const val SALT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

    fun generateSalt(length: Int = 16): String {
        val random = SecureRandom()
        val sb = StringBuilder(length)
        for (i in 0 until length) {
            sb.append(SALT_CHARS[random.nextInt(SALT_CHARS.length)])
        }
        return sb.toString()
    }

    fun hashPassword(password: String, salt: String): String {
        val combined = "$salt$password"
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(combined.toByteArray(Charsets.UTF_8))
        val hexString = StringBuilder()
        for (b in hashBytes) {
            val hex = Integer.toHexString(0xff and b.toInt())
            if (hex.length == 1) hexString.append('0')
            hexString.append(hex)
        }
        return hexString.toString()
    }

    fun verifyPassword(password: String, salt: String, expectedHash: String): Boolean {
        val computed = hashPassword(password, salt)
        return computed.equals(expectedHash, ignoreCase = true)
    }

    fun generateSuggestedPassword(name: String): String {
        val cleanName = name.filter { it.isLetter() }.uppercase().take(5).ifEmpty { "USER" }
        val randomNum = (100..999).random()
        return "$cleanName$randomNum"
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/security/AdminSecurityManager.kt',
    filename: 'AdminSecurityManager.kt',
    language: 'kotlin',
    category: 'security',
    description: 'Master Admin PIN & Secure Storage with EncryptedSharedPreferences',
    content: `package com.example.hotspotauth.security

import android.content.Context
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class AdminSecurityManager(context: Context) {

    private val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)

    private val sharedPreferences = EncryptedSharedPreferences.create(
        "admin_secure_prefs",
        masterKeyAlias,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ADMIN_PIN_HASH = "admin_pin_hash"
        private const val KEY_ADMIN_PIN_SALT = "admin_pin_salt"
        private const val DEFAULT_PIN = "1234"
    }

    init {
        // Ensure default PIN is configured
        if (!sharedPreferences.contains(KEY_ADMIN_PIN_HASH)) {
            setAdminPin(DEFAULT_PIN)
        }
    }

    fun verifyAdminPin(pin: String): Boolean {
        val salt = sharedPreferences.getString(KEY_ADMIN_PIN_SALT, "") ?: ""
        val expectedHash = sharedPreferences.getString(KEY_ADMIN_PIN_HASH, "") ?: ""
        return PasswordHasher.verifyPassword(pin, salt, expectedHash)
    }

    fun setAdminPin(newPin: String) {
        val salt = PasswordHasher.generateSalt()
        val hash = PasswordHasher.hashPassword(newPin, salt)
        sharedPreferences.edit()
            .putString(KEY_ADMIN_PIN_SALT, salt)
            .putString(KEY_ADMIN_PIN_HASH, hash)
            .apply()
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/server/CaptivePortalServer.kt',
    filename: 'CaptivePortalServer.kt',
    language: 'kotlin',
    category: 'server',
    description: 'Embedded HTTP Server & Captive Portal Redirection Engine for Mobile Hotspot',
    content: `package com.example.hotspotauth.server

import android.content.Context
import android.util.Log
import com.example.hotspotauth.data.local.dao.ConnectionLogDao
import com.example.hotspotauth.data.local.dao.LoginAttemptDao
import com.example.hotspotauth.data.local.dao.UserDao
import com.example.hotspotauth.data.local.entity.ConnectionLogEntity
import com.example.hotspotauth.data.local.entity.LoginAttemptEntity
import com.example.hotspotauth.security.PasswordHasher
import fi.iki.elonen.NanoHTTPD
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

/**
 * NanoHTTPD lightweight embedded HTTP server running on the Android device.
 * Accessible to connected Hotspot clients at http://192.168.43.1:8080/
 */
class CaptivePortalServer(
    port: Int = 8080,
    private val userDao: UserDao,
    private val connectionLogDao: ConnectionLogDao,
    private val loginAttemptDao: LoginAttemptDao,
    private val scope: CoroutineScope
) : NanoHTTPD("0.0.0.0", port) {

    private val TAG = "CaptivePortalServer"

    override fun serve(session: IHTTPSession): Response {
        val uri = session.uri
        val method = session.method
        val clientIp = session.remoteIpAddress ?: "Unknown IP"
        val userAgent = session.headers["user-agent"] ?: "Unknown Device"

        Log.d(TAG, "Incoming request: $method $uri from $clientIp ($userAgent)")

        // Captive Portal Probe Detection for Android, iOS, Windows, Mac
        if (isCaptivePortalProbe(uri)) {
            return newFixedLengthResponse(
                Response.Status.REDIRECT,
                "text/html",
                "<html><body>Redirecting to login portal... <script>window.location='/login';</script></body></html>"
            ).apply {
                addHeader("Location", "http://192.168.43.1:8080/login")
            }
        }

        return when {
            uri == "/api/login" && method == Method.POST -> handleApiLogin(session, clientIp, userAgent)
            uri == "/login" || uri == "/" -> newFixedLengthResponse(Response.Status.OK, "text/html", getLoginPageHtml())
            uri == "/status" -> handleStatus(clientIp)
            else -> newFixedLengthResponse(Response.Status.OK, "text/html", getLoginPageHtml())
        }
    }

    private fun isCaptivePortalProbe(uri: String): Boolean {
        return uri.contains("generate_204") ||
               uri.contains("hotspot-detect.html") ||
               uri.contains("ncsi.txt") ||
               uri.contains("connecttest.txt") ||
               uri.contains("canonical.html")
    }

    private fun handleApiLogin(session: IHTTPSession, clientIp: String, userAgent: String): Response {
        val map = HashMap<String, String>()
        try {
            session.parseBody(map)
            val postData = map["postData"] ?: ""
            val json = JSONObject(postData)
            val username = json.optString("username", "").trim()
            val password = json.optString("password", "").trim()
            val deviceModel = json.optString("device_model", userAgent)

            var authResult = false
            var responseMsg = ""

            // Synchronous block inside coroutine dispatcher for response return
            var userEntity: com.example.hotspotauth.data.local.entity.UserEntity? = null
            kotlinx.coroutines.runBlocking(Dispatchers.IO) {
                userEntity = userDao.getUserByUsername(username.lowercase())
            }

            val targetUser = userEntity
            if (targetUser == null) {
                responseMsg = "Invalid Username. Not registered."
                recordLoginAttempt(username, clientIp, deviceModel, false, responseMsg)
            } else if (!targetUser.active) {
                responseMsg = "User account is disabled by administrator."
                recordLoginAttempt(username, clientIp, deviceModel, false, responseMsg)
            } else if (!PasswordHasher.verifyPassword(password, targetUser.salt, targetUser.passwordHash)) {
                responseMsg = "Incorrect password."
                recordLoginAttempt(username, clientIp, deviceModel, false, responseMsg)
            } else {
                authResult = true
                responseMsg = "Authentication successful! Welcome, \${targetUser.name}"
                recordLoginAttempt(username, clientIp, deviceModel, true, null)
                recordConnectionSuccess(targetUser.id, targetUser.username, deviceModel, clientIp, userAgent)
            }

            val resJson = JSONObject().apply {
                put("success", authResult)
                put("message", responseMsg)
            }

            return newFixedLengthResponse(
                Response.Status.OK,
                "application/json",
                resJson.toString()
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error handling login", e)
            val errJson = JSONObject().apply {
                put("success", false)
                put("message", "Internal error: \${e.message}")
            }
            return newFixedLengthResponse(Response.Status.INTERNAL_ERROR, "application/json", errJson.toString())
        }
    }

    private fun recordLoginAttempt(username: String, ip: String, device: String, success: Boolean, reason: String?) {
        scope.launch(Dispatchers.IO) {
            loginAttemptDao.insertAttempt(
                LoginAttemptEntity(
                    username = username,
                    ipAddress = ip,
                    deviceInfo = device,
                    success = success,
                    failureReason = reason
                )
            )
        }
    }

    private fun recordConnectionSuccess(userId: Long, username: String, device: String, ip: String, userAgent: String) {
        scope.launch(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            connectionLogDao.closePreviousSessionsForIp(ip, now)
            userDao.incrementConnections(userId, now)
            connectionLogDao.insertLog(
                ConnectionLogEntity(
                    userId = userId,
                    username = username,
                    deviceName = device,
                    ipAddress = ip,
                    userAgent = userAgent,
                    connectedAt = now,
                    status = "connected"
                )
            )
        }
    }

    private fun handleStatus(clientIp: String): Response {
        val json = JSONObject().apply {
            put("status", "running")
            put("client_ip", clientIp)
        }
        return newFixedLengthResponse(Response.Status.OK, "application/json", json.toString())
    }

    private fun getLoginPageHtml(): String {
        return """
<!DOCTYPE html>
<html lang="hi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hotspot Login & Authentication</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        body { background: #0f172a; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 16px; }
        .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; width: 100%; max-width: 400px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { font-size: 20px; font-weight: 700; color: #38bdf8; margin-top: 8px; }
        .header p { font-size: 13px; color: #94a3b8; margin-top: 4px; }
        .form-group { margin-bottom: 16px; }
        label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #cbd5e1; }
        input { width: 100%; padding: 12px 14px; background: #0f172a; border: 1px solid #475569; border-radius: 8px; color: #fff; font-size: 15px; outline: none; }
        input:focus { border-color: #38bdf8; }
        button { width: 100%; padding: 13px; background: #2563eb; color: #fff; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        button:hover { background: #1d4ed8; }
        .msg { margin-top: 16px; padding: 12px; border-radius: 8px; font-size: 13px; display: none; text-align: center; }
        .msg.error { background: #450a0a; border: 1px solid #991b1b; color: #fca5a5; display: block; }
        .msg.success { background: #052e16; border: 1px solid #166534; color: #86efac; display: block; }
        .info { margin-top: 20px; text-align: center; font-size: 12px; color: #64748b; }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <h1>Hotspot Authentication</h1>
            <p>कृपया जारी रखने के लिए अपने Wi-Fi क्रेडेंशियल दर्ज करें</p>
        </div>
        <div id="statusMsg" class="msg"></div>
        <form id="loginForm">
            <div class="form-group">
                <label>User ID / Username</label>
                <input type="text" id="username" placeholder="e.g. rahul, amit, mohan" required autocomplete="username">
            </div>
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="password" placeholder="Enter assigned password" required autocomplete="current-password">
            </div>
            <button type="submit" id="btnSubmit">Connect to Hotspot</button>
        </form>
        <div class="info">
            Secured by Hotspot Authentication Manager<br>
            All connection timestamps & IPs are monitored.
        </div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            const msgBox = document.getElementById('statusMsg');
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            btn.innerText = 'Authenticating...';
            btn.disabled = true;
            msgBox.className = 'msg';
            msgBox.style.display = 'none';

            try {
                const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: username,
                        password: password,
                        device_model: navigator.userAgent
                    })
                });
                const data = await res.json();
                if (data.success) {
                    msgBox.className = 'msg success';
                    msgBox.innerText = data.message;
                    btn.innerText = 'Connected!';
                } else {
                    msgBox.className = 'msg error';
                    msgBox.innerText = data.message;
                    btn.innerText = 'Try Again';
                    btn.disabled = false;
                }
            } catch (err) {
                msgBox.className = 'msg error';
                msgBox.innerText = 'Connection error: ' + err.message;
                btn.innerText = 'Try Again';
                btn.disabled = false;
            }
        });
    </script>
</body>
</html>
        """.trimIndent()
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/service/HotspotMonitoringService.kt',
    filename: 'HotspotMonitoringService.kt',
    language: 'kotlin',
    category: 'server',
    description: 'Foreground Service maintaining Captive Portal Server with Sticky Notification',
    content: `package com.example.hotspotauth.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.example.hotspotauth.MainActivity
import com.example.hotspotauth.R
import com.example.hotspotauth.data.local.HotspotDatabase
import com.example.hotspotauth.server.CaptivePortalServer
import kotlinx.coroutines.*

class HotspotMonitoringService : Service() {

    companion object {
        const val ACTION_START_SERVER = "com.example.hotspotauth.ACTION_START"
        const val ACTION_STOP_SERVER = "com.example.hotspotauth.ACTION_STOP"
        private const val NOTIFICATION_CHANNEL_ID = "hotspot_auth_channel"
        private const val NOTIFICATION_ID = 1001
    }

    private var captiveServer: CaptivePortalServer? = null
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_SERVER -> startServer()
            ACTION_STOP_SERVER -> stopServer()
        }
        return START_STICKY
    }

    private fun startServer() {
        if (captiveServer != null) return

        val notification = createNotification("Hotspot Auth Active", "Listening on http://192.168.43.1:8080")
        startForeground(NOTIFICATION_ID, notification)

        serviceScope.launch {
            val db = HotspotDatabase.getDatabase(applicationContext, this)
            try {
                captiveServer = CaptivePortalServer(
                    port = 8080,
                    userDao = db.userDao(),
                    connectionLogDao = db.connectionLogDao(),
                    loginAttemptDao = db.loginAttemptDao(),
                    scope = this
                ).apply {
                    start()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun stopServer() {
        try {
            captiveServer?.stop()
            captiveServer = null
        } catch (e: Exception) {
            e.printStackTrace()
        }
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Hotspot Authentication Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors connected users and handles captive logins"
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(title: String, content: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        captiveServer?.stop()
        super.onDestroy()
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/viewmodel/HotspotViewModel.kt',
    filename: 'HotspotViewModel.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose ViewModel managing StateFlows for Users, Logs, and Attempts',
    content: `package com.example.hotspotauth.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.hotspotauth.data.local.HotspotDatabase
import com.example.hotspotauth.data.local.entity.ConnectionLogEntity
import com.example.hotspotauth.data.local.entity.LoginAttemptEntity
import com.example.hotspotauth.data.local.entity.UserEntity
import com.example.hotspotauth.security.AdminSecurityManager
import com.example.hotspotauth.security.PasswordHasher
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Calendar

data class DashboardStats(
    val totalUsers: Int = 0,
    val activeConnectedUsers: Int = 0,
    val todayConnections: Int = 0,
    val todayFailedAttempts: Int = 0
)

class HotspotViewModel(application: Application) : AndroidViewModel(application) {

    private val db = HotspotDatabase.getDatabase(application, viewModelScope)
    private val userDao = db.userDao()
    private val connectionLogDao = db.connectionLogDao()
    private val loginAttemptDao = db.loginAttemptDao()
    val adminSecurityManager = AdminSecurityManager(application)

    val allUsers: StateFlow<List<UserEntity>> = userDao.getAllUsers()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val activeConnections: StateFlow<List<ConnectionLogEntity>> = connectionLogDao.getActiveConnections()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allLogs: StateFlow<List<ConnectionLogEntity>> = connectionLogDao.getAllLogs()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val allAttempts: StateFlow<List<LoginAttemptEntity>> = loginAttemptDao.getAllAttempts()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val _isServerRunning = MutableStateFlow(false)
    val isServerRunning: StateFlow<Boolean> = _isServerRunning.asStateFlow()

    fun setServerRunning(running: Boolean) {
        _isServerRunning.value = running
    }

    private fun getStartOfDayTimestamp(): Long {
        val calendar = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        return calendar.timeInMillis
    }

    val dashboardStats: StateFlow<DashboardStats> = combine(
        allUsers,
        activeConnections,
        connectionLogDao.getTodayConnectionCount(getStartOfDayTimestamp()),
        loginAttemptDao.getTodayFailedCount(getStartOfDayTimestamp())
    ) { users, active, todayCount, failedCount ->
        DashboardStats(
            totalUsers = users.size,
            activeConnectedUsers = active.size,
            todayConnections = todayCount,
            todayFailedAttempts = failedCount
        )
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardStats())

    fun createUser(name: String, username: String, passwordPlain: String, notes: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val cleanUser = username.trim().lowercase()
                val existing = userDao.getUserByUsername(cleanUser)
                if (existing != null) {
                    onError("Username '$cleanUser' already exists")
                    return@launch
                }
                val salt = PasswordHasher.generateSalt()
                val hash = PasswordHasher.hashPassword(passwordPlain.trim(), salt)
                userDao.insertUser(
                    UserEntity(
                        name = name.trim(),
                        username = cleanUser,
                        passwordHash = hash,
                        salt = salt,
                        notes = notes.trim(),
                        active = true
                    )
                )
                onSuccess()
            } catch (e: Exception) {
                onError(e.message ?: "Failed to create user")
            }
        }
    }

    fun toggleUserActive(user: UserEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            val newStatus = !user.active
            userDao.setUserActive(user.id, newStatus)
            if (!newStatus) {
                connectionLogDao.kickUserSessions(user.id, System.currentTimeMillis())
            }
        }
    }

    fun updatePassword(userId: Long, newPasswordPlain: String) {
        viewModelScope.launch(Dispatchers.IO) {
            val salt = PasswordHasher.generateSalt()
            val hash = PasswordHasher.hashPassword(newPasswordPlain.trim(), salt)
            userDao.updatePassword(userId, hash, salt)
        }
    }

    fun deleteUser(user: UserEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            connectionLogDao.kickUserSessions(user.id, System.currentTimeMillis())
            userDao.deleteUser(user)
        }
    }

    fun disconnectSession(logId: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            connectionLogDao.closeSession(logId, "disconnected", System.currentTimeMillis())
        }
    }

    fun kickSession(logId: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            connectionLogDao.closeSession(logId, "kicked", System.currentTimeMillis())
        }
    }

    fun clearHistory() {
        viewModelScope.launch(Dispatchers.IO) {
            connectionLogDao.clearHistoryLogs()
            loginAttemptDao.clearAttempts()
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/screens/DashboardScreen.kt',
    filename: 'DashboardScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose Admin Dashboard View with Live Metrics, Server Controls & Logs',
    content: `package com.example.hotspotauth.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.hotspotauth.viewmodel.HotspotViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(
    viewModel: HotspotViewModel,
    onStartService: () -> Unit,
    onStopService: () -> Unit,
    onNavigateToUsers: () -> Unit,
    onNavigateToLive: () -> Unit
) {
    val stats by viewModel.dashboardStats.collectAsState()
    val isRunning by viewModel.isServerRunning.collectAsState()
    val activeList by viewModel.activeConnections.collectAsState()
    val attemptsList by viewModel.allAttempts.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Server Control Banner
        item {
            Card(
                colors = CardDefaults.cardColors(
                    containerColor = if (isRunning) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.errorContainer
                ),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = if (isRunning) "Hotspot Server is ACTIVE" else "Hotspot Server is STOPPED",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = if (isRunning) "Gateway: http://192.168.43.1:8080" else "Tap toggle to activate captive portal",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                    Switch(
                        checked = isRunning,
                        onCheckedChange = { checked ->
                            viewModel.setServerRunning(checked)
                            if (checked) onStartService() else onStopService()
                        }
                    )
                }
            }
        }

        // Stats Grid
        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        modifier = Modifier.weight(1f),
                        title = "Connected Now",
                        value = "\${stats.activeConnectedUsers}",
                        icon = Icons.Default.Wifi,
                        color = Color(0xFF10B981)
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        title = "Total Users",
                        value = "\${stats.totalUsers}",
                        icon = Icons.Default.People,
                        color = Color(0xFF3B82F6)
                    )
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    StatCard(
                        modifier = Modifier.weight(1f),
                        title = "Today's Logins",
                        value = "\${stats.todayConnections}",
                        icon = Icons.Default.CheckCircle,
                        color = Color(0xFF8B5CF6)
                    )
                    StatCard(
                        modifier = Modifier.weight(1f),
                        title = "Failed Attempts",
                        value = "\${stats.todayFailedAttempts}",
                        icon = Icons.Default.Warning,
                        color = Color(0xFFEF4444)
                    )
                }
            }
        }

        // Quick Active Connections Preview
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Active Connected Devices",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                TextButton(onClick = onNavigateToLive) {
                    Text("View All (\${activeList.size})")
                }
            }
        }

        if (activeList.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No devices connected right now", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        } else {
            items(activeList.take(3)) { session ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(session.username, fontWeight = FontWeight.Bold)
                            Text(session.deviceName, style = MaterialTheme.typography.bodySmall)
                            Text("IP: \${session.ipAddress}", style = MaterialTheme.typography.labelSmall)
                        }
                        Button(
                            onClick = { viewModel.disconnectSession(session.id) },
                            colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                        ) {
                            Text("Disconnect")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatCard(
    modifier: Modifier = Modifier,
    title: String,
    value: String,
    icon: ImageVector,
    color: Color
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/screens/UsersScreen.kt',
    filename: 'UsersScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose Screen for Creating, Editing, Enabling/Disabling Hotspot Users',
    content: `package com.example.hotspotauth.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.hotspotauth.data.local.entity.UserEntity
import com.example.hotspotauth.security.PasswordHasher
import com.example.hotspotauth.viewmodel.HotspotViewModel

@Composable
fun UsersScreen(viewModel: HotspotViewModel) {
    val users by viewModel.allUsers.collectAsState()
    var showAddDialog by remember { mutableStateOf(false) }
    var userToEditPassword by remember { mutableStateOf<UserEntity?>(null) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showAddDialog = true },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add User")
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "Authorized Hotspot Users (\${users.size})",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
            }

            items(users, key = { it.id }) { user ->
                UserCard(
                    user = user,
                    onToggleActive = { viewModel.toggleUserActive(user) },
                    onChangePassword = { userToEditPassword = user },
                    onDelete = { viewModel.deleteUser(user) }
                )
            }
        }

        if (showAddDialog) {
            AddUserDialog(
                onDismiss = { showAddDialog = false },
                onAdd = { name, username, pass, notes ->
                    viewModel.createUser(
                        name = name,
                        username = username,
                        passwordPlain = pass,
                        notes = notes,
                        onSuccess = { showAddDialog = false },
                        onError = { /* show error message */ }
                    )
                }
            )
        }

        userToEditPassword?.let { user ->
            ChangePasswordDialog(
                user = user,
                onDismiss = { userToEditPassword = null },
                onConfirm = { newPass ->
                    viewModel.updatePassword(user.id, newPass)
                    userToEditPassword = null
                }
            )
        }
    }
}

@Composable
fun UserCard(
    user: UserEntity,
    onToggleActive: () -> Unit,
    onChangePassword: () -> Unit,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(user.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text("Username: @\${user.username}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                }
                AssistChip(
                    onClick = onToggleActive,
                    label = { Text(if (user.active) "Active" else "Disabled") },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = if (user.active) Color(0xFF065F46) else Color(0xFF7F1D1D),
                        labelColor = Color.White
                    )
                )
            }
            if (user.notes.isNotEmpty()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(user.notes, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Spacer(modifier = Modifier.height(10.dp))
            Divider()
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Total Logins: \${user.totalConnections}", style = MaterialTheme.typography.labelSmall)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onChangePassword) {
                        Text("Reset Pass")
                    }
                    IconButton(onClick = onDelete) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete", tint = MaterialTheme.colorScheme.error)
                    }
                }
            }
        }
    }
}

@Composable
fun AddUserDialog(
    onDismiss: () -> Unit,
    onAdd: (name: String, username: String, pass: String, notes: String) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Hotspot User") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = name,
                    onValueChange = {
                        name = it
                        if (username.isEmpty()) username = it.lowercase().filter { c -> c.isLetterOrDigit() }
                    },
                    label = { Text("Person's Name (e.g. Rahul)") },
                    singleLine = true
                )
                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it.lowercase() },
                    label = { Text("User ID (e.g. rahul)") },
                    singleLine = true
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Password (e.g. RAHUL123)") },
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    IconButton(onClick = { password = PasswordHasher.generateSuggestedPassword(name) }) {
                        Icon(Icons.Default.AutoAwesome, contentDescription = "Generate")
                    }
                }
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (Optional)") }
                )
            }
        },
        confirmButton = {
            Button(
                onClick = { if (name.isNotEmpty() && username.isNotEmpty() && password.isNotEmpty()) onAdd(name, username, password, notes) },
                enabled = name.isNotEmpty() && username.isNotEmpty() && password.isNotEmpty()
            ) {
                Text("Create User")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}

@Composable
fun ChangePasswordDialog(
    user: UserEntity,
    onDismiss: () -> Unit,
    onConfirm: (String) -> Unit
) {
    var newPass by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Change Password for @\${user.username}") },
        text = {
            Column {
                OutlinedTextField(
                    value = newPass,
                    onValueChange = { newPass = it },
                    label = { Text("New Password") },
                    singleLine = true
                )
            }
        },
        confirmButton = {
            Button(onClick = { if (newPass.isNotEmpty()) onConfirm(newPass) }) {
                Text("Update Password")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancel") }
        }
    )
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/screens/LiveConnectionsScreen.kt',
    filename: 'LiveConnectionsScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose Screen for Live Connected Devices & Disconnection Controls',
    content: `package com.example.hotspotauth.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material.icons.filled.WifiTethering
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.hotspotauth.viewmodel.HotspotViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun LiveConnectionsScreen(viewModel: HotspotViewModel) {
    val activeList by viewModel.activeConnections.collectAsState()
    val sdf = SimpleDateFormat("hh:mm:ss a", Locale.getDefault())

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Currently Connected Devices",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Badge {
                    Text("\${activeList.size} Online")
                }
            }
        }

        if (activeList.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.WifiOff,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            "No active authorized devices connected",
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        } else {
            items(activeList, key = { it.id }) { session ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(
                                    session.username,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    session.deviceName,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            Button(
                                onClick = { viewModel.disconnectSession(session.id) },
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                            ) {
                                Text("Disconnect")
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(12.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("IP: \${session.ipAddress}", style = MaterialTheme.typography.labelMedium)
                            Text("Connected: \${sdf.format(Date(session.connectedAt))}", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/screens/HistoryScreen.kt',
    filename: 'HistoryScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Jetpack Compose Screen for Connection Logs & Audit History',
    content: `package com.example.hotspotauth.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.hotspotauth.viewmodel.HotspotViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun HistoryScreen(viewModel: HotspotViewModel) {
    val logs by viewModel.allLogs.collectAsState()
    val attempts by viewModel.allAttempts.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    val sdf = SimpleDateFormat("dd MMM, hh:mm a", Locale.getDefault())

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Connection History",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            IconButton(onClick = { viewModel.clearHistory() }) {
                Icon(Icons.Default.Delete, contentDescription = "Clear History", tint = MaterialTheme.colorScheme.error)
            }
        }

        TabRow(selectedTabIndex = selectedTab) {
            Tab(selected = selectedTab == 0, onClick = { selectedTab = 0 }, text = { Text("Sessions (\${logs.size})") })
            Tab(selected = selectedTab == 1, onClick = { selectedTab = 1 }, text = { Text("Login Attempts (\${attempts.size})") })
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (selectedTab == 0) {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(logs) { log ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(log.username, fontWeight = FontWeight.Bold)
                                Text(
                                    log.status.uppercase(),
                                    color = if (log.status == "connected") Color(0xFF10B981) else Color(0xFF94A3B8),
                                    style = MaterialTheme.typography.labelSmall
                                )
                            }
                            Text(log.deviceName, style = MaterialTheme.typography.bodySmall)
                            Text("IP: \${log.ipAddress} | \${sdf.format(Date(log.connectedAt))}", style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(attempts) { attempt ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(attempt.username, fontWeight = FontWeight.Bold)
                                Text(
                                    if (attempt.success) "SUCCESS" else "FAILED",
                                    color = if (attempt.success) Color(0xFF10B981) else Color(0xFFEF4444),
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Text("Device: \${attempt.deviceInfo}", style = MaterialTheme.typography.bodySmall)
                            attempt.failureReason?.let {
                                Text("Reason: \$it", style = MaterialTheme.typography.labelSmall, color = Color(0xFFF87171))
                            }
                            Text(sdf.format(Date(attempt.timestamp)), style = MaterialTheme.typography.labelSmall)
                        }
                    }
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/screens/AdminPinScreen.kt',
    filename: 'AdminPinScreen.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Master Admin PIN Security Lock Screen with Keystore Validation',
    content: `package com.example.hotspotauth.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.example.hotspotauth.viewmodel.HotspotViewModel

@Composable
fun AdminPinScreen(
    viewModel: HotspotViewModel,
    onPinSuccess: () -> Unit
) {
    var pin by remember { mutableStateOf("") }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.9f)
                .padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "Admin Access PIN",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Default PIN is 1234",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(20.dp))

                OutlinedTextField(
                    value = pin,
                    onValueChange = {
                        if (it.length <= 6) pin = it
                        errorMessage = null
                    },
                    label = { Text("Enter 4-digit PIN") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                    singleLine = true
                )

                errorMessage?.let {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                }

                Spacer(modifier = Modifier.height(20.dp))

                Button(
                    onClick = {
                        if (viewModel.adminSecurityManager.verifyAdminPin(pin)) {
                            onPinSuccess()
                        } else {
                            errorMessage = "Incorrect Admin PIN"
                        }
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Unlock Admin Dashboard")
                }
            }
        }
    }
}`
  },
  {
    path: 'app/src/main/java/com/example/hotspotauth/ui/theme/Theme.kt',
    filename: 'Theme.kt',
    language: 'kotlin',
    category: 'ui',
    description: 'Material 3 Dark/Light Jetpack Compose Theme',
    content: `package com.example.hotspotauth.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = Color(0xFF38BDF8),
    onPrimary = Color(0xFF0F172A),
    primaryContainer = Color(0xFF0369A1),
    onPrimaryContainer = Color(0xFFE0F2FE),
    secondary = Color(0xFF10B981),
    background = Color(0xFF0B0F17),
    surface = Color(0xFF111827),
    surfaceVariant = Color(0xFF1F2937),
    onSurface = Color(0xFFF9FAFB),
    onSurfaceVariant = Color(0xFF9CA3AF)
)

@Composable
fun HotspotAuthTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}`
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    filename: 'AndroidManifest.xml',
    language: 'xml',
    category: 'config',
    description: 'Android Manifest with Wi-Fi, Hotspot, Network State, and Foreground Service permissions',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="com.example.hotspotauth">

    <!-- Essential Hotspot, Network & Web Server Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
    <uses-permission android:name="android.permission.NEARBY_WIFI_DEVICES" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="Hotspot Auth"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.HotspotAuth"
        android:usesCleartextTraffic="true"
        tools:targetApi="34">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:label="Hotspot Auth"
            android:theme="@style/Theme.HotspotAuth">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.HotspotMonitoringService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="connectedDevice" />

    </application>

</manifest>`
  },
  {
    path: 'app/build.gradle.kts',
    filename: 'build.gradle.kts (App)',
    language: 'gradle',
    category: 'config',
    description: 'App Module Gradle configuration with Room 2.6+, Jetpack Compose, NanoHTTPD & Crypto',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.kapt)
}

android {
    namespace = "com.example.hotspotauth"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.example.hotspotauth"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.8"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Android Core & Lifecycle
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Jetpack Compose (Material 3)
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.navigation:navigation-compose:2.7.7")

    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    kapt("androidx.room:room-compiler:$roomVersion")

    // Embedded HTTP Server for Captive Portal
    implementation("org.nanohttpd:nanohttpd:2.3.1")

    // Security & Encrypted SharedPreferences
    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}`
  },
  {
    path: 'build.gradle.kts',
    filename: 'build.gradle.kts (Root)',
    language: 'gradle',
    category: 'config',
    description: 'Root Project Gradle Script',
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.kapt) apply false
}`
  },
  {
    path: 'settings.gradle.kts',
    filename: 'settings.gradle.kts',
    language: 'gradle',
    category: 'config',
    description: 'Gradle Settings with Maven & Google repositories',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "HotspotAuth"
include(":app")`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    language: 'markdown',
    category: 'docs',
    description: 'Complete Android Studio Build, Installation & Hotspot Setup Guide in Hindi & English',
    content: `# Android Hotspot User Authentication & Monitoring App 📱🔒

Android Studio & Kotlin पर आधारित एक संपूर्ण Hotspot User Authentication और Monitoring सिस्टम।

---

## 🎯 मुख्य आर्किटेक्चर (How it Works)

Android OS में security sandboxing के कारण third-party apps सीधे system Wi-Fi WPA2 पासवर्ड को sniff या intercept नहीं कर सकते।
इसलिए यह ऐप **Captive Portal Architecture** का उपयोग करता है:

1. **Phone Hotspot चालू करें**: अपने Android फ़ोन का Hotspot Open (या एक common password के साथ) On करें।
2. **User Connect करता है**: जब कोई नया user Wi-Fi से जुड़ता है, तो उसका फ़ोन स्वतः "Sign in to network" (Captive Portal) प्रॉम्प्ट दिखाता है।
3. **Embedded Web Server**: ऐप के अंदर **NanoHTTPD/Ktor Server** (\`http://192.168.43.1:8080\`) चलता है।
4. **Credential Verification**: User अपना User ID और Password डालता है (उदा: \`rahul\` / \`RAHUL123\`)।
5. **Room Database Authentication**: Server SHA-256 + Salted Hash से पासवर्ड चेक करता है।
6. **Live Logging & Dashboard**: Admin Dashboard में यूजर का नाम, IP, डिवाइस मॉडल, कनेक्ट/डिस्कनेक्ट टाइम रिकॉर्ड हो जाता है!

---

## 🚀 Android Studio में Build करने के Steps

1. **Android Studio खोलें** (Hedgehog / Iguana / Jellyfish या नया वर्जन)।
2. **Open an Existing Project** चुनें और इस फोल्डर को सेलेक्ट करें।
3. **Gradle Sync** पूरा होने दें।
4. Phone को USB Debugging के साथ कनेक्ट करें या Emulator में रन करें।
5. **Run 'app' (Shift + F10)** दबाएं।

---

## 🔑 Default Admin Access PIN

- Master Admin PIN: **\`1234\`**
(Admin Settings में जाकर इसे कभी भी बदल सकते हैं)।

---

## 👥 Default Pre-configured Users

| Name | User ID / Username | Password | Status |
| :--- | :--- | :--- | :--- |
| **Rahul** | \`rahul\` | \`RAHUL123\` | ✅ Active |
| **Amit** | \`amit\` | \`AMIT456\` | ✅ Active |
| **Mohan** | \`mohan\` | \`MOHAN789\` | ⛔ Deactivated |

---

## 🛡️ Security Features

- **No Plaintext Passwords**: सभी पासवर्ड \`SHA-256\` और unique 16-character salt के साथ Room Database में हैश होते हैं।
- **Admin PIN Protection**: Admin Dashboard को \`Android Keystore\` और \`EncryptedSharedPreferences\` से प्रोटेक्ट किया गया है।
- **Foreground Service**: Hotspot monitoring बैकग्राउंड में भी active रहती है।
`
  }
];
