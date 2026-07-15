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
