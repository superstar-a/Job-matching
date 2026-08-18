import { useCallback, useRef, useState } from "react"

import type { Screen } from "../types"

interface CVUploadProps {
  onNavigate: (screen: Screen) => void
  setCvUploaded: (uploaded: boolean) => void
}

type Stage = "idle" | "uploading" | "processing" | "confirm"

const PARSED_PROFILE = {
  name: "Nguyễn Minh Tuấn",
  role: "Senior Frontend Developer",
  experience: "5 năm",
  location: "TP. Hồ Chí Minh",
  email: "tuannm@gmail.com",
  phone: "0912 345 678",
  skills: [
    "React",
    "TypeScript",
    "Node.js",
    "GraphQL",
    "AWS",
    "Figma",
    "Redux",
    "REST API",
  ],
  education: "Đại học Bách Khoa TP.HCM — Công nghệ thông tin",
  companies: [
    "VNG Corporation (2022–nay)",
    "Axon Active (2020–2022)",
    "Nashtech (2019–2020)",
  ],
  inferred: ["Tiếng Anh B2", "Agile/Scrum"],
}

export default function CVUpload({ onNavigate, setCvUploaded }: CVUploadProps) {
  const [stage, setStage] = useState<Stage>("idle")
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)

  const startUpload = useCallback((name: string) => {
    setFileName(name)
    setStage("uploading")
    let p = 0

    const interval = setInterval(() => {
      p += Math.random() * 18 + 5

      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setProgress(100)
        setTimeout(() => {
          setStage("processing")
          setTimeout(() => setStage("confirm"), 2200)
        }, 300)
      }

      setProgress(Math.min(p, 100))
    }, 120)
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDragging(false)
      const file = event.dataTransfer.files[0]
      if (file) startUpload(file.name)
    },
    [startUpload],
  )

  const handleFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) startUpload(file.name)
    },
    [startUpload],
  )

  const toggleConfirm = (key: string) => {
    setConfirmed((previous) => {
      const next = new Set(previous)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const isConfirming = stage === "confirm"

  return (
    <div className="flex-1 overflow-y-auto bg-porcelain">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 lg:py-14">
        <header className="grid gap-6 border-b border-rule pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-2xl">
            <p className="editorial-kicker">
              Hồ sơ nghề nghiệp · Bước {isConfirming ? "02" : "01"} / 03
            </p>
            <h1 className="editorial-title mt-3">
              {isConfirming ? "Xác nhận hồ sơ từ CV" : "Bắt đầu từ CV của bạn"}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-ink">
              {isConfirming
                ? "Kiểm tra phần AI đã trích xuất và xác nhận những dữ kiện cần suy luận trước khi dùng hồ sơ để tìm việc."
                : "Tải lên một CV để tạo nền dữ liệu cho phân tích công việc, gợi ý nghề nghiệp và các phiên bản CV theo từng vị trí."}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-xs font-semibold text-ink">
              {isConfirming ? "Đã đọc xong CV" : "Định dạng được chấp nhận"}
            </p>
            <p className="mt-1 text-xs text-muted-ink">
              {isConfirming
                ? "Còn 1 bước để hoàn tất"
                : "PDF, DOC hoặc DOCX · Tối đa 10 MB"}
            </p>
          </div>
        </header>

        {stage === "idle" && (
          <section className="pt-8">
            <div
              onDragOver={(event) => {
                event.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  fileRef.current?.click()
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="Chọn hoặc kéo thả CV để tải lên"
              className={
                "focus-ring group grid min-h-[360px] cursor-pointer place-items-center border border-dashed px-6 py-14 text-center transition-colors " +
                (dragging
                  ? "border-cobalt bg-white"
                  : "border-muted-ink/50 bg-paper hover:border-cobalt")
              }
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={handleFile}
              />
              <div>
                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center border border-rule bg-porcelain text-cobalt transition-transform group-hover:-translate-y-1">
                  <svg
                    width="28"
                    height="28"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 16V4m0 0-4 4m4-4 4 4M4 20h16"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="font-editorial text-3xl leading-tight text-ink sm:text-4xl">
                  {dragging
                    ? "Thả CV vào đây"
                    : "Một CV, toàn bộ hồ sơ nghề nghiệp"}
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-ink">
                  Kéo thả tệp vào vùng này hoặc chọn CV từ thiết bị. Nội dung
                  được mã hóa và chỉ dùng cho phân tích nghề nghiệp.
                </p>
                <span className="mt-7 inline-flex min-h-11 items-center bg-cobalt px-6 text-sm font-semibold text-white transition-colors group-hover:bg-[#2447bb]">
                  Chọn CV để tải lên
                </span>
                <p className="mt-4 text-xs text-muted-ink">
                  PDF, DOC, DOCX · Kích thước tối đa 10 MB
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4 border-t border-rule pt-5 text-xs text-muted-ink sm:flex-row sm:items-center sm:justify-between">
              <p>
                Hồ sơ CV được lưu trữ bảo mật riêng tư và bạn có thể xóa bất kỳ
                lúc nào.
              </p>
              <button
                onClick={() => startUpload("CV_NguyenMinhTuan_2024.pdf")}
                className="focus-ring self-start font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4"
              >
                Dùng CV mẫu để thử nghiệm →
              </button>
            </div>
          </section>
        )}

        {(stage === "uploading" || stage === "processing") && (
          <section className="pt-8">
            <div className="border-y border-rule bg-paper px-5 py-7 sm:px-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="editorial-kicker">Đang xử lý hồ sơ</p>
                  <h2 className="mt-2 text-lg font-semibold text-ink">
                    {fileName || "CV_NguyenMinhTuan_2024.pdf"}
                  </h2>
                </div>
                <span className="font-editorial text-4xl text-cobalt">
                  {stage === "processing" ? "100" : Math.round(progress)}%
                </span>
              </div>

              <div
                className="mt-6 h-1 overflow-hidden bg-rule"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  stage === "processing" ? 100 : Math.round(progress)
                }
              >
                <span
                  className="block h-full bg-cobalt transition-[width]"
                  style={{
                    width:
                      String(stage === "processing" ? 100 : progress) + "%",
                  }}
                />
              </div>

              {stage === "processing" && (
                <div className="mt-7 grid gap-3 border-t border-rule pt-6 sm:grid-cols-2">
                  {[
                    "Trích xuất thông tin cá nhân",
                    "Phân tích kinh nghiệm làm việc",
                    "Xác định kỹ năng và công nghệ",
                    "Đánh giá vị trí phù hợp",
                  ].map((step, index) => (
                    <div
                      key={step}
                      className="flex items-center gap-3 text-sm text-ink"
                    >
                      <span
                        className={
                          "flex h-6 w-6 items-center justify-center border text-[10px] font-bold " +
                          (index < 3
                            ? "border-sage bg-sage text-ink"
                            : "animate-pulse border-cobalt text-cobalt")
                        }
                        aria-hidden="true"
                      >
                        {index < 3 ? "✓" : "04"}
                      </span>
                      {step}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {stage === "confirm" && (
          <section className="pt-8">
            <div className="border-l-2 border-cobalt bg-sage/60 px-5 py-4 text-sm text-ink">
              AI đã phân tích xong. Dữ kiện suy luận vẫn cần bạn xác nhận trước
              khi được dùng trong hồ sơ.
            </div>

            <div className="mt-8 border-t border-rule bg-paper">
              <section className="grid gap-5 border-b border-rule px-5 py-7 md:grid-cols-[180px_1fr] sm:px-7">
                <div>
                  <p className="editorial-kicker">Thông tin cơ bản</p>
                  <p className="mt-2 text-xs leading-5 text-muted-ink">
                    Trích xuất trực tiếp từ CV
                  </p>
                </div>
                <dl className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
                  {[
                    ["Họ tên", PARSED_PROFILE.name],
                    ["Vị trí", PARSED_PROFILE.role],
                    ["Kinh nghiệm", PARSED_PROFILE.experience],
                    ["Địa điểm", PARSED_PROFILE.location],
                  ].map(([label, value]) => (
                    <div key={label} className="border-t border-rule pt-3">
                      <dt className="text-xs text-muted-ink">{label}</dt>
                      <dd className="mt-1 text-sm font-semibold text-ink">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="grid gap-5 border-b border-rule px-5 py-7 md:grid-cols-[180px_1fr] sm:px-7">
                <div>
                  <p className="editorial-kicker">Kỹ năng</p>
                  <p className="mt-2 text-xs leading-5 text-muted-ink">
                    {PARSED_PROFILE.skills.length} kỹ năng được nhận diện
                  </p>
                </div>
                <div className="flex flex-wrap content-start gap-2">
                  {PARSED_PROFILE.skills.map((skill) => (
                    <span
                      key={skill}
                      className="border border-rule bg-porcelain px-3 py-1.5 text-xs font-semibold text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>

              <section className="grid gap-5 px-5 py-7 md:grid-cols-[180px_1fr] sm:px-7">
                <div>
                  <p className="editorial-kicker text-[#9a6700]">
                    Cần xác nhận
                  </p>
                  <p className="mt-2 text-xs leading-5 text-muted-ink">
                    Dữ kiện được suy luận từ ngữ cảnh
                  </p>
                </div>
                <div className="divide-y divide-rule border-y border-rule">
                  {PARSED_PROFILE.inferred.map((item) => {
                    const isConfirmed = confirmed.has(item)
                    return (
                      <div
                        key={item}
                        className="flex items-center justify-between gap-4 py-4"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {item}
                          </p>
                          <p className="mt-1 text-xs text-muted-ink">
                            {isConfirmed
                              ? "Đã được bạn xác nhận"
                              : "AI suy luận · chưa xác nhận"}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleConfirm(item)}
                          className={
                            "focus-ring min-h-10 border px-4 text-xs font-semibold " +
                            (isConfirmed
                              ? "border-sage bg-sage text-ink"
                              : "border-rule bg-paper text-cobalt hover:border-cobalt")
                          }
                        >
                          {isConfirmed ? "Đã xác nhận ✓" : "Xác nhận"}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-rule pt-6 sm:flex-row sm:justify-end">
              <button
                onClick={() => setStage("idle")}
                className="focus-ring min-h-11 border border-rule bg-paper px-5 text-sm font-semibold text-ink hover:border-muted-ink"
              >
                Tải CV khác
              </button>
              <button
                onClick={() => {
                  setCvUploaded(true)
                  onNavigate("copilot")
                }}
                className="focus-ring min-h-11 bg-cobalt px-6 text-sm font-semibold text-white hover:bg-[#2447bb]"
              >
                Hoàn tất và tiếp tục →
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
