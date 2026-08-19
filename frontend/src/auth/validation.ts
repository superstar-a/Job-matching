import type {
  FieldErrors,
  PasswordResetInput,
  SignInInput,
  SignUpInput,
} from "./types"

/**
 * Validation rules strictly aligned with Backend DTOs:
 * - LoginDto: email (IsEmail, IsNotEmpty), password (IsString, IsNotEmpty)
 * - RegisterDto: email (IsEmail, IsNotEmpty), username (IsString, IsNotEmpty), password (IsString, IsNotEmpty, 6-12 characters)
 */

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

const validateEmail = (email: string, errors: FieldErrors) => {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = "Vui lòng nhập địa chỉ email."
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Định dạng email không hợp lệ (ví dụ: user@example.com)."
  }
}

const validateSignInPassword = (password: string, errors: FieldErrors) => {
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu."
  }
}

const validateSignUpPassword = (password: string, errors: FieldErrors) => {
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu."
  } else if (password.length < 6 || password.length > 12) {
    errors.password = "Mật khẩu phải có độ dài từ 6 đến 12 ký tự (theo chuẩn hệ thống)."
  }
}

export function validateSignIn(input: SignInInput): FieldErrors {
  const errors: FieldErrors = {}

  validateEmail(input.email, errors)
  validateSignInPassword(input.password, errors)

  return errors
}

export function validateSignUp(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {}
  const trimmedName = input.fullName.trim()

  if (!trimmedName) {
    errors.fullName = "Vui lòng nhập tên người dùng / họ tên."
  } else if (trimmedName.length < 2 || trimmedName.length > 50) {
    errors.fullName = "Tên người dùng phải có từ 2 đến 50 ký tự."
  }

  validateEmail(input.email, errors)
  validateSignUpPassword(input.password, errors)

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận lại mật khẩu."
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không trùng khớp."
  }

  if (!input.termsAccepted) {
    errors.termsAccepted = "Vui lòng đồng ý với điều khoản sử dụng."
  }

  return errors
}

export function validatePasswordReset(input: PasswordResetInput): FieldErrors {
  const errors: FieldErrors = {}

  validateEmail(input.email, errors)

  return errors
}
