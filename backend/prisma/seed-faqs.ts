import { PrismaClient, SupportCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Map FAQ sections to SupportCategory enums
const categoryMapping: Record<string, SupportCategory> = {
  'General Questions': 'GENERAL_INQUIRIES',
  'Student FAQs': 'FEATURE_GUIDANCE',
  'Faculty/Teacher FAQs': 'FEATURE_GUIDANCE',
  'Principal FAQs': 'FEATURE_GUIDANCE',
  'Technical Support': 'TECHNICAL_ISSUES',
  'Login & Access': 'ACCOUNT_PROFILE',
  'Account Issues': 'ACCOUNT_PROFILE',
  'Internship Submission': 'INTERNSHIP_QUERIES',
  'Documentation': 'DATA_REPORTS',
  'Tracking & Monitoring': 'INTERNSHIP_QUERIES',
  'Grievances & Support': 'GENERAL_INQUIRIES',
  'Student Supervision': 'INTERNSHIP_QUERIES',
  'Visits & Documentation': 'DATA_REPORTS',
  'Grievance Management': 'GENERAL_INQUIRIES',
  'Progress Tracking': 'INTERNSHIP_QUERIES',
  'Student Registration': 'ACCOUNT_PROFILE',
  'Administrative Overview': 'FEATURE_GUIDANCE',
  'Faculty Management': 'FEATURE_GUIDANCE',
  'Student Management': 'ACCOUNT_PROFILE',
  'Analytics & Monitoring': 'DATA_REPORTS',
  'Role & Permission Management': 'ACCOUNT_PROFILE',
  'Data & Reporting Issues': 'DATA_REPORTS',
  'Mobile & Accessibility': 'TECHNICAL_ISSUES',
  'File Upload Issues': 'TECHNICAL_ISSUES',
  'Performance Issues': 'TECHNICAL_ISSUES',
};

// FAQ Data parsed from FAQS.md
const faqData = [
  // ==========================================
  // GENERAL QUESTIONS
  // ==========================================
  {
    title: 'What is PlaceIntern?',
    content: 'PlaceIntern is an Internship Management Portal designed to streamline the entire internship lifecycle for students, faculty supervisors, and institutional administrators. It facilitates internship submission, progress tracking, mentor coordination, and grievance management.',
    summary: 'Overview of the PlaceIntern internship management system',
    category: 'GENERAL_INQUIRIES' as SupportCategory,
    tags: ['overview', 'about', 'introduction', 'placeintern'],
  },
  {
    title: 'How do I access the portal?',
    content: 'Navigate to https://placeintern.com/login and enter your credentials (Registration Number/Username and Password). Make sure you have received your login credentials from your institution.',
    summary: 'Instructions for accessing the PlaceIntern portal',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['login', 'access', 'portal', 'url'],
  },
  {
    title: 'What should I do if I forget my password?',
    content: 'Contact your immediate supervisor:\n\n• **Students:** Contact your Faculty Mentor\n• **Faculty:** Contact your Principal\n• **Principal:** Contact State Directorate support at dtepunjab.internship@gmail.com\n\nYour supervisor can reset your password through the system.',
    summary: 'Password recovery process for different user roles',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['password', 'forgot', 'reset', 'recovery'],
  },
  {
    title: 'Do I need to change my password after first login?',
    content: 'Yes, the system requires all users to change their password on first login for security purposes. The new password must be at least 6 characters long and should contain a mix of letters and numbers for better security.',
    summary: 'First login password change requirement',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['password', 'first-login', 'security', 'change-password'],
  },
  {
    title: 'What browsers are supported?',
    content: 'The portal works best on modern browsers like Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. Ensure your browser is updated to the latest version for optimal performance and security.',
    summary: 'Browser compatibility information',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['browser', 'chrome', 'firefox', 'edge', 'safari', 'compatibility'],
  },
  {
    title: 'What is the support email?',
    content: 'For technical or administrative support, contact: **dtepunjab.internship@gmail.com**\n\nInclude your role, registration number (if applicable), and a detailed description of your issue for faster resolution.',
    summary: 'Official support contact information',
    category: 'GENERAL_INQUIRIES' as SupportCategory,
    tags: ['support', 'email', 'contact', 'help'],
  },

  // ==========================================
  // STUDENT FAQs - Login & Access
  // ==========================================
  {
    title: 'How do I get my login credentials? (Students)',
    content: 'Your Faculty Mentor will provide your login credentials. The username is typically your Registration Number. If you haven\'t received your credentials, contact your Faculty Mentor or institution\'s administrative office.',
    summary: 'How students can obtain their login credentials',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['student', 'login', 'credentials', 'registration-number'],
  },
  {
    title: 'Can I update my profile information?',
    content: 'Yes, navigate to **Student Profile > Profile** from the sidebar menu to update your personal information, email address, and upload your profile photo. Keep your contact information current for important notifications.',
    summary: 'Profile update instructions for students',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['profile', 'update', 'student', 'personal-information'],
  },
  {
    title: 'What should I do after my first login?',
    content: 'After first login:\n\n1. **Change your password** when prompted\n2. **Update your profile** with a valid email address\n3. **Upload your profile photo**\n4. **Review your dashboard** to understand your internship status\n\nCompleting these steps ensures you receive all important notifications and have a complete profile.',
    summary: 'First-time login checklist for students',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['first-login', 'student', 'setup', 'profile', 'password'],
  },

  // ==========================================
  // STUDENT FAQs - Internship Submission
  // ==========================================
  {
    title: 'How do I submit my internship details?',
    content: 'Navigate to **Internship Portal > Submit Internship Details** and fill in all required information including:\n\n• Company name and address\n• HR contact details\n• Internship duration (start and end dates)\n• Internship type (Self-identified or College-arranged)\n• Role/Position\n\nEnsure all information is accurate before submission.',
    summary: 'Steps to submit internship details',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['internship', 'submit', 'application', 'student'],
  },
  {
    title: 'Can I have multiple active internships?',
    content: 'No, you can only have **1 active internship** at a time in the system. If you need to change your internship, you must first complete or withdraw from your current one before submitting a new application.',
    summary: 'Policy on multiple internships',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['internship', 'multiple', 'active', 'policy'],
  },
  {
    title: 'What is the minimum internship duration?',
    content: 'The minimum required internship duration is **16 weeks** (approximately 4 months). This ensures students get adequate practical exposure and complete all required milestones including monthly reports and mentor visits.',
    summary: 'Minimum internship duration requirement',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['internship', 'duration', 'minimum', 'weeks'],
  },
  {
    title: 'What types of internships can I submit?',
    content: 'You can submit two types of internships:\n\n• **Self-Identified Internship:** Internships you found on your own through job portals, referrals, or direct company applications\n• **College-Arranged Internship:** Internships arranged by the institution through placement drives or industry partnerships\n\nBoth types require approval from your Faculty Mentor.',
    summary: 'Types of internships that can be submitted',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['internship', 'types', 'self-identified', 'college-arranged'],
  },
  {
    title: 'Can I edit my internship details after submission?',
    content: 'Once submitted, certain fields may be locked for data integrity. Contact your Faculty Mentor if you need to make changes to approved internships. Minor corrections can be requested, but significant changes may require a new submission.',
    summary: 'Editing internship details after submission',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['internship', 'edit', 'modify', 'after-submission'],
  },

  // ==========================================
  // STUDENT FAQs - Documentation
  // ==========================================
  {
    title: 'What documents do I need to upload?',
    content: 'You must upload:\n\n• **Joining Letter/Offer Letter:** Required at the start of your internship (within first week)\n• **Monthly Reports:** One report per month throughout your internship\n• **Completion Certificate:** At the end of your internship (optional but recommended)\n\nAll documents should be in PDF format for consistency.',
    summary: 'Required documents for internship',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['documents', 'upload', 'joining-letter', 'monthly-report'],
  },
  {
    title: 'When are monthly reports due?',
    content: 'Monthly reports are due **by the 5th of each month** for the previous month\'s work. For example, December\'s report should be submitted by January 5th. The exact deadline may be specified by your institution or Faculty Mentor.',
    summary: 'Monthly report submission deadline',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['monthly-report', 'due-date', 'deadline', 'submission'],
  },
  {
    title: 'How many monthly reports do I need to submit?',
    content: 'The number of monthly reports equals the number of months in your internship. For example:\n\n• 4-month internship = 4 monthly reports\n• 6-month internship = 6 monthly reports\n\nEach report should cover your work, learnings, and achievements for that month.',
    summary: 'Number of required monthly reports',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['monthly-report', 'count', 'number', 'requirement'],
  },
  {
    title: 'What format should my documents be in?',
    content: 'Documents should typically be in **PDF, DOC, or DOCX** format. File size limits:\n\n• Documents: Maximum 5-10 MB\n• Images (profile photo): Maximum 2 MB\n\nEnsure documents are clearly readable and properly formatted before uploading.',
    summary: 'Acceptable document formats and sizes',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['document', 'format', 'pdf', 'size', 'upload'],
  },

  // ==========================================
  // STUDENT FAQs - Tracking & Monitoring
  // ==========================================
  {
    title: 'How do I track my internship progress?',
    content: 'Your dashboard displays 4 key milestones:\n\n1. **Internship Data** - Complete/Incomplete status\n2. **Joining Letter** - Submitted/Pending status\n3. **Grievances** - Open count (if any)\n4. **Monthly Reports** - Progress indicator (e.g., "4/8 Reports Submitted")\n\nRegularly check your dashboard to ensure you\'re on track.',
    summary: 'Tracking internship progress through dashboard',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['progress', 'tracking', 'dashboard', 'milestones'],
  },
  {
    title: 'Who is my Faculty Mentor?',
    content: 'Your Faculty Mentor details are displayed on your dashboard, including:\n\n• Name and designation\n• Contact email\n• Phone number\n\nThis is the faculty member assigned by your Principal to supervise your internship. Contact them for any internship-related queries or guidance.',
    summary: 'Finding faculty mentor information',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['faculty', 'mentor', 'supervisor', 'contact'],
  },
  {
    title: 'How often will my Faculty Mentor visit?',
    content: 'Faculty Mentors are required to conduct at least **1 visit per month** (physical, virtual, or telephonic) throughout your internship duration. Visit types include:\n\n• **Physical visits** to the internship site\n• **Virtual visits** via video call\n• **Telephonic visits** via phone call\n\nBe available and prepared for these visits.',
    summary: 'Faculty mentor visit frequency',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['mentor', 'visit', 'frequency', 'monthly'],
  },

  // ==========================================
  // STUDENT FAQs - Grievances & Support
  // ==========================================
  {
    title: 'How do I report an issue with my internship?',
    content: 'Navigate to **Internship Portal > Submit Grievance** to report any concerns related to your internship experience. Categories include:\n\n• Workplace environment issues\n• Mentor-related concerns\n• Company-related problems\n• Safety concerns\n• Stipend issues\n\nProvide detailed information for faster resolution.',
    summary: 'Reporting internship issues through grievance system',
    category: 'GENERAL_INQUIRIES' as SupportCategory,
    tags: ['grievance', 'report', 'issue', 'internship-problem'],
  },
  {
    title: 'What should I do if I have a technical issue with the portal?',
    content: 'Navigate to **Help & Support > Submit Ticket** to report system-related issues. Include:\n\n• Detailed description of the issue\n• Steps to reproduce the problem\n• Screenshots (if applicable)\n• Browser and device information\n\nTechnical queries are handled by the State Directorate support team.',
    summary: 'Reporting technical issues with the portal',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['technical', 'issue', 'portal', 'bug', 'error'],
  },
  {
    title: 'How can I track my submitted queries?',
    content: 'Navigate to **Help & Support > My Queries** to view the status of all your submitted technical queries. Statuses include:\n\n• **Open** - Query submitted, awaiting review\n• **In Progress** - Being worked on by support team\n• **Resolved** - Issue resolved\n• **Closed** - Query closed\n\nYou can add replies to open tickets for additional information.',
    summary: 'Tracking support query status',
    category: 'GENERAL_INQUIRIES' as SupportCategory,
    tags: ['queries', 'track', 'status', 'support'],
  },

  // ==========================================
  // FACULTY/TEACHER FAQs
  // ==========================================
  {
    title: 'How do I receive my login credentials? (Faculty)',
    content: 'Your login credentials are sent to your official email address by the Principal or System Administrator. If you haven\'t received them, contact your institution\'s administration office.',
    summary: 'Faculty credential distribution',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['faculty', 'credentials', 'login', 'email'],
  },
  {
    title: 'What is my role as Faculty in the system?',
    content: 'As a Faculty Supervisor (also called Teacher in the system), you serve as the primary academic mentor for assigned students during their internships. Your responsibilities include:\n\n• Monitoring student progress\n• Conducting monthly visits\n• Reviewing and verifying documents\n• Handling grievances\n• Providing guidance and support',
    summary: 'Faculty supervisor role and responsibilities',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['faculty', 'role', 'responsibilities', 'supervisor'],
  },
  {
    title: 'How are students assigned to me?',
    content: 'Students are assigned by the Principal through the **Mentor Assignment** module. You cannot self-assign students. Once assigned, students will appear in your dashboard under "Assigned Students".',
    summary: 'Student assignment process for faculty',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['student', 'assignment', 'mentor', 'principal'],
  },
  {
    title: 'How many students will I supervise?',
    content: 'The number of students per Faculty Supervisor is decided by the Principal based on institutional needs and faculty availability. A typical ratio might be 10-20 students per faculty member, but this varies by institution.',
    summary: 'Student supervision load',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['students', 'supervise', 'count', 'ratio'],
  },
  {
    title: 'How do I view my assigned students?',
    content: 'Your dashboard displays an **Assigned Students** table with all students under your supervision. You can also navigate to **Faculty Supervision > Assigned Students** for detailed tracking including:\n\n• Student name and contact\n• Internship company details\n• Progress status\n• Document submissions\n• Visit history',
    summary: 'Viewing assigned students',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['assigned', 'students', 'view', 'list'],
  },
  {
    title: 'How often must I visit students?',
    content: 'You must conduct at least **1 visit per month** for each assigned student. The total number of required visits equals the number of internship months. For a 6-month internship, you should complete 6 visits.',
    summary: 'Monthly visit requirement',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['visit', 'monthly', 'requirement', 'faculty'],
  },
  {
    title: 'What types of visits are allowed?',
    content: 'Three types of visits are permitted:\n\n• **Physical visits** - In-person visit to the internship site\n• **Virtual visits** - Video calls (Google Meet, Zoom, etc.)\n• **Telephonic visits** - Phone calls with student and/or supervisor\n\nAll visit types are equally valid but physical visits are recommended when feasible.',
    summary: 'Allowed visit types',
    category: 'INTERNSHIP_QUERIES' as SupportCategory,
    tags: ['visit', 'types', 'physical', 'virtual', 'telephonic'],
  },
  {
    title: 'How do I log a visit?',
    content: 'Navigate to **Faculty Supervision > Log Visits** to record visit details including:\n\n• Visit date and type\n• Student performance observations\n• Work environment assessment\n• Industry support evaluation\n• Any concerns or issues noted\n• Follow-up actions required',
    summary: 'Logging faculty visits',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['visit', 'log', 'record', 'faculty'],
  },
  {
    title: 'How do I handle student grievances?',
    content: 'Navigate to **Faculty Supervision > My Grievances** to view and respond to grievances assigned to you. For each grievance:\n\n1. Review the complaint details\n2. Investigate the issue\n3. Add your response/resolution\n4. Update the status accordingly\n\nEscalate serious issues to the Principal if needed.',
    summary: 'Handling student grievances',
    category: 'GENERAL_INQUIRIES' as SupportCategory,
    tags: ['grievance', 'handle', 'resolve', 'faculty'],
  },

  // ==========================================
  // PRINCIPAL FAQs
  // ==========================================
  {
    title: 'How is my Principal account created?',
    content: 'Principal accounts are created by the **State Directorate**. Login credentials are sent to your official email address. Contact the State Directorate support team if you haven\'t received your credentials.',
    summary: 'Principal account creation process',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['principal', 'account', 'creation', 'state-directorate'],
  },
  {
    title: 'What is my role as Principal in the system?',
    content: 'As Principal, you serve as the institutional leader responsible for:\n\n• Monitoring institutional performance across all students and faculty\n• Creating and managing staff accounts\n• Assigning faculty mentors to students\n• Handling escalated student grievances\n• Tracking institutional analytics and performance metrics\n• Resetting staff passwords when needed',
    summary: 'Principal role and responsibilities',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['principal', 'role', 'responsibilities', 'administration'],
  },
  {
    title: 'How do I create faculty accounts?',
    content: 'Navigate to **Administration > Create Staff** to create new faculty accounts. Enter required details:\n\n• Name and email\n• Designation and department\n• Contact information\n• Initial password\n\nCredentials will be sent to the faculty member\'s email.',
    summary: 'Creating faculty accounts',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['faculty', 'account', 'create', 'staff'],
  },
  {
    title: 'How do I assign students to faculty mentors?',
    content: 'Navigate to **Students > Mentor Assignment** to assign students to faculty supervisors. You can:\n\n• Select individual or multiple students\n• Choose the faculty mentor from dropdown\n• Bulk assign using filters\n\nConsider workload balance when making assignments.',
    summary: 'Assigning students to mentors',
    category: 'FEATURE_GUIDANCE' as SupportCategory,
    tags: ['assign', 'mentor', 'students', 'faculty'],
  },
  {
    title: 'How do I register students?',
    content: 'You have two options:\n\n• **Individual Registration:** Navigate to **Students > Register Student**\n• **Bulk Registration:** Navigate to **Students > Bulk Register Student** to upload an Excel file with multiple student records\n\nDownload the template for bulk upload to ensure correct format.',
    summary: 'Student registration options',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['student', 'register', 'individual', 'bulk'],
  },
  {
    title: 'Where can I view institutional performance metrics?',
    content: 'Navigate to **Internship Management > Analytics & Reports** to access comprehensive institutional analytics including:\n\n• Total students with active internships\n• Joining letter submission rates\n• Monthly report submission rates\n• Faculty visit completion rates\n• Grievance resolution rates\n• Overall internship completion rates',
    summary: 'Viewing institutional analytics',
    category: 'DATA_REPORTS' as SupportCategory,
    tags: ['analytics', 'metrics', 'performance', 'dashboard'],
  },

  // ==========================================
  // TECHNICAL SUPPORT FAQs
  // ==========================================
  {
    title: 'The page is not loading properly. What should I do?',
    content: 'Try these troubleshooting steps:\n\n1. Clear your browser cache and cookies\n2. Refresh the page (Ctrl + F5 or Cmd + Shift + R)\n3. Try a different browser\n4. Check your internet connection\n5. If the issue persists, submit a technical query through Help & Support\n\nInclude browser name and version in your report.',
    summary: 'Page loading troubleshooting steps',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['page', 'loading', 'troubleshoot', 'browser'],
  },
  {
    title: "I'm getting an error message. What should I do?",
    content: 'When encountering an error:\n\n1. Take a screenshot of the error message\n2. Note what action you were performing\n3. Navigate to **Help & Support > Submit Ticket**\n4. Provide detailed information including the screenshot\n5. Include your role, timestamp, and steps to reproduce\n\nThis helps our team diagnose and fix the issue faster.',
    summary: 'Reporting error messages',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['error', 'message', 'report', 'screenshot'],
  },
  {
    title: 'My uploaded file is not showing. What could be wrong?',
    content: 'Check these common issues:\n\n• **File size** - Exceeds the maximum limit (usually 5-10 MB)\n• **File format** - Not supported (use PDF, DOC, or DOCX)\n• **Internet connection** - Interrupted during upload\n• **Browser compatibility** - Try a different browser\n\nTry uploading again. If the problem persists, submit a technical query.',
    summary: 'File upload troubleshooting',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['file', 'upload', 'not-showing', 'troubleshoot'],
  },
  {
    title: 'I cannot log in. What should I do?',
    content: 'Verify the following:\n\n1. Correct username (Registration Number for students)\n2. Password entered correctly (check Caps Lock)\n3. Your account is active\n4. Correct portal URL: https://placeintern.com/login\n\nIf issues persist, contact your supervisor for account verification.',
    summary: 'Login troubleshooting',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['login', 'cannot', 'troubleshoot', 'access'],
  },
  {
    title: 'My account seems to be locked. What happened?',
    content: 'Accounts may be locked after **multiple failed login attempts** for security. Contact your immediate supervisor:\n\n• **Students:** Contact Faculty Mentor\n• **Faculty:** Contact Principal\n• **Principal:** Contact State Directorate\n\nThey can unlock your account and reset your password.',
    summary: 'Account lockout resolution',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['account', 'locked', 'security', 'unlock'],
  },
  {
    title: "I didn't receive my login credentials email. What should I do?",
    content: 'Check the following:\n\n1. **Spam/Junk folder** - Email might be filtered\n2. **Email address** - Verify it\'s correctly registered\n3. **Contact administrator** - Principal or State Directorate\n\nAsk them to resend credentials or verify your email address in the system.',
    summary: 'Missing credentials email',
    category: 'ACCOUNT_PROFILE' as SupportCategory,
    tags: ['credentials', 'email', 'not-received', 'spam'],
  },
  {
    title: 'What file types can I upload?',
    content: 'Generally accepted formats include:\n\n• **PDF** (.pdf) - Recommended for all documents\n• **Microsoft Word** (.doc, .docx)\n• **Images** (.jpg, .jpeg, .png) - For profile photos only\n\nCheck specific upload sections for any format restrictions.',
    summary: 'Accepted file formats',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['file', 'types', 'format', 'upload'],
  },
  {
    title: 'What is the maximum file size for uploads?',
    content: 'File size limits vary by document type:\n\n• **Documents:** 5-10 MB maximum\n• **Images:** 2-5 MB maximum\n\nIf your file is too large:\n• Compress the PDF using online tools\n• Save images at lower resolution\n• Split large documents into multiple files',
    summary: 'File size limits',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['file', 'size', 'maximum', 'limit'],
  },
  {
    title: 'The portal is running slowly. How can I improve performance?',
    content: 'Try these steps:\n\n1. Close unnecessary browser tabs\n2. Clear browser cache and cookies\n3. Disable browser extensions temporarily\n4. Check your internet speed\n5. Try accessing during off-peak hours\n6. Update your browser to the latest version\n\nIf slowness persists, report it through Help & Support.',
    summary: 'Performance optimization tips',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['slow', 'performance', 'speed', 'optimize'],
  },
  {
    title: 'Can I access the portal from my mobile phone?',
    content: 'Yes, the portal is accessible from mobile browsers. For best experience:\n\n• Use Chrome or Safari on mobile devices\n• Some features work better on desktop\n• Consider using landscape mode for complex tables\n\nFor critical tasks, desktop access is recommended.',
    summary: 'Mobile device accessibility',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['mobile', 'phone', 'access', 'browser'],
  },
  {
    title: 'Who do I contact for urgent technical issues?',
    content: 'For urgent technical issues:\n\n1. Submit a **HIGH priority** ticket through Help & Support\n2. Email **dtepunjab.internship@gmail.com** with "URGENT" in subject\n3. Contact your immediate supervisor (Faculty Mentor or Principal)\n\nProvide complete details for faster resolution.',
    summary: 'Urgent technical support contact',
    category: 'TECHNICAL_ISSUES' as SupportCategory,
    tags: ['urgent', 'contact', 'emergency', 'support'],
  },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function main() {
  console.log('🌱 Starting FAQ Seed...\n');

  // Find a STATE_DIRECTORATE user to be the author
  let author = await prisma.user.findFirst({
    where: { role: 'STATE_DIRECTORATE' },
  });

  if (!author) {
    console.log('⚠️  No STATE_DIRECTORATE user found. Creating a default one...');
    author = await prisma.user.create({
      data: {
        email: 'faq-author@placeintern.com',
        password: 'hashed-password-placeholder',
        name: 'FAQ System',
        role: 'STATE_DIRECTORATE',
        active: true,
      },
    });
  }

  console.log(`📝 Using author: ${author.name} (${author.email})\n`);

  // Delete existing FAQs
  const deletedCount = await prisma.fAQArticle.deleteMany({});
  console.log(`🗑️  Deleted ${deletedCount.count} existing FAQ articles.\n`);

  // Create FAQs
  let createdCount = 0;
  const errors: string[] = [];

  for (const faq of faqData) {
    const slug = generateSlug(faq.title);

    try {
      // Check if slug already exists
      const existing = await prisma.fAQArticle.findUnique({
        where: { slug },
      });

      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      await prisma.fAQArticle.create({
        data: {
          title: faq.title,
          content: faq.content,
          summary: faq.summary,
          category: faq.category,
          tags: faq.tags,
          slug: finalSlug,
          isPublished: true,
          authorId: author.id,
          viewCount: Math.floor(Math.random() * 100),
          helpfulCount: Math.floor(Math.random() * 20),
        },
      });
      createdCount++;
      console.log(`✅ Created: ${faq.title}`);
    } catch (error: any) {
      errors.push(`${faq.title}: ${error.message}`);
      console.error(`❌ Failed: ${faq.title} - ${error.message}`);
    }
  }

  console.log(`\n🎉 FAQ Seeding Complete!`);
  console.log(`   Created: ${createdCount} articles`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    errors.forEach((e) => console.log(`   - ${e}`));
  }

  // Print category breakdown
  const categoryStats = await prisma.fAQArticle.groupBy({
    by: ['category'],
    _count: true,
  });

  console.log('\n📊 FAQ Category Distribution:');
  categoryStats.forEach((stat) => {
    console.log(`   ${stat.category}: ${stat._count} articles`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
