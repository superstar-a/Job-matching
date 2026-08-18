export type Screen =
  | "auth"
  | "upload"
  | "copilot"
  | "explore"
  | "job-detail"
  | "jd-detail"
  | "profile"
  | "cv-editor"
  | "saved"
  | "matched-jobs"
  | "admin-iam"
  | (string & {})

export interface Job {
  id: string
  title: string
  company: string
  location: string
  salary: string
  workMode: string
  source: string
  postedDays: number
  matchScore: number
  matchLevel: "strong" | "moderate" | "low"
  strengths: string[]
  gaps: string[]
  tags: string[]
  description?: string
}

export interface CVData {
  name: string
  role: string
  experience: number
  skills: string[]
  improvements: number
  fileName: string
}

export interface CVVersion {
  id: string
  job: Job
  lastUpdated: string
  status: "editing" | "completed"
  appliedCount: number
  totalSuggestions: number
  cvContent: string
}

export interface Permission {
  id: string
  name: string
  code: string
  description: string
  category: "Jobs" | "CV" | "Users" | "System"
}

export interface Role {
  id: string
  name: string
  code: string
  description: string
  permissions: string[]
  userCount: number
  createdAt: string
}

export interface IAMUser {
  id: string
  userName: string
  email: string
  path: string
  role: string
  customPermissions: string[]
  consoleAccess: boolean
  status: "Active" | "Inactive"
  lastActivity: string
  createdAt: string
}

export type AdminTab = "dashboard" | "users" | "roles" | "permissions"

export type AdminIAMSubScreen =
  | "users-list"
  | "create-user"
  | "user-detail"
  | "roles-list"
  | "create-role"
