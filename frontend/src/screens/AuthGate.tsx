import {
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  useRef,
  useState,
} from "react"
import GoogleIcon from "../components/GoogleIcon"
import {
  requestPasswordReset,
  signIn,
  signInWithGoogle,
  signUp,
} from "../auth/mockAuth"
import type { AuthUser, FieldErrors } from "../auth/types"
import {
  validatePasswordReset,
  validateSignIn,
  validateSignUp,
} from "../auth/validation"

type AuthView = "sign-in" | "sign-up" | "recovery"
type FieldName = keyof FieldErrors
type ActiveRequest = "form" | "google" | null

type AuthGateProps = {
  onAuthenticated: (user: AuthUser) => void
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string
  inputRef: (element: HTMLInputElement | null) => void
  label: string
  name: FieldName
}

const inputClassName =
  "focus-ring min-h-11 w-full rounded-[3px] border bg-paper px-3.5 py-2.5 text-base text-ink transition-colors duration-200 placeholder:text-muted-ink/70 disabled:cursor-not-allowed disabled:opacity-50"

function Field({ error, inputRef, label, name, ...inputProps }: FieldProps) {
  const errorId = `${name}-error`

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-ink" htmlFor={name}>
        {label}
      </label>
      <input
        {...inputProps}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        className={`${inputClassName} ${
          error
            ? "border-red-500"
            : "border-rule hover:border-muted-ink/70"
        }`}
        id={name}
        name={name}
        ref={inputRef}
      />
      {error ? (
        <p className="text-sm leading-5 text-red-700" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

const initialValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  termsAccepted: false,
}

const fieldsForView: Record<AuthView, FieldName[]> = {
  "sign-in": ["email", "password"],
  "sign-up": [
    "fullName",
    "email",
    "password",
    "confirmPassword",
    "termsAccepted",
  ],
  recovery: ["email"],
}

export default function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [view, setView] = useState<AuthView>("sign-in")
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState<Partial<Record<FieldName, boolean>>>({})
  const [activeRequest, setActiveRequest] = useState<ActiveRequest>(null)
  const [status, setStatus] = useState("")
  const [resetSent, setResetSent] = useState(false)
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement | null>>>({})

  const currentValidation = () => {
    if (view === "sign-up") return validateSignUp(values)
    if (view === "recovery") return validatePasswordReset(values)
    return validateSignIn(values)
  }

  const switchView = (nextView: AuthView) => {
    setView(nextView)
    setErrors({})
    setTouched({})
    setStatus("")
    setResetSent(false)
  }

  const validateTouchedField = (name: FieldName) => {
    const nextErrors = currentValidation()
    setErrors((current) => ({ ...current, [name]: nextErrors[name] }))
  }

  const handleBlur = (name: FieldName) => {
    setTouched((current) => ({ ...current, [name]: true }))
    validateTouchedField(name)
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName
    const nextValues = { ...values, [name]: event.target.value }
    setValues(nextValues)

    if (touched[name]) {
      const nextErrors =
        view === "sign-up"
          ? validateSignUp(nextValues)
          : view === "recovery"
            ? validatePasswordReset(nextValues)
            : validateSignIn(nextValues)
      setErrors((current) => ({ ...current, [name]: nextErrors[name] }))
    }

    if (name === "password" && touched.confirmPassword && view === "sign-up") {
      const nextErrors = validateSignUp(nextValues)
      setErrors((current) => ({
        ...current,
        confirmPassword: nextErrors.confirmPassword,
      }))
    }
  }

  const handleTermsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = { ...values, termsAccepted: event.target.checked }
    setValues(nextValues)

    if (touched.termsAccepted) {
      const nextErrors = validateSignUp(nextValues)
      setErrors((current) => ({
        ...current,
        termsAccepted: nextErrors.termsAccepted,
      }))
    }
  }

  const focusFirstInvalidField = (nextErrors: FieldErrors) => {
    const firstInvalid = fieldsForView[view].find((field) => nextErrors[field])
    if (firstInvalid) {
      globalThis.setTimeout(() => fieldRefs.current[firstInvalid]?.focus(), 0)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = currentValidation()
    const visibleFields = fieldsForView[view]
    setTouched(
      Object.fromEntries(visibleFields.map((field) => [field, true])) as Partial<
        Record<FieldName, boolean>
      >,
    )
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setStatus("Vui lòng kiểm tra các trường được đánh dấu.")
      focusFirstInvalidField(nextErrors)
      return
    }

    setActiveRequest("form")
    setStatus(
      view === "recovery"
        ? "Đang mô phỏng gửi hướng dẫn khôi phục…"
        : "Đang xác thực bằng dịch vụ mô phỏng…",
    )

    try {
      if (view === "sign-up") {
        const result = await signUp(values)
        if (result.ok) {
          setStatus("Tạo tài khoản mô phỏng thành công.")
          onAuthenticated(result.user)
        } else {
          setStatus(result.message)
        }
        return
      }

      if (view === "recovery") {
        const result = await requestPasswordReset({ email: values.email })
        if (result.ok) {
          setResetSent(true)
          setStatus("Đã mô phỏng gửi hướng dẫn khôi phục vào email của bạn.")
        } else {
          setStatus(result.message)
        }
        return
      }

      const result = await signIn({
        email: values.email,
        password: values.password,
      })
      if (result.ok) {
        setStatus("Đăng nhập mô phỏng thành công.")
        onAuthenticated(result.user)
      } else {
        setStatus(result.message)
      }
    } finally {
      setActiveRequest(null)
    }
  }

  const handleGoogleSignIn = async () => {
    setActiveRequest("google")
    setStatus("Đang mở bản mô phỏng đăng nhập Google…")

    try {
      const result = await signInWithGoogle()
      if (result.ok) {
        setStatus("Đăng nhập Google mô phỏng thành công.")
        onAuthenticated(result.user)
      } else {
        setStatus(result.message)
      }
    } finally {
      setActiveRequest(null)
    }
  }

  const isFormLoading = activeRequest === "form"
  const isGoogleLoading = activeRequest === "google"

  return (
    <main className="grid min-h-dvh bg-porcelain lg:grid-cols-[minmax(0,1.05fr)_minmax(30rem,0.95fr)]">
      <section
        aria-labelledby="auth-narrative-title"
        className="relative hidden min-h-dvh overflow-hidden border-r border-rule px-10 py-10 lg:flex lg:flex-col xl:px-16 xl:py-14"
      >
        <div className="flex items-center justify-between gap-6">
          <p className="editorial-kicker">LJOBS · Career Studio</p>
          <span className="text-xs font-semibold tracking-[0.12em] text-muted-ink uppercase">
            Editorial workspace
          </span>
        </div>

        <div className="my-auto max-w-2xl py-16">
          <p className="editorial-kicker mb-6">Định hướng nghề nghiệp, rõ ràng hơn</p>
          <h1
            className="editorial-title max-w-[12ch]"
            id="auth-narrative-title"
          >
            Biến tín hiệu nghề nghiệp thành bước tiến có chủ đích.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-muted-ink xl:text-lg xl:leading-8">
            Tập trung hồ sơ, cơ hội và quyết định tiếp theo trong một không gian
            làm việc biên tập dành riêng cho hành trình của bạn.
          </p>
        </div>

        <div className="max-w-xl border-t border-rule pt-6">
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <p className="editorial-kicker">Career Signal</p>
              <p className="mt-2 text-sm font-semibold text-ink">
                Hồ sơ sẵn sàng cho cơ hội phù hợp
              </p>
            </div>
            <span className="font-editorial text-3xl text-cobalt">78%</span>
          </div>
          <div className="career-signal">
            <span>Khởi điểm</span>
            <span className="career-signal__bar">
              <span
                className="career-signal__fill"
                style={{ "--signal": 0.78 } as React.CSSProperties}
              />
            </span>
            <span>Sẵn sàng</span>
          </div>
        </div>
      </section>

      <section className="flex min-h-dvh items-center justify-center bg-paper px-5 py-10 sm:px-8 lg:px-12 xl:px-20">
        <div className="w-full max-w-[28rem]">
          <div className="mb-9 lg:hidden">
            <p className="editorial-kicker">LJOBS · Career Studio</p>
          </div>

          {resetSent ? (
            <div aria-labelledby="reset-success-title">
              <p className="editorial-kicker mb-4">Khôi phục tài khoản</p>
              <h2
                className="font-editorial text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-ink"
                id="reset-success-title"
              >
                Hãy kiểm tra hộp thư của bạn
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-ink">
                Chúng tôi đã mô phỏng gửi hướng dẫn khôi phục tới{" "}
                <strong className="font-semibold text-ink">{values.email.trim()}</strong>.
                Không có email thật nào được gửi trong bản giao diện này.
              </p>
              <button
                className="focus-ring mt-8 min-h-11 w-full cursor-pointer rounded-[3px] bg-cobalt px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-cobalt/90 active:bg-cobalt/80"
                onClick={() => switchView("sign-in")}
                type="button"
              >
                Trở về đăng nhập
              </button>
            </div>
          ) : (
            <>
              <header className="mb-8">
                <p className="editorial-kicker mb-4">
                  {view === "sign-in"
                    ? "Không gian nghề nghiệp của bạn"
                    : view === "sign-up"
                      ? "Bắt đầu hành trình"
                      : "Khôi phục tài khoản"}
                </p>
                <h2 className="font-editorial text-[2.25rem] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[2.625rem]">
                  {view === "sign-in"
                    ? "Chào mừng bạn trở lại"
                    : view === "sign-up"
                      ? "Tạo tài khoản nghề nghiệp"
                      : "Khôi phục quyền truy cập"}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-ink">
                  {view === "sign-in"
                    ? "Đăng nhập để tiếp tục xây dựng hành trình nghề nghiệp có chủ đích."
                    : view === "sign-up"
                      ? "Tạo hồ sơ mô phỏng để khám phá không gian làm việc của LJOBS."
                      : "Nhập email và chúng tôi sẽ mô phỏng gửi hướng dẫn đặt lại mật khẩu."}
                </p>
              </header>

              <form className="space-y-5" noValidate onSubmit={handleSubmit}>
                {view === "sign-up" ? (
                  <Field
                    autoComplete="name"
                    error={errors.fullName}
                    inputRef={(element) => {
                      fieldRefs.current.fullName = element
                    }}
                    label="Họ và tên"
                    name="fullName"
                    onBlur={() => handleBlur("fullName")}
                    onChange={handleTextChange}
                    placeholder="Nguyễn Minh Anh"
                    type="text"
                    value={values.fullName}
                  />
                ) : null}

                <Field
                  autoComplete="email"
                  error={errors.email}
                  inputMode="email"
                  inputRef={(element) => {
                    fieldRefs.current.email = element
                  }}
                  label="Email"
                  name="email"
                  onBlur={() => handleBlur("email")}
                  onChange={handleTextChange}
                  placeholder="ban@example.com"
                  type="email"
                  value={values.email}
                />

                {view !== "recovery" ? (
                  <Field
                    autoComplete={
                      view === "sign-up" ? "new-password" : "current-password"
                    }
                    error={errors.password}
                    inputRef={(element) => {
                      fieldRefs.current.password = element
                    }}
                    label="Mật khẩu"
                    name="password"
                    onBlur={() => handleBlur("password")}
                    onChange={handleTextChange}
                    placeholder="Ít nhất 8 ký tự"
                    type="password"
                    value={values.password}
                  />
                ) : null}

                {view === "sign-up" ? (
                  <>
                    <Field
                      autoComplete="new-password"
                      error={errors.confirmPassword}
                      inputRef={(element) => {
                        fieldRefs.current.confirmPassword = element
                      }}
                      label="Xác nhận mật khẩu"
                      name="confirmPassword"
                      onBlur={() => handleBlur("confirmPassword")}
                      onChange={handleTextChange}
                      placeholder="Nhập lại mật khẩu"
                      type="password"
                      value={values.confirmPassword}
                    />
                    <div>
                      <label className="flex min-h-11 cursor-pointer items-start gap-3 py-1 text-sm leading-6 text-ink">
                        <input
                          aria-describedby={
                            errors.termsAccepted ? "termsAccepted-error" : undefined
                          }
                          aria-invalid={Boolean(errors.termsAccepted)}
                          checked={values.termsAccepted}
                          className="focus-ring mt-1 size-4 shrink-0 cursor-pointer accent-cobalt"
                          name="termsAccepted"
                          onBlur={() => handleBlur("termsAccepted")}
                          onChange={handleTermsChange}
                          ref={(element) => {
                            fieldRefs.current.termsAccepted = element
                          }}
                          type="checkbox"
                        />
                        <span>
                          Tôi đồng ý với điều khoản sử dụng và xác nhận đây là trải
                          nghiệm giao diện mô phỏng.
                        </span>
                      </label>
                      {errors.termsAccepted ? (
                        <p
                          className="mt-1 text-sm leading-5 text-red-700"
                          id="termsAccepted-error"
                          role="alert"
                        >
                          {errors.termsAccepted}
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}

                {view === "sign-in" ? (
                  <div className="flex justify-end">
                    <button
                      className="focus-ring min-h-11 cursor-pointer px-1 text-sm font-semibold text-cobalt underline-offset-4 hover:underline"
                      onClick={() => switchView("recovery")}
                      type="button"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                ) : null}

                <button
                  className="focus-ring min-h-11 w-full cursor-pointer rounded-[3px] bg-cobalt px-5 py-3 text-sm font-bold text-white transition-colors duration-200 hover:bg-cobalt/90 active:bg-cobalt/80 disabled:cursor-wait disabled:opacity-50"
                  disabled={isFormLoading}
                  type="submit"
                >
                  {isFormLoading
                    ? "Đang xử lý…"
                    : view === "sign-in"
                      ? "Đăng nhập"
                      : view === "sign-up"
                        ? "Tạo tài khoản"
                        : "Gửi hướng dẫn khôi phục"}
                </button>
              </form>

              {view === "sign-in" ? (
                <div className="mt-7">
                  <div className="flex items-center gap-4" role="separator">
                    <span className="h-px flex-1 bg-rule" />
                    <span className="text-xs font-semibold tracking-[0.12em] text-muted-ink uppercase">
                      Hoặc
                    </span>
                    <span className="h-px flex-1 bg-rule" />
                  </div>
                  <button
                    className="focus-ring mt-6 flex min-h-11 w-full cursor-pointer items-center justify-center gap-3 rounded-[3px] border border-rule bg-paper px-5 py-3 text-sm font-bold text-ink transition-colors duration-200 hover:border-muted-ink hover:bg-porcelain active:bg-sage/40 disabled:cursor-wait disabled:opacity-50"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleSignIn}
                    type="button"
                  >
                    <GoogleIcon className="size-5 shrink-0" />
                    {isGoogleLoading ? "Đang kết nối mô phỏng…" : "Tiếp tục với Google"}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-muted-ink">
                    Bản mô phỏng giao diện — chưa kết nối Google OAuth.
                  </p>
                </div>
              ) : null}

              <div className="mt-7 border-t border-rule pt-5 text-center text-sm text-muted-ink">
                {view === "sign-in" ? (
                  <p>
                    Chưa có tài khoản?{" "}
                    <button
                      className="focus-ring min-h-11 cursor-pointer px-1 font-semibold text-cobalt underline-offset-4 hover:underline"
                      onClick={() => switchView("sign-up")}
                      type="button"
                    >
                      Tạo tài khoản
                    </button>
                  </p>
                ) : (
                  <button
                    className="focus-ring min-h-11 cursor-pointer px-1 font-semibold text-cobalt underline-offset-4 hover:underline"
                    onClick={() => switchView("sign-in")}
                    type="button"
                  >
                    Trở về đăng nhập
                  </button>
                )}
              </div>
            </>
          )}

          <p aria-atomic="true" aria-live="polite" className="sr-only">
            {status}
          </p>
        </div>
      </section>
    </main>
  )
}
