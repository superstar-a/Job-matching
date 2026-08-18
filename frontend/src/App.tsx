import { useState, useEffect } from "react"
import Sidebar from "./components/Sidebar"
import AuthGate from "./screens/AuthGate"
import CVUpload from "./screens/CVUpload"
import ChatAssistant from "./screens/ChatAssistant"
import JobDiscover from "./screens/JobDiscover"
import CVJDAnalysis from "./screens/CVJDAnalysis"
import JobTracker from "./screens/JobTracker"
import Profile from "./screens/Profile"
import CVEditor from "./screens/CVEditor"
import AIMatchedJobs from "./screens/AIMatchedJobs"
import JDDetail from "./screens/JDDetail"
import IAMLayout from "./screens/admin/IAMLayout"
import IAMUsersList from "./screens/admin/IAMUsersList"
import IAMCreateUserWizard from "./screens/admin/IAMCreateUserWizard"
import IAMUserDetail from "./screens/admin/IAMUserDetail"
import AdminRolesList from "./screens/admin/AdminRolesList"
import AdminCreateRoleWizard from "./screens/admin/AdminCreateRoleWizard"
import AdminPermissionsList from "./screens/admin/AdminPermissionsList"
import AdminDashboard from "./screens/admin/AdminDashboard"
import type { Screen, Job, CVVersion, IAMUser, Role, Permission, AdminIAMSubScreen, AdminTab } from "./types"
import { CV_CONTENT, JOBS } from "./data"
import { INITIAL_IAM_USERS, INITIAL_ROLES, INITIAL_PERMISSIONS } from "./iamData"

type ReturnOrigin = "copilot" | "explore" | "matched-jobs" | "saved"

