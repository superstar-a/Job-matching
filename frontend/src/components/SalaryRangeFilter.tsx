import { useEffect, useRef, useState } from "react"

interface SalaryRangeFilterProps {
  minSalary: number
  maxSalary: number
  onChange: (range: [number, number]) => void
}

const MIN_LIMIT = 0
const MAX_LIMIT = 100
const STEP = 10 // Mỗi mức là 10 triệu

export default function SalaryRangeFilter({
  minSalary,
  maxSalary,
  onChange,
}: SalaryRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Local state for smooth dragging before committing/closing if desired
  const [localMin, setLocalMin] = useState(minSalary)
  const [localMax, setLocalMax] = useState(maxSalary)

  useEffect(() => {
    setLocalMin(minSalary)
    setLocalMax(maxSalary)
  }, [minSalary, maxSalary])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), localMax - STEP)
    setLocalMin(val)
    onChange([val, localMax])
  }

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), localMin + STEP)
    setLocalMax(val)
    onChange([localMin, val])
  }

  const handleReset = () => {
    setLocalMin(MIN_LIMIT)
    setLocalMax(MAX_LIMIT)
    onChange([MIN_LIMIT, MAX_LIMIT])
  }

  const isFiltered = localMin > MIN_LIMIT || localMax < MAX_LIMIT

  // Format label: e.g., "0 triệu - 100 triệu" or "30 - 70 triệu"
  const formatSalary = (val: number) => {
    if (val === 0) return "0 triệu"
    if (val >= MAX_LIMIT) return "100+ triệu"
    return `${val} triệu`
  }

  const minPercent = ((localMin - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100
  const maxPercent = ((localMax - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Pill button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`focus-ring flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all select-none ${
          isFiltered
            ? "border-cobalt bg-cobalt text-white shadow-sm"
            : "border-rule bg-paper text-muted-ink hover:border-cobalt hover:text-cobalt"
        }`}
        aria-expanded={isOpen}
      >
        <span>
          {isFiltered
            ? `Lương: ${localMin}–${localMax >= MAX_LIMIT ? "100M+" : `${localMax}M`}`
            : "Lương"}
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.2"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover slider menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-2xl border border-rule/80 bg-paper p-5 shadow-xl transition-all animate-in fade-in duration-150">
          {/* Header Range Value Display */}
          <div className="flex items-center justify-between pb-3">
            <span className="text-base font-bold text-ink tracking-tight">
              {formatSalary(localMin)} - {formatSalary(localMax)}
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-cobalt hover:underline"
              >
                Đặt lại
              </button>
            )}
          </div>

          {/* Dual Range Slider Component */}
          <div className="relative py-4">
            {/* Background Grey Track */}
            <div className="h-1.5 w-full rounded-full bg-rule/70" />

            {/* Active Green Highlight Track */}
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#22c55e]"
              style={{
                left: `${minPercent}%`,
                width: `${maxPercent - minPercent}%`,
              }}
            />

            {/* Min Slider Input */}
            <input
              type="range"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              step={STEP}
              value={localMin}
              onChange={handleMinChange}
              className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent accent-[#22c55e] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rule [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rule [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Mức lương tối thiểu"
            />

            {/* Max Slider Input */}
            <input
              type="range"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              step={STEP}
              value={localMax}
              onChange={handleMaxChange}
              className="pointer-events-none absolute inset-0 w-full appearance-none bg-transparent accent-[#22c55e] [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-rule [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-rule [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer"
              aria-label="Mức lương tối đa"
            />
          </div>

          {/* Scale Step Marks */}
          <div className="flex justify-between text-[11px] font-medium text-muted-ink pt-1 pb-3 select-none">
            <span>0 tr</span>
            <span>20 tr</span>
            <span>40 tr</span>
            <span>60 tr</span>
            <span>80 tr</span>
            <span>100 tr</span>
          </div>

          {/* Quick preset chips */}
          <div className="mt-2 flex flex-wrap gap-1.5 pt-2 border-t border-rule/50">
            {[
              { label: "Tất cả", range: [0, 100] as [number, number] },
              { label: "20–40 tr", range: [20, 40] as [number, number] },
              { label: "40–70 tr", range: [40, 70] as [number, number] },
              { label: "Trên 60 tr", range: [60, 100] as [number, number] },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setLocalMin(preset.range[0])
                  setLocalMax(preset.range[1])
                  onChange(preset.range)
                }}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${
                  localMin === preset.range[0] && localMax === preset.range[1]
                    ? "bg-cobalt text-white"
                    : "bg-porcelain text-muted-ink hover:bg-rule/60 hover:text-ink"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
