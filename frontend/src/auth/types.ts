export type AuthUser = {
  id: string
  name: string
  email: string
  username?: string
  role?: "Admin" | "User"
  accessToken?: string
  refreshToken?: string
}

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string }

export type FieldErrors = Partial<
  Record<
    "fullName" | "email" | "password" | "confirmPassword" | "termsAccepted",
    string
  >
>

export type SignInInput = {
  email: string
  password: string
}

export type SignUpInput = SignInInput & {
  fullName: string
  confirmPassword: string
  termsAccepted: boolean
}

export type PasswordResetInput = {
  email: string
}
