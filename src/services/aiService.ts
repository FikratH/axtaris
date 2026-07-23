import i18n from '@/i18n';
import { CandidateProfile } from '@/types/models';
import { getSupabase, shouldUseMockBackend } from './supabase';

export interface AISuggestion {
  id: string;
  type: 'skill' | 'experience_rewrite' | 'profile_improvement' | 'bio';
  title: string;
  description: string;
  originalText?: string;
  suggestedText?: string;
  confidence: number;
}

export interface AIResumeResult {
  summary: string;
  highlights: string[];
  suggestedSkills: string[];
  improvedBio?: string;
}

/** Structured resume extracted from an uploaded CV by the parse-resume function. */
export interface ParsedResume {
  title?: string;
  bio?: string;
  skills: string[];
  experience: {
    jobTitle: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }[];
  education: {
    degree: string;
    fieldOfStudy: string;
    institution: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
  }[];
  languages: { language: string; level: string }[];
}

class AIService {
  async analyzeProfile(profile: CandidateProfile): Promise<AISuggestion[]> {
    await this.simulateDelay();

    const suggestions: AISuggestion[] = [];

    if (!profile.bio || profile.bio.length < 50) {
      suggestions.push({
        id: '1',
        type: 'bio',
        title: i18n.t('ai.suggestion.bioTitle'),
        description: i18n.t('ai.suggestion.bioDescription'),
        suggestedText: i18n.t('ai.suggestion.bioSuggested'),
        confidence: 0.9,
      });
    }

    if (profile.skills.length < 5) {
      suggestions.push({
        id: '2',
        type: 'skill',
        title: i18n.t('ai.suggestion.skillsTitle'),
        description: i18n.t('ai.suggestion.skillsDescription'),
        confidence: 0.85,
      });
    }

    if (profile.workExperience.length > 0) {
      const exp = profile.workExperience[0];
      if (!exp.highlights || exp.highlights.length === 0) {
        suggestions.push({
          id: '3',
          type: 'experience_rewrite',
          title: i18n.t('ai.suggestion.experienceTitle'),
          description: i18n.t('ai.suggestion.experienceDescription'),
          originalText: exp.description || '',
          suggestedText: `${exp.description || ''}\n\n${i18n.t('ai.suggestion.experienceTemplate')}`,
          confidence: 0.8,
        });
      }
    }

    if (profile.profileCompleteness < 90) {
      suggestions.push({
        id: '4',
        type: 'profile_improvement',
        title: i18n.t('ai.suggestion.profileTitle'),
        description: i18n.t('ai.suggestion.profileDescription', {
          completeness: profile.profileCompleteness,
        }),
        confidence: 0.95,
      });
    }

    return suggestions;
  }

  async suggestSkills(currentSkills: string[], jobTitle?: string): Promise<string[]> {
    // AI-first: ask the model for role-specific skills, fall back to templates.
    const ai = await this.callAssistant(
      'You suggest relevant professional skills. Return ONLY a comma-separated list of 8 skills — no numbering, no preamble, no extra words.',
      `Suggest 8 professional skills relevant to the job title "${jobTitle || 'professional'}". Already listed (do not repeat): ${currentSkills.join(', ') || 'none'}.`,
      120
    );
    if (ai) {
      const parsed = ai
        .split(/[,\n]/)
        .map((s) => s.replace(/^[-•\d.)\s]+/, '').trim())
        .filter(Boolean);
      const filtered = parsed.filter(
        (s) => !currentSkills.some((c) => c.toLowerCase() === s.toLowerCase())
      );
      if (filtered.length >= 3) return filtered.slice(0, 8);
    }

    await this.simulateDelay();

    const skillSuggestions: Record<string, string[]> = {
      default: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Leadership'],
      developer: ['Git', 'Agile', 'REST APIs', 'Testing', 'System Design', 'CI/CD'],
      designer: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Design Systems', 'Accessibility'],
      manager: ['Project Management', 'Stakeholder Management', 'Budgeting', 'Risk Management', 'Scrum'],
      analyst: ['SQL', 'Python', 'Data Visualization', 'Statistical Analysis', 'Excel', 'Power BI'],
    };

    const titleLower = (jobTitle || '').toLowerCase();
    let suggestions = skillSuggestions.default;

    if (titleLower.includes('develop') || titleLower.includes('engineer')) {
      suggestions = [...skillSuggestions.developer, ...skillSuggestions.default];
    } else if (titleLower.includes('design')) {
      suggestions = [...skillSuggestions.designer, ...skillSuggestions.default];
    } else if (titleLower.includes('manager') || titleLower.includes('lead')) {
      suggestions = [...skillSuggestions.manager, ...skillSuggestions.default];
    } else if (titleLower.includes('analyst') || titleLower.includes('data')) {
      suggestions = [...skillSuggestions.analyst, ...skillSuggestions.default];
    }

