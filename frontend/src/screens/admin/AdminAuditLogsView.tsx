import { useState } from "react"

interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  target: string
  status: "Success" | "Failure"
  ipAddress: string
}

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "evt-1",
    timestamp: "18/08/2026 10:35:12",
    actor: "admin.super",
    action: "iam:AttachUserPolicy",
    target: "crawler.bot.vietnamworks -> JobCrawlerSyncAccess",
    status: "Success",
    ipAddress: "113.161.45.12",
  },
  {
    id: "evt-2",
    timestamp: "18/08/2026 09:20:05",
    actor: "admin.super",
    action: "iam:CreateUser",
    target: "crawler.bot.itviec",
    status: "Success",
    ipAddress: "113.161.45.12",
  },
  {
    id: "evt-3",
    timestamp: "17/08/2026 16:45:22",
    actor: "admin.super",
    action: "iam:AddUserToGroup",
    target: "tuannm -> Ứng viên (Candidates)",
    status: "Success",
    ipAddress: "14.241.120.90",
  },
  {
    id: "evt-4",
    timestamp: "17/08/2026 14:10:00",
    actor: "auditor.service",
    action: "iam:ListUsers",
    target: "IAM Directory API",
    status: "Success",
    ipAddress: "10.0.4.128",
  },
  {
    id: "evt-5",
    timestamp: "16/08/2026 11:05:40",
    actor: "unknown-attempt",
    action: "iam:ConsoleLogin",
    target: "admin.super",
    status: "Failure",
    ipAddress: "185.220.101.5",
  },
]

export default function AdminAuditLogsView() {
  const [logs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS)
  const [search, setSearch] = useState("")

  const filtered = logs.filter(
    (l) =>
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">
            Nhật ký Hoạt động & Kiểm toán (Audit Logs)
          </h1>
          <p className="mt-1 text-xs text-muted-ink">
            Theo dõi thời gian thực mọi thay đổi phân quyền, đăng nhập và thao tác bảo mật của quản trị viên.
          </p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm log theo tài khoản, hành động..."
          className="focus-ring h-9 w-72 rounded-[4px] border border-rule bg-paper px-3 text-xs outline-none focus:border-cobalt"
        />
      </div>

      {/* Logs Table */}
      <div className="rounded-[6px] border border-rule bg-paper shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-rule bg-porcelain/60 font-semibold text-muted-ink">
              <th className="px-4 py-3">Thời gian</th>
              <th className="px-4 py-3">Tài khoản thực hiện (Actor)</th>
              <th className="px-4 py-3">Hành động (Action)</th>
              <th className="px-4 py-3">Đối tượng (Target)</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 font-mono">Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule bg-paper text-ink">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-porcelain/40">
                <td className="px-4 py-3 font-mono text-[11px] text-muted-ink">
                  {log.timestamp}
                </td>
                <td className="px-4 py-3 font-bold text-ink">{log.actor}</td>
                <td className="px-4 py-3 font-mono font-semibold text-cobalt">
                  {log.action}
                </td>
                <td className="px-4 py-3 text-[11px] text-ink">{log.target}</td>
                <td className="px-4 py-3">
                  {log.status === "Success" ? (
                    <span className="inline-flex items-center rounded-[3px] bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      ✓ Thành công
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-[3px] bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-700">
                      ✕ Thất bại
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-muted-ink">
                  {log.ipAddress}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
