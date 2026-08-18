import type {
  FieldErrors,
  PasswordResetInput,
  SignInInput,
  SignUpInput,
} from "./types"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /[A-Za-zÀ-ỹ]/
const DIGIT_PATTERN = /\d/

const validateEmail = (email: string, errors: FieldErrors) => {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    errors.email = "Vui lòng nhập email."
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = "Vui lòng nhập email hợp lệ."
  }
}

const validatePassword = (password: string, errors: FieldErrors) => {
  if (!password) {
    errors.password = "Vui lòng nhập mật khẩu."
  } else if (
    password.length < 8 ||
    !PASSWORD_PATTERN.test(password) ||
    !DIGIT_PATTERN.test(password)
  ) {
    errors.password =
      "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ cái và chữ số."
  }
}

export function validateSignIn(input: SignInInput): FieldErrors {
  const errors: FieldErrors = {}

  validateEmail(input.email, errors)
  validatePassword(input.password, errors)

  return errors
}

export function validateSignUp(input: SignUpInput): FieldErrors {
  const errors: FieldErrors = {}
  const trimmedName = input.fullName.trim()

  if (!trimmedName) {
    errors.fullName = "Vui lòng nhập họ và tên."
  } else if (trimmedName.length < 2 || trimmedName.length > 80) {
    errors.fullName = "Họ và tên phải có từ 2 đến 80 ký tự."
  }

  validateEmail(input.email, errors)
  validatePassword(input.password, errors)

  if (!input.confirmPassword) {
    errors.confirmPassword = "Vui lòng xác nhận mật khẩu."
  } else if (input.confirmPassword !== input.password) {
    errors.confirmPassword = "Mật khẩu xác nhận không khớp."
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
