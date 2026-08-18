import type {
  AuthResult,
  FieldErrors,
  PasswordResetInput,
  SignInInput,
  SignUpInput,
} from "./types"
import {
  validatePasswordReset,
  validateSignIn,
  validateSignUp,
} from "./validation"

const MOCK_LATENCY_MS = 450

const wait = () =>
  new Promise<void>((resolve) => {
    globalThis.setTimeout(resolve, MOCK_LATENCY_MS)
  })

const hasErrors = (errors: FieldErrors) =>
  Object.keys(errors).length > 0

const invalidInput: AuthResult = {
  ok: false,
  message: "Vui lòng kiểm tra lại thông tin đã nhập.",
}

export async function signIn(input: SignInInput): Promise<AuthResult> {
  await wait()

  if (hasErrors(validateSignIn(input))) {
    return invalidInput
  }

  return {
    ok: true,
    user: {
      id: "mock-user",
      name: "Người dùng thử nghiệm",
      email: input.email.trim(),
    },
  }
}

export async function signUp(input: SignUpInput): Promise<AuthResult> {
  await wait()

  if (hasErrors(validateSignUp(input))) {
    return invalidInput
  }

  return {
    ok: true,
    user: {
      id: "mock-user",
      name: input.fullName.trim(),
      email: input.email.trim(),
    },
  }
}

export async function signInWithGoogle(): Promise<AuthResult> {
  await wait()

  return {
    ok: true,
    user: {
      id: "mock-google-user",
      name: "Google Prototype User",
      email: "google-prototype@example.com",
    },
  }
}

export async function requestPasswordReset(
  input: PasswordResetInput,
): Promise<AuthResult> {
  await wait()

  if (hasErrors(validatePasswordReset(input))) {
    return invalidInput
  }

  return {
    ok: true,
    user: {
      id: "mock-reset-user",
      name: "",
      email: input.email.trim(),
    },
  }
}

export async function signOut(): Promise<void> {
  await wait()
}
