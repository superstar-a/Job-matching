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
 * Determine if the authenticated token belongs to an Admin or User
 * Probes POST /roles which is guarded exclusively by @Roles('Admin')
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

    // If 403 Forbidden -> User does NOT have Admin role
    if (res.status === 403) {
      return "User"
    }

    // If 400 or 201 -> Role check passed (Admin)
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
  async register(payload: RegisterPayload): Promise<{ ok: true; user: AuthenticatedUser } | { ok: false; message: string; field?: "fullName" | "email" }> {
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

      const authenticatedUser: AuthenticatedUser = {
        id: data.user.userID,
        name: data.user.username || data.user.email.split("@")[0],
        email: data.user.email,
        username: data.user.username,
        role: "User", // Đăng nhập Google luôn mặc định là role User
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
