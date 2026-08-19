/**
 * Authentication API Client for JobMatch Platform
 * Uses JWT AccessToken decoding to manage authentication state and user session.
 */

export interface JwtPayload {
  sub: string // UserID (UUID)
  email: string
  username: string
  sessionID?: string // Session ID generated on login
  iat?: number
  exp?: number
}

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  username: string
  sessionID?: string
  role: "Admin" | "User"
  accessToken: string
  refreshToken?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
}

export interface GoogleLoginPayload {
  idToken: string
}

const ACCESS_TOKEN_KEY = "jobmatch_access_token"
const REFRESH_TOKEN_KEY = "jobmatch_refresh_token"
const BASE_URL = "" // Uses Vite proxy (/auth, /roles, /users, /permission)

/**
 * Decode JWT Base64 payload in browser without external libraries
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    if (!token || typeof token !== "string") return null
    const parts = token.split(".")
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    )
    return JSON.parse(jsonPayload) as JwtPayload
  } catch (err) {
    console.error("Failed to decode JWT token:", err)
    return null
  }
}

/**
 * Determine if user has Admin role based on email or token
 */
async function resolveUserRole(accessToken: string, email: string): Promise<"Admin" | "User"> {
  if (email.toLowerCase().includes("admin")) {
    return "Admin"
  }

  try {
    const res = await fetch(`${BASE_URL}/roles`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    })

    if (res.status === 403) {
      return "User"
    }

    if (res.status === 400 || res.status === 201) {
      return "Admin"
    }
  } catch (err) {
    console.warn("Could not probe /roles endpoint:", err)
  }

  return "User"
}

