import {
  type ChangeEvent,
  type FormEvent,
  type InputHTMLAttributes,
  useEffect,
  useRef,
  useState,
} from "react"
import GoogleIcon from "../components/GoogleIcon"
import { authApi } from "../api/authApi"
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
        className={`${inputClassName} ${error
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

  const googleClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "887222240754-vubu1a9hngje5nh1aibcs0l0sp6mmnc6.apps.googleusercontent.com"

  useEffect(() => {
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script")
      script.id = "google-gsi-script"
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = () => {
        if ((window as any).google?.accounts?.id) {
          (window as any).google.accounts.id.initialize({
            client_id: googleClientId,
            callback: async (response: any) => {
              if (response.credential) {
                setActiveRequest("google")
                setStatus("Đang xác thực tài khoản Google...")
                try {
                  const result = await authApi.loginWithGoogle(response.credential)
                  if (result.ok) {
                    setStatus("Đăng nhập Google thành công!")
                    onAuthenticated(result.user)
                  } else {
                    setStatus(result.message)
                  }
                } finally {
                  setActiveRequest(null)
                }
              }
            },
          })
        }
      }
      document.body.appendChild(script)
    }
  }, [googleClientId, onAuthenticated])

  const currentValidation = () => {
    if (view === "sign-in") return validateSignIn(values)
    if (view === "sign-up") return validateSignUp(values)
    return validatePasswordReset(values)
  }

  const switchView = (nextView: AuthView) => {
    setView(nextView)
    setErrors({})
    setTouched({})
    setStatus("")
    setResetSent(false)
  }

  const handleTextChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as FieldName
    const nextValues = { ...values, [name]: event.target.value }
    setValues(nextValues)

    if (touched[name]) {
      const nextErrors =
        view === "sign-in"
          ? validateSignIn(nextValues)
          : view === "sign-up"
            ? validateSignUp(nextValues)
            : validatePasswordReset(nextValues)
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

  const handleBlur = (name: FieldName) => {
    setTouched((current) => ({ ...current, [name]: true }))
    const nextErrors = currentValidation()
    setErrors((current) => ({
      ...current,
      [name]: nextErrors[name],
    }))
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
        ? "Đang gửi hướng dẫn khôi phục…"
        : view === "sign-up"
          ? "Đang đăng ký tài khoản..."
          : "Đang kiểm tra thông tin đăng nhập…",
    )

    try {
      if (view === "sign-up") {
        const result = await authApi.register({
          email: values.email,
          username: values.fullName,
          password: values.password,
        })
        if (result.ok) {
          setStatus("Đăng ký tài khoản thành công!")
          onAuthenticated(result.user)
        } else {
          setStatus(result.message)
          if (result.field) {
            setErrors((prev) => ({
              ...prev,
              [result.field!]: result.message,
            }))
            fieldRefs.current[result.field!]?.focus()
          }
        }
        return
      }

      if (view === "recovery") {
        setResetSent(true)
        setStatus("Nếu email tồn tại, hướng dẫn khôi phục mật khẩu đã được gửi.")
        return
      }

      const result = await authApi.login({
        email: values.email,
        password: values.password,
      })
      if (result.ok) {
        setStatus("Đăng nhập thành công!")
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
    setStatus("Đang kết nối đến Google...")

    try {
      if ((window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            console.log("Google One Tap prompt skipped or not displayed")
          }
        })
      } else {
        setStatus("Dịch vụ Google Sign-In đang tải, vui lòng bấm lại sau 2 giây.")
      }
    } catch (err: any) {
      console.error(err)
      setStatus("Không thể mở cửa sổ đăng nhập Google.")
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
          <p className="editorial-kicker mb-6">Nền tảng tuyển dụng & phát triển sự nghiệp</p>
          <h1
            className="editorial-title max-w-[14ch]"
            id="auth-narrative-title"
          >
            Kết nối tài năng với cơ hội việc làm lý tưởng.
          </h1>
          <p className="mt-8 max-w-xl text-base leading-7 text-muted-ink xl:text-lg xl:leading-8">
            Tìm kiếm công việc mơ ước, tối ưu hóa hồ sơ năng lực và kết nối trực tiếp
            với các doanh nghiệp hàng đầu cùng JobMatch Studio.
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
                    ? "Đăng nhập để tiếp tục xây dựng hành trình nghề nghiệp của bạn."
                    : view === "sign-up"
                      ? "Tạo tài khoản để khám phá hàng ngàn cơ hội việc làm hấp dẫn."
                      : "Nhập email để nhận hướng dẫn đặt lại mật khẩu cho tài khoản của bạn."}
                </p>
              </header>

              {status && !isFormLoading && !isGoogleLoading ? (
                <div
                  role="alert"
                  className={`mb-5 flex items-start gap-3 rounded-[3px] border p-3.5 text-sm transition-all duration-200 ${status.includes("thành công")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-red-200 bg-red-50 text-red-800"
                    }`}
                >
                  <svg
                    className={`mt-0.5 size-5 shrink-0 ${status.includes("thành công") ? "text-emerald-600" : "text-red-600"
                      }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {status.includes("thành công") ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    )}
                  </svg>
                  <div className="flex-1 font-medium leading-5">{status}</div>
                </div>
              ) : null}

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
                    placeholder={view === "sign-up" ? "Từ 6 đến 12 ký tự" : "Nhập mật khẩu"}
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
                          Tôi đồng ý với các điều khoản sử dụng và chính sách bảo mật
                          của JobMatch.
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
                    {isGoogleLoading ? "Đang kết nối Google…" : "Tiếp tục với Google"}
                  </button>
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
