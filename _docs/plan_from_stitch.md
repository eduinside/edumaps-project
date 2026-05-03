# Project Brief & PRD: EduMaps

## 1. Project Overview
**EduMaps** is a web-based educational resource mapping platform designed for elementary school parents. It provides a curated directory of local field trip locations (offline) and self-directed learning resources (online) tailored to the South Korean elementary curriculum.

### Vision
To empower parents with easily accessible, grade-appropriate educational resources that bridge the gap between classroom learning and real-world experiences.

---

## 2. Target Audience
- **Primary**: Parents of elementary school students (Grades 1-6) looking for educational weekend activities or supplementary online materials.
- **Secondary**: Educators seeking local resources for curriculum-linked field trips.

---

## 3. Product Goals
1. **Accessibility**: Provide a mobile-first, intuitive map interface for quick resource discovery.
2. **Curriculum Alignment**: Categorize resources by grade level and subject matter (Social Studies, Science, etc.).
3. **Data-Driven**: Maintain a lightweight, easy-to-update system using JSON data as the source of truth.
4. **Actionable Insights**: Provide parents with specific "Inquiry Questions" and "Post-Activity Ideas" for each resource.

---

## 4. Key Features & User Stories

### A. Full-Screen Interactive Map (Offline Resources)
- **Feature**: A map interface (Naver Maps API) displaying markers for educational sites.
- **User Story**: As a parent, I want to see educational spots near my location so I can plan a weekend trip.
- **Details**: Clicking a marker opens an overlay with site details (subject, inquiry questions, etc.).

### B. Online Learning Resource Map
- **Feature**: A grid-based directory of digital tools and websites (e.g., Chrome Music Lab).
- **User Story**: As a parent, I want my child to engage in safe, self-directed online learning when we are at home.

### C. Grade-Specific Roadmap (Integrated Map)
- **Feature**: A timeline or sequential list showing both online and offline resources aligned with the school year.
- **User Story**: As a parent of a 1st grader, I want to see what my child is learning each month and find related activities.

### D. Usage Guide & Resource Suggestion
- **Feature**: A step-by-step guide and a form link for users to suggest new resources.

---

## 5. Technical Specifications

### Tech Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Map API**: Naver Maps JavaScript API v3
- **Data**: Static JSON files (`resources.json`)

### Data Schema (Sample)
```json
{
  "id": "string",
  "type": "ONLINE | OFFLINE",
  "grade": [1, 2, 3, 4, 5, 6],
  "title": "string",
  "subject": "string",
  "month": "string",
  "tags": ["#tag1", "#tag2"],
  "content": {
    "description": "string",
    "inquiry_questions": ["string"],
    "post_activities": ["string"]
  },
  "location": { "lat": 0, "lng": 0 },
  "image_url": "string",
  "external_url": "string"
}
```

---

## 6. UI/UX Principles
- **Mobile-First**: Optimized for touch interaction and vertical scrolling.
- **Clarity**: High contrast, readable typography (Plus Jakarta Sans), and clear iconography.
- **Contextual**: Keeping the map visible in the background to maintain spatial awareness while viewing details.

---

## 7. Success Metrics
- **Engagement**: Number of monthly active users.
- **Utility**: Percentage of users clicking "View Map" or "Start Learning" buttons.
- **Growth**: Number of user-submitted resource suggestions.