export const authApi = {
  /**
   * Decode access token stored in localStorage and extract authenticated user info
   */
  getUserFromToken(): AuthenticatedUser | null {
    try {
      const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
      if (!accessToken) return null

      const payload = decodeJwt(accessToken)
      if (!payload) {
        this.clearTokens()
        return null
      }

      // Check token expiration if exp exists
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        console.warn("Access token has expired.")
        this.clearTokens()
        return null
      }

      const role: "Admin" | "User" =
        payload.email?.toLowerCase().includes("admin") ||
        payload.username?.toLowerCase().includes("admin")
          ? "Admin"
          : "User"

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || undefined

      return {
        id: payload.sub,
        name: payload.username || payload.email.split("@")[0],
        email: payload.email,
        username: payload.username,
        sessionID: payload.sessionID,
        role,
        accessToken,
        refreshToken,
      }
    } catch (err) {
      console.error("Error extracting user from token:", err)
      return null
    }
  },

  /**
   * Alias for getUserFromToken
   */
  getCurrentUser(): AuthenticatedUser | null {
    return this.getUserFromToken()
  },

  /**
   * Get raw access token string for API requests
   */
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  },

  /**
   * Clear all stored authentication tokens
   */
  clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem("jobmatch_auth_session") // Clean up legacy key
  },

  /**
   * Log in with Email and Password
   */
  async login(
    payload: LoginPayload,
  ): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email.trim(),
          password: payload.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        let msg = data.message || "Đăng nhập thất bại. Vui lòng thử lại."
        if (Array.isArray(msg)) msg = msg.join(", ")
        if (response.status === 401 || response.status === 404) {
          msg = "Email hoặc mật khẩu không chính xác."
        }
        return { ok: false, message: msg }
      }

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      }
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      }

      // Decode token to build authenticated user
      const decodedPayload = decodeJwt(data.accessToken)
      const role = await resolveUserRole(data.accessToken, decodedPayload?.email || data.user?.email)

      const authenticatedUser: AuthenticatedUser = {
        id: decodedPayload?.sub || data.user?.userID,
        name: decodedPayload?.username || data.user?.username || payload.email.split("@")[0],
        email: decodedPayload?.email || data.user?.email || payload.email,
        username: decodedPayload?.username || data.user?.username,
        sessionID: decodedPayload?.sessionID,
        role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      return { ok: true, user: authenticatedUser }
    } catch (error: any) {
      console.error("Login API error:", error)
      return {
        ok: false,
        message: "Không thể kết nối đến máy chủ Backend (Port 4000). Vui lòng kiểm tra lại dịch vụ.",
      }
    }
  },

  /**
   * Register a new user
   */
  async register(
    payload: RegisterPayload,
  ): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string; field?: "fullName" | "email" }> {
    try {
      // Backend RegisterDto username must not contain spaces
      const formattedUsername =
        payload.username.trim().replace(/\s+/g, "_") || payload.email.split("@")[0]

      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email.trim(),
          username: formattedUsername,
          password: payload.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const rawMsg = data.message || "Đăng ký thất bại. Vui lòng thử lại."
        let msg = Array.isArray(rawMsg) ? rawMsg.join(", ") : rawMsg
        let field: "fullName" | "email" | undefined = undefined

        const lowerMsg = msg.toLowerCase()
        if (lowerMsg.includes("username") && lowerMsg.includes("already exists")) {
          msg = `Tên người dùng "${payload.username}" đã tồn tại. Vui lòng chọn một tên khác.`
          field = "fullName"
        } else if (lowerMsg.includes("email") && lowerMsg.includes("already exists")) {
          msg = `Địa chỉ email "${payload.email}" đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.`
          field = "email"
        } else if (lowerMsg.includes("password must be shorter") || lowerMsg.includes("maxlength")) {
          msg = "Mật khẩu không được dài quá 12 ký tự."
        } else if (lowerMsg.includes("password must not be less") || lowerMsg.includes("minlength")) {
          msg = "Mật khẩu phải có tối thiểu 6 ký tự."
        }

        return { ok: false, message: msg, field }
      }

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      }
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      }

      // Decode token to build authenticated user
      const decodedPayload = decodeJwt(data.accessToken)

      const authenticatedUser: AuthenticatedUser = {
        id: decodedPayload?.sub || data.user?.userID,
        name: decodedPayload?.username || data.user?.username || payload.username,
        email: decodedPayload?.email || data.user?.email || payload.email,
        username: decodedPayload?.username || data.user?.username,
        sessionID: decodedPayload?.sessionID,
        role: "User", // New registrations are User role
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      return { ok: true, user: authenticatedUser }
    } catch (error: any) {
      console.error("Register API error:", error)
      return {
        ok: false,
        message: "Không thể kết nối đến máy chủ Backend (Port 4000). Vui lòng kiểm tra lại dịch vụ.",
      }
    }
  },

  /**
   * Google OAuth2 Login
   */
  async loginWithGoogle(
    idToken: string,
  ): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string }> {
    try {
      const response = await fetch(`${BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      })

      const data = await response.json()

      if (!response.ok) {
        let msg = data.message || "Đăng nhập Google thất bại."
        if (Array.isArray(msg)) msg = msg.join(", ")
        return { ok: false, message: msg }
      }

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      }
      if (data.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      }

      // Decode token to build authenticated user
      const decodedPayload = decodeJwt(data.accessToken)

      const authenticatedUser: AuthenticatedUser = {
        id: decodedPayload?.sub || data.user?.userID,
        name: decodedPayload?.username || data.user?.username || data.user?.email.split("@")[0],
        email: decodedPayload?.email || data.user?.email,
        username: decodedPayload?.username || data.user?.username,
        sessionID: decodedPayload?.sessionID,
        role: "User",
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      return { ok: true, user: authenticatedUser }
    } catch (error: any) {
      console.error("Google Login API error:", error)
      return {
        ok: false,
        message: "Không thể kết nối đến máy chủ Backend khi đăng nhập Google.",
      }
    }
  },

  /**
   * Sign out and clear stored session (Calls Backend POST /auth/logout)
   */
  async logout(): Promise<void> {
    try {
      const accessToken = this.getAccessToken()
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      }
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`
      }

      await fetch(`${BASE_URL}/auth/logout`, {
        method: "POST",
        headers,
        credentials: "include", // Send and clear httpOnly cookies
      })
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      this.clearTokens()
    }
  },
}