    return suggestions.filter((s) => !currentSkills.includes(s)).slice(0, 8);
  }

  async rewriteExperience(description: string): Promise<string> {
    const ai = await this.callAssistant(
      'You rewrite work-experience descriptions into 3-4 strong, quantified resume bullet points. Return only the bullets, each on its own line starting with "• ". No preamble, no markdown headers.',
      `Rewrite this into impactful resume bullet points:\n${description}`,
      250
    );
    if (ai) return ai;

    await this.simulateDelay();

    const bullets = description
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim();
        if (!cleaned.match(/^(Led|Developed|Implemented|Managed|Created|Designed|Built|Improved|Increased|Reduced)/i)) {
          return `• Spearheaded ${cleaned.charAt(0).toLowerCase()}${cleaned.slice(1)}`;
        }
        return `• ${cleaned}`;
      });

    return bullets.join('\n');
  }

  /**
   * Generate a professional bio via the ChatGPT proxy Edge Function.
   * Falls back to the localized template when AI is unavailable (mock mode,
   * function not deployed, or OPENAI_API_KEY not set).
   */
  async generateBio(profile: CandidateProfile): Promise<string> {
    const ai = await this.callAssistant(
      'You write concise, professional, first-person job-seeker bios. 2-3 sentences, no markdown, no surrounding quotes. Reply in the language that best matches the provided title and skills.',
      `Write a professional bio. Title: ${profile.title || 'professional'}. Location: ${profile.location || 'Azerbaijan'}. Skills: ${profile.skills.slice(0, 8).join(', ') || 'various'}. Years of experience entries: ${profile.workExperience.length}.`,
      180
    );
    return ai || i18n.t('ai.suggestion.bioSuggested');
  }

  /** A short, encouraging "why you fit" note for a vacancy (or null if AI is off). */
  async explainMatch(
    profile: CandidateProfile,
    vacancyTitle: string,
    matchedSkills: string[]
  ): Promise<string | null> {
    return this.callAssistant(
      'You write a 1-2 sentence encouraging note explaining why a candidate fits a job. Use second person ("You..."). No markdown.',
      `Job: ${vacancyTitle}. Candidate title: ${profile.title || 'professional'}. Matching skills: ${matchedSkills.join(', ') || 'several relevant skills'}.`,
      120
    );
  }

  /**
   * Translate free text into a target language via the ChatGPT proxy.
   * Returns null when AI is unavailable (mock mode / no key / not signed in).
   */
  async translateText(text: string, targetLanguageName: string): Promise<string | null> {
    const trimmed = text?.trim();
    if (!trimmed) return null;
    return this.callAssistant(
      `You are a professional translator. Translate the user's text into ${targetLanguageName}. Preserve meaning, tone, and line breaks exactly. If a line is already in ${targetLanguageName}, keep it. Return ONLY the translation — no preamble, no quotes, no notes.`,
      trimmed,
      Math.min(1200, Math.ceil(trimmed.length / 2) + 220)
    );
  }

  /**
   * Parse an uploaded CV (already in Storage) into a structured resume via the
   * parse-resume Edge Function. Returns null when AI is unavailable (mock mode,
   * function not deployed, no key, quota hit, unreadable/scanned file) so the
   * caller can silently skip autofill.
   */
  async parseResumeFromStorage(loc: {
    bucket: string;
    path: string;
    fileName?: string;
  }): Promise<ParsedResume | null> {
    if (shouldUseMockBackend()) return null;

    try {
      const { data, error } = await getSupabase().functions.invoke<{
        data?: ParsedResume;
        error?: string;
        code?: string;
      }>('parse-resume', { body: loc });
      if (error) return null;
      return (data?.data as ParsedResume) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Server-side ChatGPT call. Returns the model text, or null when AI is not
   * available so callers can fall back to their built-in behavior.
   */
  private async callAssistant(
    system: string,
    prompt: string,
    maxTokens = 400
  ): Promise<string | null> {
    if (shouldUseMockBackend()) return null;

    try {
      const { data, error } = await getSupabase().functions.invoke<{ text?: string; error?: string }>(
        'ai-assist',
        { body: { system, prompt, maxTokens } }
      );
      if (error) return null;
      const text = data?.text?.trim();
      return text && text.length > 0 ? text : null;
    } catch {
      return null;
    }
  }

  /** Generate a job-posting draft for a vacancy. Falls back to a template. */
  async generateJobDescription(input: {
    title: string;
    city?: string;
    workType?: string;
    skills?: string[];
    seniority?: string;
  }): Promise<{ description: string; requirements: string[]; responsibilities: string[] }> {
    const ai = await this.callAssistant(
      'You write clear job postings. Output THREE labeled sections separated by lines "DESCRIPTION:", "REQUIREMENTS:", "RESPONSIBILITIES:". Under REQUIREMENTS and RESPONSIBILITIES put one item per line starting with "- ". No markdown headers, no preamble.',
      `Role: ${input.title}. City: ${input.city || 'Baku'}. Work type: ${input.workType || 'full_time'}. Key skills: ${(input.skills || []).join(', ') || 'general'}. Seniority: ${input.seniority || 'mid'}.`,
      500
    );
    if (ai) {
      const parsed = this.parseJobSections(ai);
      if (parsed && parsed.description) return parsed;
    }

    await this.simulateDelay();
    const skills = input.skills && input.skills.length ? input.skills : ['relevant tools'];
    return {
      description: `We are looking for a ${input.title} to join our team${input.city ? ` in ${input.city}` : ''}. You will work with ${skills.slice(0, 3).join(', ')} and contribute to impactful projects.`,
      requirements: [
        `Experience as a ${input.title} or in a similar role`,
        `Proficiency in ${skills.slice(0, 4).join(', ')}`,
        'Strong communication and teamwork skills',
      ],
      responsibilities: [
        `Deliver high-quality work as a ${input.title}`,
        'Collaborate with cross-functional teammates',
        'Continuously improve processes and outcomes',
      ],
    };
  }

  private parseJobSections(
    text: string
  ): { description: string; requirements: string[]; responsibilities: string[] } | null {
    const dMatch = text.match(/DESCRIPTION:\s*([\s\S]*?)(?:REQUIREMENTS:|RESPONSIBILITIES:|$)/i);
    const rMatch = text.match(/REQUIREMENTS:\s*([\s\S]*?)(?:RESPONSIBILITIES:|$)/i);
    const oMatch = text.match(/RESPONSIBILITIES:\s*([\s\S]*)$/i);
    if (!dMatch) return null;
    const toList = (s?: string) =>
      (s || '')
        .split('\n')
        .map((l) => l.replace(/^[-•*\d.)\s]+/, '').trim())
        .filter(Boolean);
    return {
      description: dMatch[1].trim(),
      requirements: toList(rMatch?.[1]),
      responsibilities: toList(oMatch?.[1]),
    };
  }

  /** Draft a cover letter for a candidate applying to a vacancy. Fallback template. */
  async generateCoverLetter(input: {
    candidateName?: string;
    candidateTitle?: string;
    skills?: string[];
    vacancyTitle: string;
    companyName?: string;
  }): Promise<string> {
    const ai = await this.callAssistant(
      'You write concise, professional cover letters (120-160 words), first person, no markdown, no bracketed placeholders. Reply in the language of the job title.',
      `Write a cover letter. Applicant current title ${input.candidateTitle || 'professional'}, skills ${(input.skills || []).slice(0, 6).join(', ') || 'relevant skills'}. Applying for "${input.vacancyTitle}"${input.companyName ? ` at ${input.companyName}` : ''}.`,
      320
    );
    if (ai) return ai;

    await this.simulateDelay();
    return `Dear ${input.companyName || 'Hiring Team'},\n\nI am excited to apply for the ${input.vacancyTitle} role. As a ${input.candidateTitle || 'professional'} with experience in ${(input.skills || ['my field']).slice(0, 3).join(', ')}, I am confident I can contribute meaningfully to your team. I would welcome the opportunity to discuss how my background fits your needs.\n\nBest regards,\n${input.candidateName || ''}`.trim();
  }

  /**
   * Rank applicants by fit to a vacancy. Deterministic skill-overlap scoring
   * (always available; also the fallback if the model is off).
   */
  async rankApplicants(
    vacancy: { title: string; skills: string[] },
    applicants: { id: string; title?: string; skills: string[] }[]
  ): Promise<{ id: string; score: number; reason: string }[]> {
    const target = new Set(vacancy.skills.map((s) => s.toLowerCase()));
    const ranked = applicants.map((a) => {
      const overlap = a.skills.filter((s) => target.has(s.toLowerCase()));
      const score = target.size ? Math.round((overlap.length / target.size) * 100) : 0;
      return {
        id: a.id,
        score,
        reason: overlap.length
          ? `${overlap.length} matching skill${overlap.length > 1 ? 's' : ''}: ${overlap.slice(0, 3).join(', ')}`
          : 'No direct skill overlap',
      };
    });
    return ranked.sort((x, y) => y.score - x.score);
  }

  async buildResumeSummary(profile: CandidateProfile): Promise<AIResumeResult> {
    await this.simulateDelay();

    const currentYear = new Date().getFullYear();
    const yearsExp = profile.workExperience.reduce((max, exp) => {
      const start = new Date(exp.startDate).getFullYear();
      if (Number.isNaN(start)) return max;
      return Math.max(max, currentYear - start);
    }, 0);

    return {
      summary: `Results-driven ${profile.title || 'professional'} with ${yearsExp}+ years of experience. Proven track record in ${profile.skills.slice(0, 3).join(', ')}. Seeking to leverage expertise in a challenging new role.`,
      highlights: [
        `${yearsExp}+ years of professional experience`,
        `Skilled in ${profile.skills.slice(0, 5).join(', ')}`,
        profile.education.length > 0 ? `${profile.education[0].degree} from ${profile.education[0].institution}` : 'Self-taught professional',
        `${profile.languages.length} languages spoken`,
      ],
      suggestedSkills: await this.suggestSkills(profile.skills, profile.title),
      improvedBio: `Dedicated ${profile.title || 'professional'} based in ${profile.location || 'Azerbaijan'} with extensive experience in delivering high-impact solutions. Combining technical expertise with strong communication skills to drive business outcomes.`,
    };
  }

  private simulateDelay(ms: number = 800): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
