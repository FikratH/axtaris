import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_PASSWORD = 'AxtarisSeed2026!';
const PLACEHOLDER_URL = 'https://your-project.supabase.co';
const PLACEHOLDER_ANON = 'your-anon-key';

function loadEnvFile(fileName) {
  const path = resolve(process.cwd(), fileName);
  if (!existsSync(path)) return;

  const content = readFileSync(path, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...rest] = trimmed.split('=');
    if (process.env[key]) continue;

    const rawValue = rest.join('=').trim();
    process.env[key] = rawValue.replace(/^["']|["']$/g, '');
  }
}

function assertEnv(name, placeholder) {
  const value = process.env[name]?.trim();

  if (!value || value === placeholder) {
    throw new Error(`${name} is missing or still set to a placeholder`);
  }

  return value;
}

function uuidFor(key) {
  const hex = createHash('sha1').update(`axtaris-real-seed:${key}`).digest('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function visibilityScore(plan) {
  if (plan === 'premium') return 30;
  if (plan === 'pro') return 12;
  return 0;
}

function subscriptionPrice(plan) {
  if (plan === 'premium') return 25;
  if (plan === 'pro') return 5;
  return 0;
}

async function requireOk(label, promise) {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function listAllUsers(admin) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth list users: ${error.message}`);

    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

async function upsertAuthUser(admin, existingUsers, seedUser, password) {
  const metadata = {
    role: seedUser.role,
    full_name: seedUser.fullName,
    phone: seedUser.phone,
    avatar_url: seedUser.avatarUrl,
  };
  const existing = existingUsers.find((user) => user.email?.toLowerCase() === seedUser.email.toLowerCase());

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error) throw new Error(`auth update ${seedUser.email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: seedUser.email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) throw new Error(`auth create ${seedUser.email}: ${error.message}`);
  existingUsers.push(data.user);
  return data.user;
}

const users = [
  {
    localId: '1',
    email: 'ali@example.com',
    role: 'candidate',
    fullName: 'Əli Həsənov',
    phone: '+994501234567',
    avatarUrl: 'https://www.corporatephotographylondon.com/wp-content/uploads/2019/11/HKstrategies-1210-1024x683.jpg',
    candidatePlan: 'free',
  },
  {
    localId: '11',
    email: 'nigar.aliyeva@example.com',
    role: 'candidate',
    fullName: 'Nigar Əliyeva',
    phone: '+994551112233',
    avatarUrl: 'https://thumbs.dreamstime.com/b/profile-picture-smiling-male-employee-posing-workplace-close-up-headshot-portrait-smiling-caucasian-businessman-look-190961990.jpg',
    candidatePlan: 'premium',
  },
  {
    localId: '12',
    email: 'ramin.guliyev@example.com',
    role: 'candidate',
    fullName: 'Ramin Quliyev',
    phone: '+994555556677',
    avatarUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTqIZXTe5iRAKg6-DVQypvrm1wuVQtUxsAX1Q&s',
    candidatePlan: 'pro',
  },
  {
    localId: '13',
    email: 'ayten.muradova@example.com',
    role: 'candidate',
    fullName: 'Aytən Muradova',
    phone: '+994557778899',
    avatarUrl: 'https://images.template.net/547749/Employee-Profile-Picture-Template-edit-online.webp',
    candidatePlan: 'free',
  },
  {
    localId: '2',
    email: 'hr@azercell.com',
    role: 'employer',
    fullName: 'Leyla Məmmədova',
    phone: '+994502345678',
    avatarUrl: 'https://thumbs.dreamstime.com/b/profile-picture-caucasian-male-employee-posing-office-happy-young-worker-look-camera-workplace-headshot-portrait-smiling-190186649.jpg',
  },
  {
    localId: '3',
    email: 'hr+azercell@axtaris.az',
    role: 'employer',
    fullName: 'Azercell HR',
    phone: '+994502000003',
  },
  {
    localId: '4',
    email: 'hr+pasha@axtaris.az',
    role: 'employer',
    fullName: 'PASHA Holding HR',
    phone: '+994502000004',
  },
  {
    localId: '5',
    email: 'hr+abb@axtaris.az',
    role: 'employer',
    fullName: 'ABB HR',
    phone: '+994502000005',
  },
  {
    localId: '6',
    email: 'hr+bravo@axtaris.az',
    role: 'employer',
    fullName: 'Bravo HR',
    phone: '+994502000006',
  },
];

const candidateProfiles = [
  {
    localId: '1',
    userLocalId: '1',
    title: 'Senior Frontend Developer',
    bio: 'Passionate software engineer with 4+ years of experience building modern web and mobile applications.',
    location: 'Bakı',
    expectedSalary: 3000,
    salaryCurrency: 'AZN',
    skills: ['React', 'TypeScript', 'Node.js', 'React Native', 'GraphQL', 'PostgreSQL'],
    portfolioUrl: 'https://alihasanov.dev',
    availability: 'two_weeks',
    workPreference: 'hybrid',
    profileCompleteness: 85,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
    workExperience: [
      {
        id: uuidFor('work-experience:1:1'),
        jobTitle: 'Senior Frontend Developer',
        company: 'Kapital Bank',
        location: 'Bakı',
        startDate: '2022-06-01',
        isCurrent: true,
        description: 'Led the development of the mobile banking application using React Native.',
        highlights: ['Increased app performance by 40%', 'Led team of 5 developers'],
      },
      {
        id: uuidFor('work-experience:1:2'),
        jobTitle: 'Frontend Developer',
        company: 'Pasha Holding',
        location: 'Bakı',
        startDate: '2020-03-01',
        endDate: '2022-05-31',
        isCurrent: false,
        description: 'Developed internal corporate tools and customer-facing web applications.',
      },
    ],
    education: [
      {
        id: uuidFor('education:1:1'),
        degree: 'Bakalavr',
        fieldOfStudy: 'Kompüter Elmləri',
        institution: 'Bakı Dövlət Universiteti',
        startDate: '2016-09-01',
        endDate: '2020-06-30',
        isCurrent: false,
      },
    ],
    languages: [
      { id: uuidFor('language:1:1'), language: 'Azərbaycan dili', level: 'native' },
      { id: uuidFor('language:1:2'), language: 'English', level: 'advanced' },
      { id: uuidFor('language:1:3'), language: 'Русский', level: 'intermediate' },
    ],
    certifications: [
      {
        id: uuidFor('certification:1:1'),
        name: 'AWS Solutions Architect',
        issuer: 'Amazon Web Services',
        issueDate: '2023-06-01',
      },
    ],
  },
  {
    localId: '11',
    userLocalId: '11',
    title: 'Senior DevOps Engineer',
    bio: 'Cloud and infrastructure engineer focused on scalable deployment pipelines.',
    location: 'Bakı',
    expectedSalary: 4200,
    salaryCurrency: 'AZN',
    skills: ['AWS', 'Terraform', 'Kubernetes', 'CI/CD', 'Linux'],
    availability: 'two_weeks',
    workPreference: 'remote',
    profileCompleteness: 92,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
    workExperience: [],
    education: [],
    languages: [],
    certifications: [],
  },
  {
    localId: '12',
    userLocalId: '12',
    title: 'Backend Engineer',
    bio: 'Backend engineer building resilient APIs and data-heavy systems.',
    location: 'Sumqayıt',
    expectedSalary: 3300,
    salaryCurrency: 'AZN',
    skills: ['Node.js', 'PostgreSQL', 'GraphQL', 'Docker', 'Redis'],
    availability: 'one_month',
    workPreference: 'hybrid',
    profileCompleteness: 88,
    createdAt: '2024-02-03T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
    workExperience: [],
    education: [],
    languages: [],
    certifications: [],
  },
  {
    localId: '13',
    userLocalId: '13',
    title: 'Product Designer',
    bio: 'Designer focused on product usability and premium mobile experiences.',
    location: 'Gəncə',
    expectedSalary: 2600,
    salaryCurrency: 'AZN',
    skills: ['Figma', 'Design Systems', 'UX Research', 'Prototyping', 'Mobile UI'],
    availability: 'immediate',
    workPreference: 'remote',
    profileCompleteness: 90,
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
    workExperience: [],
    education: [],
    languages: [],
    certifications: [],
  },
];

const companies = [
  {
    localId: '1',
    name: 'Kapital Bank',
    industry: 'Maliyyə',
    description: 'Azərbaycanın aparıcı bankı. Müasir rəqəmsal bank xidmətləri və innovativ maliyyə həlləri.',
    logoUrl: 'https://habrastorage.org/getpro/moikrug/uploads/company/100/007/831/1/logo/medium_4cbbb4549ce92e5c6b3b9b341ccb85cb.png',
    website: 'https://kapitalbank.az',
    employeeCount: '1000-5000',
    location: 'Bakı',
    foundedYear: 1997,
    verificationStatus: 'verified',
    rating: 4.5,
    ownerLocalId: '2',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '2',
    name: 'Azercell',
    industry: 'Telekommunikasiya',
    description: 'Azərbaycanın ən böyük mobil operator şirkəti.',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsztcc-hBegyyoYfswjrrycf1WNOImwQCR9A&s',
    website: 'https://azercell.com',
    employeeCount: '1000-5000',
    location: 'Bakı',
    foundedYear: 1996,
    verificationStatus: 'verified',
    rating: 4.3,
    ownerLocalId: '3',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '3',
    name: 'PASHA Holding',
    industry: 'Holdinq',
    description: 'Azərbaycanın aparıcı investisiya holdinqi.',
    logoUrl: 'https://pasha-holding.az/site/templates/images/share.png',
    website: 'https://pashaholding.az',
    employeeCount: '5000+',
    location: 'Bakı',
    foundedYear: 2006,
    verificationStatus: 'verified',
    rating: 4.7,
    ownerLocalId: '4',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '4',
    name: 'ABB',
    industry: 'Maliyyə',
    description: 'Azərbaycan Beynəlxalq Bankı - ölkənin ən böyük dövlət bankı.',
    logoUrl: 'https://igrtzfvphltnoiwedbtz.supabase.co/storage/v1/object/public/images/companies/1755687147529-lq1vnwq1ymh.svg',
    website: 'https://abb-bank.az',
    employeeCount: '1000-5000',
    location: 'Bakı',
    foundedYear: 1992,
    verificationStatus: 'verified',
    rating: 4.1,
    ownerLocalId: '5',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '5',
    name: 'Bravo Supermarket',
    industry: 'Pərakəndə satış',
    description: 'Azərbaycanın aparıcı supermarket şəbəkəsi.',
    logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Bravo_Supermarketl%C9%99r_%C5%9E%C9%99b%C9%99k%C9%99si.jpg',
    website: 'https://bravo.az',
    employeeCount: '1000-5000',
    location: 'Bakı',
    foundedYear: 2007,
    verificationStatus: 'verified',
    rating: 3.9,
    ownerLocalId: '6',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
];

const vacancies = [
  {
    localId: '1',
    title: 'Senior React Native Developer',
    description: 'We are looking for an experienced React Native developer to join our mobile banking team. You will be responsible for building and maintaining our flagship mobile application.',
    requirements: ['4+ years React Native experience', 'Strong TypeScript skills', 'Experience with state management', 'Knowledge of native modules', 'CI/CD experience'],
    responsibilities: ['Develop and maintain mobile application', 'Code review and mentoring', 'Collaborate with design team', 'Performance optimization', 'Write unit and integration tests'],
    benefits: ['Competitive salary', 'Health insurance', 'Remote work options', 'Professional development budget', 'Team building events'],
    salaryMin: 2500,
    salaryMax: 4000,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'hybrid',
    experienceLevel: 'senior',
    skills: ['React Native', 'TypeScript', 'Redux', 'Jest', 'CI/CD'],
    companyLocalId: '1',
    status: 'active',
    applicantCount: 24,
    viewCount: 156,
    responseRate: 78,
    createdAt: '2024-03-05T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '2',
    title: 'Product Manager',
    description: 'Join Azercell as a Product Manager and help shape the future of telecommunications in Azerbaijan.',
    requirements: ['3+ years product management experience', 'Strong analytical skills', 'Excellent communication', 'Agile methodology knowledge', 'Telecom industry experience preferred'],
    responsibilities: ['Define product roadmap', 'Conduct market research', 'Work with engineering teams', 'Analyze metrics and KPIs', 'Stakeholder management'],
    benefits: ['Competitive package', 'Corporate phone plan', 'Flexible hours', 'International training', 'Performance bonuses'],
    salaryMin: 2000,
    salaryMax: 3500,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'onsite',
    experienceLevel: 'mid',
    skills: ['Product Management', 'Agile', 'Analytics', 'Communication', 'Strategy'],
    companyLocalId: '2',
    status: 'active',
    applicantCount: 45,
    viewCount: 320,
    responseRate: 65,
    createdAt: '2024-03-03T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '3',
    title: 'UI/UX Designer',
    description: 'PASHA Holding is seeking a talented UI/UX Designer to create world-class digital experiences across our portfolio companies.',
    requirements: ['3+ years UI/UX design experience', 'Proficiency in Figma', 'Strong portfolio', 'Understanding of design systems', 'Mobile design experience'],
    responsibilities: ['Design mobile and web interfaces', 'Create and maintain design system', 'Conduct user research', 'Prototype and test designs', 'Collaborate with developers'],
    benefits: ['Premium salary', 'Health & dental insurance', 'Gym membership', 'Learning budget', 'Stock options'],
    salaryMin: 1800,
    salaryMax: 3000,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'hybrid',
    experienceLevel: 'mid',
    skills: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'Design Systems'],
    companyLocalId: '3',
    status: 'active',
    applicantCount: 38,
    viewCount: 280,
    responseRate: 72,
    createdAt: '2024-03-01T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '4',
    title: 'Backend Developer (Node.js)',
    description: 'ABB is looking for a skilled Backend Developer to build and scale our digital banking infrastructure.',
    requirements: ['3+ years Node.js experience', 'PostgreSQL/MongoDB', 'REST & GraphQL APIs', 'Docker & Kubernetes', 'Security best practices'],
    responsibilities: ['Build microservices', 'Database design and optimization', 'API development', 'System monitoring', 'Documentation'],
    benefits: ['Competitive salary', 'Insurance package', 'Parking', 'Cafeteria', 'Career growth'],
    salaryMin: 2000,
    salaryMax: 3500,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'onsite',
    experienceLevel: 'mid',
    skills: ['Node.js', 'PostgreSQL', 'Docker', 'TypeScript', 'GraphQL'],
    companyLocalId: '4',
    status: 'active',
    applicantCount: 19,
    viewCount: 145,
    responseRate: 80,
    createdAt: '2024-03-07T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '5',
    title: 'Data Analyst',
    description: 'Join Bravo as a Data Analyst and help us make data-driven decisions across our retail operations.',
    requirements: ['2+ years data analysis experience', 'SQL proficiency', 'Python/R knowledge', 'BI tools experience', 'Retail industry understanding'],
    responsibilities: ['Analyze sales and customer data', 'Create dashboards and reports', 'Support business decisions', 'Data quality assurance', 'Present findings to stakeholders'],
    benefits: ['Good salary', 'Employee discount', 'Health insurance', 'Transport support', 'Meal allowance'],
    salaryMin: 1200,
    salaryMax: 2000,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'onsite',
    experienceLevel: 'junior',
    skills: ['SQL', 'Python', 'Power BI', 'Excel', 'Statistics'],
    companyLocalId: '5',
    status: 'active',
    applicantCount: 52,
    viewCount: 410,
    responseRate: 55,
    createdAt: '2024-03-08T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '6',
    title: 'DevOps Engineer',
    description: 'Kapital Bank is looking for a DevOps Engineer to enhance our CI/CD pipelines and cloud infrastructure.',
    requirements: ['3+ years DevOps experience', 'AWS/Azure/GCP', 'Terraform/Ansible', 'Docker & Kubernetes', 'Linux administration'],
    responsibilities: ['Manage cloud infrastructure', 'Build CI/CD pipelines', 'Monitor system health', 'Security hardening', 'Disaster recovery planning'],
    benefits: ['Top market salary', 'Full insurance', 'Remote-first', 'Conference budget', 'Stock options'],
    salaryMin: 2800,
    salaryMax: 4500,
    salaryCurrency: 'AZN',
    showSalary: true,
    city: 'Bakı',
    workType: 'remote',
    experienceLevel: 'senior',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Linux'],
    companyLocalId: '1',
    status: 'active',
    applicantCount: 15,
    viewCount: 98,
    responseRate: 85,
    createdAt: '2024-03-09T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
];

const applications = [
  {
    localId: '1',
    vacancyLocalId: '1',
    candidateProfileLocalId: '1',
    status: 'reviewed',
    subscriptionPlan: 'free',
    employerNotes: 'Looks aligned for mobile banking; confirm Expo and Supabase depth.',
    employerRating: 4,
    appliedAt: '2024-03-06T10:00:00Z',
    reviewedAt: '2024-03-08T10:00:00Z',
    updatedAt: '2024-03-08T10:00:00Z',
  },
  {
    localId: '2',
    vacancyLocalId: '3',
    candidateProfileLocalId: '1',
    status: 'pending',
    subscriptionPlan: 'pro',
    appliedAt: '2024-03-09T10:00:00Z',
    updatedAt: '2024-03-09T10:00:00Z',
  },
  {
    localId: '3',
    vacancyLocalId: '5',
    candidateProfileLocalId: '1',
    status: 'shortlisted',
    subscriptionPlan: 'premium',
    appliedAt: '2024-03-08T10:00:00Z',
    reviewedAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
  {
    localId: '4',
    vacancyLocalId: '1',
    candidateProfileLocalId: '11',
    status: 'pending',
    subscriptionPlan: 'premium',
    appliedAt: '2024-03-10T09:00:00Z',
    updatedAt: '2024-03-10T09:00:00Z',
  },
  {
    localId: '5',
    vacancyLocalId: '6',
    candidateProfileLocalId: '12',
    status: 'shortlisted',
    subscriptionPlan: 'pro',
    employerNotes: 'Strong cloud background. Schedule technical interview.',
    employerRating: 5,
    appliedAt: '2024-03-09T14:30:00Z',
    reviewedAt: '2024-03-10T11:00:00Z',
    updatedAt: '2024-03-10T11:00:00Z',
  },
  {
    localId: '6',
    vacancyLocalId: '1',
    candidateProfileLocalId: '13',
    status: 'reviewed',
    subscriptionPlan: 'free',
    appliedAt: '2024-03-08T16:45:00Z',
    reviewedAt: '2024-03-09T09:30:00Z',
    updatedAt: '2024-03-09T09:30:00Z',
  },
];

const candidateNotifications = [
  {
    localId: '1',
    userLocalId: '1',
    type: 'application_update',
    title: 'Müraciətiniz baxıldı',
    body: 'Kapital Bank - Senior React Native Developer vakansiyasına müraciətiniz baxıldı.',
    data: { applicationLocalId: '1', vacancyLocalId: '1' },
    read: false,
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    localId: '2',
    userLocalId: '1',
    type: 'new_job_match',
    title: 'Yeni uyğun vakansiya',
    body: 'Azercell şirkətində sizə uyğun yeni vakansiya var.',
    data: { vacancyLocalId: '2' },
    read: false,
    createdAt: '2024-03-10T08:00:00Z',
  },
  {
    localId: '3',
    userLocalId: '1',
    type: 'profile_reminder',
    title: 'Profilinizi tamamlayın',
    body: 'Profiliniz 85% tamamlanıb. Daha çox vakansiyaya uyğun gəlmək üçün tamamlayın.',
    read: true,
    createdAt: '2024-03-09T10:00:00Z',
  },
  {
    localId: '4',
    userLocalId: '1',
    type: 'application_update',
    title: 'Seçilmişlərə əlavə olundunuz',
    body: 'Bravo - Data Analyst vakansiyası üçün seçilmişlərə əlavə olundunuz.',
    data: { applicationLocalId: '3', vacancyLocalId: '5' },
    read: true,
    createdAt: '2024-03-09T08:00:00Z',
  },
];

const employerNotifications = [
  {
    localId: 'e1',
    userLocalId: '2',
    type: 'new_application',
    title: 'Yeni müraciət',
    body: 'Senior React Native Developer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyLocalId: '1' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    localId: 'e2',
    userLocalId: '2',
    type: 'new_application',
    title: 'Yeni müraciət',
    body: 'DevOps Engineer vakansiyasına yeni müraciət daxil oldu.',
    data: { vacancyLocalId: '6' },
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    localId: 'e3',
    userLocalId: '2',
    type: 'company_verification',
    title: 'Şirkət təsdiqləndi',
    body: 'Kapital Bank şirkəti uğurla təsdiqləndi.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    localId: 'e4',
    userLocalId: '2',
    type: 'vacancy_moderation',
    title: 'Vakansiya təsdiqləndi',
    body: 'Senior React Native Developer vakansiyası dərc edildi.',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

loadEnvFile('.env.local');
loadEnvFile('.env');

const supabaseUrl = assertEnv('EXPO_PUBLIC_SUPABASE_URL', PLACEHOLDER_URL);
assertEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY', PLACEHOLDER_ANON);
const secretKey = assertEnv('SUPABASE_SERVICE_ROLE_KEY');
const seedPassword = process.env.SUPABASE_SEED_PASSWORD?.trim() || DEFAULT_PASSWORD;
const admin = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const userIdByLocalId = new Map();
const candidateProfileIdByLocalId = new Map();
const companyIdByLocalId = new Map();
const vacancyIdByLocalId = new Map();
const applicationIdByLocalId = new Map();
const existingUsers = await listAllUsers(admin);

for (const seedUser of users) {
  const authUser = await upsertAuthUser(admin, existingUsers, seedUser, seedPassword);
  userIdByLocalId.set(seedUser.localId, authUser.id);

  await requireOk(
    `profile upsert ${seedUser.email}`,
    admin.from('profiles').upsert(
      {
        id: authUser.id,
        email: seedUser.email,
        role: seedUser.role,
        full_name: seedUser.fullName,
        phone: seedUser.phone ?? null,
        avatar_url: seedUser.avatarUrl ?? null,
        email_verified: true,
        is_active: true,
        created_at: seedUser.createdAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )
  );
}

for (const profile of candidateProfiles) {
  const userId = userIdByLocalId.get(profile.userLocalId);
  const row = await requireOk(
    `candidate profile upsert ${profile.localId}`,
    admin
      .from('candidate_profiles')
      .upsert(
        {
          user_id: userId,
          title: profile.title,
          bio: profile.bio,
          location: profile.location,
          expected_salary: profile.expectedSalary,
          salary_currency: profile.salaryCurrency,
          skills: profile.skills,
          availability: profile.availability,
          work_preference: profile.workPreference,
          portfolio_url: profile.portfolioUrl ?? null,
          cv_url: profile.cvUrl ?? null,
          cv_file_name: profile.cvFileName ?? null,
          profile_completeness: profile.profileCompleteness,
          created_at: profile.createdAt,
          updated_at: profile.updatedAt,
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single()
  );
  candidateProfileIdByLocalId.set(profile.localId, row.id);
}

const candidateUserIds = users.filter((user) => user.role === 'candidate').map((user) => userIdByLocalId.get(user.localId));
const candidateProfileIds = [...candidateProfileIdByLocalId.values()];

await requireOk('delete seed candidate subscriptions', admin.from('candidate_subscriptions').delete().in('user_id', candidateUserIds));
await requireOk('delete seed saved jobs', admin.from('saved_jobs').delete().in('user_id', candidateUserIds));
await requireOk('delete seed work experiences', admin.from('work_experiences').delete().in('candidate_id', candidateProfileIds));
await requireOk('delete seed education', admin.from('education').delete().in('candidate_id', candidateProfileIds));
await requireOk('delete seed language skills', admin.from('language_skills').delete().in('candidate_id', candidateProfileIds));
await requireOk('delete seed certifications', admin.from('certifications').delete().in('candidate_id', candidateProfileIds));

await requireOk(
  'insert seed candidate subscriptions',
  admin.from('candidate_subscriptions').insert(
    users
      .filter((user) => user.role === 'candidate')
      .map((user) => ({
        id: uuidFor(`subscription:${user.localId}`),
        user_id: userIdByLocalId.get(user.localId),
        plan: user.candidatePlan,
        status: 'active',
        price_amount: subscriptionPrice(user.candidatePlan),
        price_currency: 'AZN',
        billing_interval: 'month',
        started_at: '2024-03-01T00:00:00Z',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-10T10:00:00Z',
      }))
  )
);

for (const profile of candidateProfiles) {
  const candidateId = candidateProfileIdByLocalId.get(profile.localId);

  if (profile.workExperience.length > 0) {
    await requireOk(
      `insert work experiences ${profile.localId}`,
      admin.from('work_experiences').insert(
        profile.workExperience.map((item, index) => ({
          id: item.id,
          candidate_id: candidateId,
          job_title: item.jobTitle,
          company: item.company,
          location: item.location ?? null,
          start_date: item.startDate,
          end_date: item.endDate ?? null,
          is_current: item.isCurrent,
          description: item.description ?? null,
          highlights: item.highlights ?? [],
          sort_order: index,
        }))
      )
    );
  }

  if (profile.education.length > 0) {
    await requireOk(
      `insert education ${profile.localId}`,
      admin.from('education').insert(
        profile.education.map((item, index) => ({
          id: item.id,
          candidate_id: candidateId,
          degree: item.degree,
          field_of_study: item.fieldOfStudy,
          institution: item.institution,
          start_date: item.startDate,
          end_date: item.endDate ?? null,
          is_current: item.isCurrent,
          description: item.description ?? null,
          sort_order: index,
        }))
      )
    );
  }

  if (profile.languages.length > 0) {
    await requireOk(
      `insert language skills ${profile.localId}`,
      admin.from('language_skills').insert(
        profile.languages.map((item) => ({
          id: item.id,
          candidate_id: candidateId,
          language: item.language,
          level: item.level,
        }))
      )
    );
  }

  if (profile.certifications.length > 0) {
    await requireOk(
      `insert certifications ${profile.localId}`,
      admin.from('certifications').insert(
        profile.certifications.map((item) => ({
          id: item.id,
          candidate_id: candidateId,
          name: item.name,
          issuer: item.issuer,
          issue_date: item.issueDate,
          expiry_date: item.expiryDate ?? null,
          credential_url: item.credentialUrl ?? null,
        }))
      )
    );
  }
}

for (const company of companies) {
  const companyId = uuidFor(`company:${company.localId}`);
  companyIdByLocalId.set(company.localId, companyId);

  await requireOk(
    `company upsert ${company.name}`,
    admin.from('companies').upsert(
      {
        id: companyId,
        name: company.name,
        industry: company.industry,
        description: company.description,
        logo_url: company.logoUrl,
        website: company.website,
        employee_count: company.employeeCount,
        location: company.location,
        founded_year: company.foundedYear,
        verification_status: company.verificationStatus,
        rating: company.rating,
        owner_id: userIdByLocalId.get(company.ownerLocalId),
        created_at: company.createdAt,
        updated_at: company.updatedAt,
      },
      { onConflict: 'id' }
    )
  );

  await requireOk(
    `employer profile upsert ${company.name}`,
    admin.from('employer_profiles').upsert(
      {
        user_id: userIdByLocalId.get(company.ownerLocalId),
        company_id: companyId,
        position: 'HR Manager',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
  );
}

for (const vacancy of vacancies) {
  const vacancyId = uuidFor(`vacancy:${vacancy.localId}`);
  vacancyIdByLocalId.set(vacancy.localId, vacancyId);

  await requireOk(
    `vacancy upsert ${vacancy.title}`,
    admin.from('vacancies').upsert(
      {
        id: vacancyId,
        title: vacancy.title,
        description: vacancy.description,
        requirements: vacancy.requirements,
        responsibilities: vacancy.responsibilities,
        benefits: vacancy.benefits,
        salary_min: vacancy.salaryMin,
        salary_max: vacancy.salaryMax,
        salary_currency: vacancy.salaryCurrency,
        show_salary: vacancy.showSalary,
        city: vacancy.city,
        work_type: vacancy.workType,
        experience_level: vacancy.experienceLevel,
        skills: vacancy.skills,
        company_id: companyIdByLocalId.get(vacancy.companyLocalId),
        status: vacancy.status,
        applicant_count: vacancy.applicantCount,
        view_count: vacancy.viewCount,
        response_rate: vacancy.responseRate,
        created_at: vacancy.createdAt,
        updated_at: vacancy.updatedAt,
      },
      { onConflict: 'id' }
    )
  );
}

for (const application of applications) {
  const applicationId = uuidFor(`application:${application.localId}`);
  applicationIdByLocalId.set(application.localId, applicationId);

  await requireOk(
    `application upsert ${application.localId}`,
    admin.from('applications').upsert(
      {
        id: applicationId,
        vacancy_id: vacancyIdByLocalId.get(application.vacancyLocalId),
        candidate_id: candidateProfileIdByLocalId.get(application.candidateProfileLocalId),
        status: application.status,
        subscription_plan: application.subscriptionPlan,
        visibility_score: visibilityScore(application.subscriptionPlan),
        cover_letter: application.coverLetter ?? null,
        cv_url: application.cvUrl ?? null,
        employer_notes: application.employerNotes ?? null,
        employer_rating: application.employerRating ?? null,
        applied_at: application.appliedAt,
        reviewed_at: application.reviewedAt ?? null,
        updated_at: application.updatedAt,
      },
      { onConflict: 'id' }
    )
  );

  await requireOk(
    `application metadata update ${application.localId}`,
    admin
      .from('applications')
      .update({
        subscription_plan: application.subscriptionPlan,
        visibility_score: visibilityScore(application.subscriptionPlan),
        employer_notes: application.employerNotes ?? null,
        employer_rating: application.employerRating ?? null,
        reviewed_at: application.reviewedAt ?? null,
        updated_at: application.updatedAt,
      })
      .eq('id', applicationId)
  );
}

await requireOk(
  'insert saved jobs',
  admin.from('saved_jobs').insert([
    {
      id: uuidFor('saved-job:1:1'),
      user_id: userIdByLocalId.get('1'),
      vacancy_id: vacancyIdByLocalId.get('1'),
      saved_at: '2024-03-10T07:30:00Z',
    },
    {
      id: uuidFor('saved-job:1:3'),
      user_id: userIdByLocalId.get('1'),
      vacancy_id: vacancyIdByLocalId.get('3'),
      saved_at: '2024-03-09T07:30:00Z',
    },
  ])
);

for (const vacancy of vacancies) {
  await requireOk(
    `vacancy count reset ${vacancy.localId}`,
    admin
      .from('vacancies')
      .update({ applicant_count: vacancy.applicantCount, view_count: vacancy.viewCount, response_rate: vacancy.responseRate })
      .eq('id', vacancyIdByLocalId.get(vacancy.localId))
  );
}

const allSeedUserIds = users.map((user) => userIdByLocalId.get(user.localId));
await requireOk('delete seed notifications', admin.from('notifications').delete().in('user_id', allSeedUserIds));

const notificationRows = [...candidateNotifications, ...employerNotifications].map((notification) => {
  const data = { ...(notification.data ?? {}) };
  if (data.applicationLocalId) {
    data.applicationId = applicationIdByLocalId.get(data.applicationLocalId);
    delete data.applicationLocalId;
  }
  if (data.vacancyLocalId) {
    data.vacancyId = vacancyIdByLocalId.get(data.vacancyLocalId);
    delete data.vacancyLocalId;
  }

  return {
    id: uuidFor(`notification:${notification.localId}`),
    user_id: userIdByLocalId.get(notification.userLocalId),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data,
    read: notification.read,
    created_at: notification.createdAt,
  };
});

await requireOk('insert seed notifications', admin.from('notifications').insert(notificationRows));

const tables = ['profiles','candidate_profiles','employer_profiles','candidate_subscriptions','companies','vacancies','applications','saved_jobs','notifications','work_experiences','education','language_skills','certifications'];
const counts = {};
for (const table of tables) {
  const { count, error } = await admin.from(table).select('id', { head: true, count: 'exact' });
  if (error) throw new Error(`count ${table}: ${error.message}`);
  counts[table] = count;
}

console.log('Supabase real seed completed.');
console.log(`Seed password: ${seedPassword}`);
console.log('Seed accounts:');
for (const user of users) {
  console.log(`- ${user.email} (${user.role})`);
}
console.log('Seed counts:');
for (const [table, count] of Object.entries(counts)) {
  console.log(`- ${table}: ${count}`);
}
