import type { Job } from "./types"

export const CV_DATA = {
  name: "Nguyễn Minh Tuấn",
  role: "Senior Frontend Developer",
  experience: 5,
  skills: ["React", "TypeScript", "Node.js", "GraphQL", "Figma", "AWS"],
  improvements: 8,
  fileName: "CV_NguyenMinhTuan_2024.pdf",
}

export const JOBS: Job[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    company: "VNG Corporation",
    location: "TP. Hồ Chí Minh",
    salary: "50–75 triệu/tháng",
    workMode: "Hybrid",
    source: "ITviec",
    postedDays: 2,
    matchScore: 91,
    matchLevel: "strong",
    strengths: ["React/TypeScript", "Kinh nghiệm 5 năm", "GraphQL"],
    gaps: ["Next.js", "Tiếng Anh IELTS 7.0+"],
    tags: ["React", "TypeScript", "GraphQL", "Microservices"],
    description: `VNG Corporation đang tìm kiếm Senior Frontend Engineer để tham gia phát triển nền tảng thương mại điện tử quy mô lớn, phục vụ hơn 50 triệu người dùng tại Việt Nam và Đông Nam Á.\n\n**Trách nhiệm:**\n- Thiết kế và phát triển giao diện người dùng hiệu năng cao bằng React/TypeScript\n- Tối ưu hóa hiệu suất front-end: Core Web Vitals, lazy loading, bundle size\n- Cộng tác chặt chẽ với team Product và Design để hiện thực hóa tính năng mới\n- Mentor junior developers và thực hiện code review\n- Tham gia tối ưu CI/CD pipeline\n\n**Yêu cầu:**\n- Tối thiểu 4 năm kinh nghiệm React/TypeScript\n- Thành thạo Next.js, GraphQL, RESTful APIs\n- Kinh nghiệm với hệ thống microservices\n- IELTS 7.0+ hoặc tương đương\n- Có kinh nghiệm tối ưu Core Web Vitals`,
  },
  {
    id: "2",
    title: "Lead Frontend Developer",
    company: "Tiki",
    location: "TP. Hồ Chí Minh",
    salary: "55–80 triệu/tháng",
    workMode: "Remote",
    source: "LinkedIn",
    postedDays: 5,
    matchScore: 83,
    matchLevel: "strong",
    strengths: ["React", "TypeScript", "Quản lý team"],
    gaps: ["Vue.js", "Kinh nghiệm quản lý 3+ năm"],
    tags: ["React", "Vue", "TypeScript", "Team Lead"],
    description: "Tiki tìm Lead Frontend Developer dẫn dắt team 8 engineers...",
  },
  {
    id: "3",
    title: "Frontend Engineer (React)",
    company: "MoMo",
    location: "Hà Nội",
    salary: "35–55 triệu/tháng",
    workMode: "On-site",
    source: "TopCV",
    postedDays: 1,
    matchScore: 76,
    matchLevel: "moderate",
    strengths: ["React", "TypeScript", "API integration"],
    gaps: ["React Native", "Fintech domain knowledge"],
    tags: ["React", "TypeScript", "Fintech", "Mobile"],
    description:
      "MoMo tuyển Frontend Engineer phát triển ứng dụng thanh toán...",
  },
  {
    id: "4",
    title: "Fullstack Developer (Node + React)",
    company: "KMS Technology",
    location: "TP. Hồ Chí Minh",
    salary: "40–60 triệu/tháng",
    workMode: "Hybrid",
    source: "ITviec",
    postedDays: 3,
    matchScore: 72,
    matchLevel: "moderate",
    strengths: ["Node.js", "React", "AWS"],
    gaps: ["PostgreSQL advanced", "Docker/Kubernetes"],
    tags: ["Node.js", "React", "AWS", "PostgreSQL"],
    description:
      "KMS Technology tuyển Fullstack Developer cho dự án outsource...",
  },
  {
    id: "5",
    title: "UI Engineer / Design Systems",
    company: "Shopee Vietnam",
    location: "TP. Hồ Chí Minh",
    salary: "60–90 triệu/tháng",
    workMode: "Hybrid",
    source: "LinkedIn",
    postedDays: 7,
    matchScore: 68,
    matchLevel: "moderate",
    strengths: ["React", "TypeScript", "Figma"],
    gaps: ["Storybook", "Design system experience 3+ năm", "CSS-in-JS"],
    tags: ["React", "Design System", "Figma", "Storybook"],
    description:
      "Shopee Vietnam tuyển UI Engineer xây dựng design system nội bộ...",
  },
  {
    id: "6",
    title: "Frontend Developer",
    company: "Grab Vietnam",
    location: "TP. Hồ Chí Minh",
    salary: "45–65 triệu/tháng",
    workMode: "Hybrid",
    source: "Glassdoor",
    postedDays: 4,
    matchScore: 58,
    matchLevel: "low",
    strengths: ["React", "TypeScript"],
    gaps: ["Kotlin/Swift cho mobile web", "Maps API", "Ride-hailing domain"],
    tags: ["React", "TypeScript", "Maps", "Mobile"],
    description: "Grab Vietnam tuyển Frontend Developer cho super-app...",
  },
]