export default function App() {
  const isInitialAdmin = () => {
    if (typeof window === "undefined") return false
    const hash = window.location.hash.toLowerCase()
    const search = window.location.search.toLowerCase()
    const pathname = window.location.pathname.toLowerCase()
    return (
      hash.includes("admin") ||
      search.includes("admin") ||
      pathname.includes("/admin")
    )
  }

  const [isAdminPortal, setIsAdminPortal] = useState(isInitialAdmin)
  const [adminTab, setAdminTab] = useState<AdminTab>("users")
  const [screen, setScreen] = useState<Screen>("copilot")
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [returnOrigin, setReturnOrigin] = useState<ReturnOrigin | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCvUploaded, setIsCvUploaded] = useState(false)

  // IAM Admin State: Users, Roles, Permissions (Full CRUD)
  const [iamUsers, setIamUsers] = useState<IAMUser[]>(INITIAL_IAM_USERS)
  const [iamRoles, setIamRoles] = useState<Role[]>(INITIAL_ROLES)
  const [iamPermissions, setIamPermissions] = useState<Permission[]>(INITIAL_PERMISSIONS)
  const [adminSubScreen, setAdminSubScreen] = useState<AdminIAMSubScreen>("users-list")
  const [selectedIAMUser, setSelectedIAMUser] = useState<IAMUser | null>(null)

  // Listen to URL changes for standalone routing
  useEffect(() => {
    const handleUrlChange = () => {
      const hash = window.location.hash.toLowerCase()
      const search = window.location.search.toLowerCase()
      const pathname = window.location.pathname.toLowerCase()
      setIsAdminPortal(
        hash.includes("admin") ||
          search.includes("admin") ||
          pathname.includes("/admin"),
      )
    }

    window.addEventListener("hashchange", handleUrlChange)
    window.addEventListener("popstate", handleUrlChange)
    return () => {
      window.removeEventListener("hashchange", handleUrlChange)
      window.removeEventListener("popstate", handleUrlChange)
    }
  }, [])

  const [cvVersions, setCvVersions] = useState<CVVersion[]>([
    {
      id: "cv-1",
      job: JOBS[0], // VNG Corporation
      lastUpdated: "2 giờ trước",
      status: "editing",
      appliedCount: 2,
      totalSuggestions: 4,
      cvContent: CV_CONTENT,
    },
    {
      id: "cv-2",
      job: JOBS[1], // Tiki
      lastUpdated: "Hôm qua",
      status: "completed",
      appliedCount: 4,
      totalSuggestions: 4,
      cvContent: CV_CONTENT,
    },
    {
      id: "cv-3",
      job: JOBS[2], // MoMo
      lastUpdated: "3 ngày trước",
      status: "editing",
      appliedCount: 1,
      totalSuggestions: 3,
      cvContent: CV_CONTENT,
    },
    {
      id: "cv-4",
      job: JOBS[3], // KMS Technology
      lastUpdated: "5 ngày trước",
      status: "completed",
      appliedCount: 3,
      totalSuggestions: 3,
      cvContent: CV_CONTENT,
    },
    {
      id: "cv-5",
      job: JOBS[4], // FPT Software
      lastUpdated: "1 tuần trước",
      status: "editing",
      appliedCount: 2,
      totalSuggestions: 5,
      cvContent: CV_CONTENT,
    },
    {
      id: "cv-6",
      job: JOBS[5], // One Mount Group
      lastUpdated: "2 tuần trước",
      status: "completed",
      appliedCount: 4,
      totalSuggestions: 4,
      cvContent: CV_CONTENT,
    },
  ])

  const navigate = (
    nextScreen: Screen,
    job?: Job | null,
    origin?: ReturnOrigin,
  ) => {
    if (job !== undefined) setSelectedJob(job)
    if (
      nextScreen === "job-detail" ||
      nextScreen === "jd-detail" ||
      nextScreen === "cv-editor"
    ) {
      setReturnOrigin(origin ?? null)
    }
    setScreen(nextScreen)
  }

  // ================= STANDALONE ADMIN IAM PORTAL =================
  if (isAdminPortal) {
    const tabLabels: Record<AdminTab, string> = {
      dashboard: "Tổng quan",
      users: "Người dùng",
      roles: "Vai trò",
      permissions: "Quyền hạn",
    }

    const breadcrumbs = [
      {
        label: tabLabels[adminTab],
        onClick: () => {
          setAdminSubScreen(adminTab === "roles" ? "roles-list" : "users-list")
          setSelectedIAMUser(null)
        },
        active:
          (adminTab === "users" && adminSubScreen === "users-list") ||
          (adminTab === "roles" && adminSubScreen === "roles-list") ||
          adminTab === "dashboard" ||
          adminTab === "permissions",
      },
    ]

    if (adminTab === "users") {
      if (adminSubScreen === "create-user") {
        breadcrumbs.push({
          label: "Tạo người dùng mới",
          active: true,
        })
      } else if (adminSubScreen === "user-detail" && selectedIAMUser) {
        breadcrumbs.push({
          label: selectedIAMUser.userName,
          active: true,
        })
      }
    } else if (adminTab === "roles") {
      if (adminSubScreen === "create-role") {
        breadcrumbs.push({
          label: "Tạo vai trò",
          active: true,
        })
      }
    }

    // Dynamically compute user counts for all roles
    const rolesWithUserCounts = iamRoles.map((role) => ({
      ...role,
      userCount: iamUsers.filter((u) => u.role === role.name).length,
    }))

    return (
      <IAMLayout
        currentTab={adminTab}
        onSelectTab={(tab) => {
          setAdminTab(tab)
          setAdminSubScreen(tab === "roles" ? "roles-list" : "users-list")
          setSelectedIAMUser(null)
        }}
        userCount={iamUsers.length}
        roleCount={iamRoles.length}
        permissionCount={iamPermissions.length}
        breadcrumbs={breadcrumbs}
      >
        {/* Tab 1: Dashboard */}
        {adminTab === "dashboard" && (
          <AdminDashboard
            users={iamUsers}
            roles={rolesWithUserCounts}
            permissions={iamPermissions}
            onNavigateTab={(tab) => {
              setAdminTab(tab)
              setAdminSubScreen(tab === "roles" ? "roles-list" : "users-list")
            }}
          />
        )}

        {/* Tab 2: Users (CRUD) */}
        {adminTab === "users" && (
          <>
            {adminSubScreen === "users-list" && (
              <IAMUsersList
                users={iamUsers}
                roles={rolesWithUserCounts}
                onCreateUser={() => setAdminSubScreen("create-user")}
                onSelectUser={(u) => {
                  setSelectedIAMUser(u)
                  setAdminSubScreen("user-detail")
                }}
                onDeleteUsers={(deletedIds) => {
                  setIamUsers((prev) => prev.filter((u) => !deletedIds.includes(u.id)))
                }}
              />
            )}

            {adminSubScreen === "create-user" && (
              <IAMCreateUserWizard
                roles={rolesWithUserCounts}
                permissions={iamPermissions}
                onCancel={() => setAdminSubScreen("users-list")}
                onCreateUser={(newUser) => {
                  setIamUsers((prev) => [newUser, ...prev])
                  setAdminSubScreen("users-list")
                }}
              />
            )}

            {adminSubScreen === "user-detail" && selectedIAMUser && (
              <IAMUserDetail
                user={selectedIAMUser}
                roles={rolesWithUserCounts}
                permissions={iamPermissions}
                onBack={() => {
                  setSelectedIAMUser(null)
                  setAdminSubScreen("users-list")
                }}
                onUpdateUser={(updatedUser) => {
                  setSelectedIAMUser(updatedUser)
                  setIamUsers((prev) =>
                    prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
                  )
                }}
              />
            )}
          </>
        )}

        {/* Tab 3: Roles (CRUD) */}
        {adminTab === "roles" && (
          <>
            {adminSubScreen === "create-role" ? (
              <AdminCreateRoleWizard
                permissions={iamPermissions}
                onCancel={() => setAdminSubScreen("roles-list")}
                onCreateRole={(newRole) => {
                  setIamRoles((prev) => [...prev, newRole])
                  setAdminSubScreen("roles-list")
                }}
              />
            ) : (
              <AdminRolesList
                roles={rolesWithUserCounts}
                permissions={iamPermissions}
                onCreateRole={() => setAdminSubScreen("create-role")}
                onDeleteRole={(roleId) => {
                  setIamRoles((prev) => prev.filter((r) => r.id !== roleId))
                }}
              />
            )}
          </>
        )}

        {/* Tab 4: Permissions (CRUD) */}
        {adminTab === "permissions" && (
          <AdminPermissionsList
            permissions={iamPermissions}
            onCreatePermission={(newPerm) => {
              setIamPermissions((prev) => [...prev, newPerm])
            }}
            onUpdatePermission={(updatedPerm) => {
              setIamPermissions((prev) =>
                prev.map((p) => (p.id === updatedPerm.id ? updatedPerm : p)),
              )
            }}
            onDeletePermission={(permId) => {
              setIamPermissions((prev) => prev.filter((p) => p.id !== permId))
            }}
          />
        )}
      </IAMLayout>
    )
  }

  // ================= STANDALONE USER APP =================
  if (screen === "auth") {
    return <AuthGate onAuthenticated={() => navigate("copilot")} />
  }

  return (
    <div className="app-shell flex h-screen w-full overflow-hidden bg-porcelain text-ink">
      <Sidebar
        currentScreen={screen}
        onNavigate={(s, job) => navigate(s, job)}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        isCvUploaded={isCvUploaded}
      />

      <main className="flex min-w-0 flex-1 flex-col h-full overflow-hidden">
        {screen === "upload" && (
          <CVUpload
            onNavigate={(s) => navigate(s)}
            setCvUploaded={setIsCvUploaded}
          />
        )}
        {screen === "copilot" && (
          <ChatAssistant
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
            isCvUploaded={isCvUploaded}
            setCvUploaded={setIsCvUploaded}
          />
        )}
        {screen === "explore" && (
          <JobDiscover
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
          />
        )}
        {screen === "job-detail" && selectedJob && (
          <CVJDAnalysis
            job={selectedJob}
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
            returnOrigin={returnOrigin || "explore"}
          />
        )}
        {screen === "jd-detail" && selectedJob && (
          <JDDetail
            job={selectedJob}
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
            returnOrigin={returnOrigin || "copilot"}
          />
        )}
        {screen === "profile" && <Profile />}
        {screen === "cv-editor" && (
          <CVEditor
            job={selectedJob}
            onNavigate={(s, job) => navigate(s, job)}
            cvVersions={cvVersions}
            setCvVersions={setCvVersions}
          />
        )}
        {screen === "saved" && (
          <JobTracker
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
          />
        )}
        {screen === "matched-jobs" && (
          <AIMatchedJobs
            onNavigate={(s, job, origin) => navigate(s, job, origin)}
          />
        )}
      </main>
    </div>
  )
}
