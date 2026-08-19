/**
 * Authentication API Client for JobMatch Platform
 * Connects directly to NestJS Backend (/auth/login, /auth/register, /auth/google)
 */

export interface BackendUser {
  userID: string
  email: string
  username: string
  accountStatus: string
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  user: BackendUser
  accessToken: string
  refreshToken: string
}

export interface AuthenticatedUser {
  id: string
  name: string
  email: string
  username: string
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

const STORAGE_KEY = "jobmatch_auth_session"
const BASE_URL = "" // Uses Vite proxy (/auth, /roles, /users, /permission)

/**
 * Determine if the authenticated token belongs to an Admin or User by probing GET /roles
 */
async function resolveUserRole(accessToken: string, email: string): Promise<"Admin" | "User"> {
  try {
    const res = await fetch(`${BASE_URL}/roles`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (res.status === 200) {
      return "Admin"
    }

    if (res.status === 403) {
      return "User"
    }
  } catch (err) {
    console.warn("Could not probe /roles endpoint:", err)
  }

  // Fallback heuristic based on email
  if (email.toLowerCase().includes("admin")) {
    return "Admin"
  }

  return "User"
}

export const authApi = {
  /**
   * Log in with Email and Password
   */
  async login(payload: LoginPayload): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string }> {
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

      const role = await resolveUserRole(data.accessToken, data.user.email)

      const authenticatedUser: AuthenticatedUser = {
        id: data.user.userID,
        name: data.user.username || data.user.email.split("@")[0],
        email: data.user.email,
        username: data.user.username,
        role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      // Persist session
      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser))

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
  async register(payload: RegisterPayload): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string }> {
    try {
      // Backend RegisterDto username must not contain spaces
      const formattedUsername = payload.username.trim().replace(/\s+/g, "_") || payload.email.split("@")[0]

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
        let msg = data.message || "Đăng ký thất bại. Vui lòng thử lại."
        if (Array.isArray(msg)) msg = msg.join(", ")
        if (msg.includes("already exists")) {
          msg = "Tài khoản hoặc email này đã tồn tại trong hệ thống."
        }
        return { ok: false, message: msg }
      }

      const authenticatedUser: AuthenticatedUser = {
        id: data.user.userID,
        name: data.user.username || payload.username,
        email: data.user.email,
        username: data.user.username,
        role: "User", // New registrations are User role
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser))

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
  async loginWithGoogle(idToken: string): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string }> {
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

      const role = await resolveUserRole(data.accessToken, data.user.email)

      const authenticatedUser: AuthenticatedUser = {
        id: data.user.userID,
        name: data.user.username || data.user.email.split("@")[0],
        email: data.user.email,
        username: data.user.username,
        role,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(authenticatedUser))

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
   * Get current stored session
   */
  getCurrentUser(): AuthenticatedUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      return JSON.parse(raw) as AuthenticatedUser
    } catch {
      return null
    }
  },

  /**
   * Sign out and clear stored session
   */
  logout(): void {
    localStorage.removeItem(STORAGE_KEY)
  },
}