export const CHAT_MESSAGES = [
  {
    id: "1",
    role: "ai" as const,
    content:
      "Xin chào Tuấn! Tôi đã phân tích CV của bạn. Bạn có **5 năm kinh nghiệm** với React và TypeScript — đây là nền tảng rất vững chắc. Tôi nhận thấy 8 điểm cần cải thiện trong CV để tăng tỷ lệ đậu phỏng vấn.\n\nDựa trên hồ sơ, tôi tìm thấy **23 vị trí phù hợp** tại TP. Hồ Chí Minh và Hà Nội. Bạn muốn tôi hiển thị kết quả không?",
    timestamp: "09:14",
  },
  {
    id: "2",
    role: "user" as const,
    content:
      "Cho tôi xem các vị trí Senior Frontend, ưu tiên remote hoặc hybrid, lương từ 40 triệu trở lên.",
    timestamp: "09:15",
  },
  {
    id: "3",
    role: "ai" as const,
    content:
      "Tìm thấy **6 vị trí** phù hợp với tiêu chí của bạn. Đây là những cơ hội tốt nhất:",
    timestamp: "09:15",
    hasJobCards: true,
  },
]

export const CV_CONTENT = `Nguyễn Minh Tuấn
Senior Frontend Developer
TP. Hồ Chí Minh · tuannm@gmail.com · 0912 345 678

──────────────────────────────────────────────
KINH NGHIỆM LÀM VIỆC
──────────────────────────────────────────────

VNG Corporation · Senior Frontend Developer
Tháng 3/2022 – Hiện tại

• Phát triển giao diện người dùng bằng React và TypeScript.
• Tích hợp GraphQL API với Apollo Client cho ứng dụng thương mại điện tử.
• Đóng góp vào design system nội bộ sử dụng Storybook.
• Làm việc chặt chẽ với team Backend và DevOps để tối ưu hiệu suất ứng dụng.

Axon Active Vietnam · Frontend Developer
Tháng 6/2020 – Tháng 2/2022

• Phát triển features cho khách hàng tại Thụy Sĩ và Đức sử dụng React/Redux.
• Làm việc trong môi trường Agile với khách hàng quốc tế.
• Xây dựng unit test với Jest và React Testing Library (coverage 85%).

Nashtech Global · Junior Frontend Developer
Tháng 7/2019 – Tháng 5/2020

• Phát triển web application cho khách hàng Australia sử dụng Angular và .NET.

──────────────────────────────────────────────
HỌC VẤN
──────────────────────────────────────────────

Đại học Bách Khoa TP.HCM
Kỹ sư Công nghệ Thông tin · 2015 – 2019 · GPA 3.2/4.0

──────────────────────────────────────────────
KỸ NĂNG
──────────────────────────────────────────────

React, TypeScript, Node.js, GraphQL, AWS, Figma
`
