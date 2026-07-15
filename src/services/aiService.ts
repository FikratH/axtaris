import i18n from '@/i18n';
import { CandidateProfile } from '@/types/models';

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

  async buildResumeSummary(profile: CandidateProfile): Promise<AIResumeResult> {
    await this.simulateDelay();

    const yearsExp = profile.workExperience.length > 0 ? 
      Math.max(1, new Date().getFullYear() - new Date(profile.workExperience[profile.workExperience.length - 1].startDate).getFullYear()) : 0;

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
