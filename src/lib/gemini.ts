import { Creation, Category } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const isGeminiConfigured = Boolean(
  GEMINI_API_KEY && 
  GEMINI_API_KEY.length > 10 && 
  !GEMINI_API_KEY.includes('placeholder')
);

interface GeminiSuggestion {
  name?: string;
  tagline: string;
  description: string;
  category_id: string;
  suggested_tags: string[];
  pricing_type?: string;
  origin_country?: string;
}

interface AIDiscoveryResult {
  matches: Creation[];
  reasoning: string;
  extractedQueryIntent: {
    category?: string;
    pricing?: string;
    audience?: string;
    keywords: string[];
  };
}

/**
 * Call Gemini REST API directly using standard fetch with compact token usage
 */
async function callGemini(prompt: string, systemInstruction?: string): Promise<string | null> {
  if (!isGeminiConfigured) return null;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    
    const body: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 600,
        responseMimeType: "application/json",
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      console.warn(`Gemini API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return candidate || null;
  } catch (err) {
    console.error('Error contacting Gemini service:', err);
    return null;
  }
}

/**
 * FEATURE A: AI Creation Assistant
 * Analyzes website URL, name, and initial brief to suggest metadata
 */
export async function analyzeWebsiteWithAI(
  url: string,
  name: string,
  categories: Category[],
  userNotes?: string
): Promise<{ suggestion: GeminiSuggestion; source: 'gemini' | 'heuristic' }> {
  const categoryList = categories.map(c => `${c.id} (${c.name})`).join(', ');

  const prompt = `Analyze this digital creation submission:
Website URL: ${url}
Name: ${name}
Creator Notes: ${userNotes || 'None'}
Available Categories: [${categoryList}]

Provide concise, high quality metadata as JSON:
{
  "tagline": "A punchy single-sentence summary under 90 chars",
  "description": "2-3 sentences explaining what it is, who it is for, and key capabilities",
  "category_id": "exact category id from the list that fits best",
  "suggested_tags": ["3 to 5 lowercase tags like web-app, free, developer-tools, etc"],
  "pricing_type": "Free or Freemium or Paid or Open Source",
  "origin_country": "Probable country or Global"
}`;

  const rawJson = await callGemini(
    prompt,
    "You are NIRAULOOM AI Creation Assistant. Return valid JSON only. Keep answers concise, factual, and strictly aligned with the available category list."
  );

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as GeminiSuggestion;
      // Ensure category_id is valid
      const validCategory = categories.find(c => c.id === parsed.category_id);
      if (!validCategory && categories.length > 0) {
        parsed.category_id = categories[0].id;
      }
      return { suggestion: parsed, source: 'gemini' };
    } catch {
      // Fallback to heuristic
    }
  }

  // Heuristic analysis fallback (no API key or network error)
  const lowerUrl = url.toLowerCase();
  const lowerName = name.toLowerCase();
  const lowerNotes = (userNotes || '').toLowerCase();
  const combined = `${lowerUrl} ${lowerName} ${lowerNotes}`;

  let matchedCategory = 'developer-tools';
  const tags: string[] = ['web-app'];

  if (combined.includes('shop') || combined.includes('store') || combined.includes('cart') || combined.includes('cloth') || combined.includes('buy')) {
    matchedCategory = 'ecommerce';
    tags.push('e-commerce', 'minimalist');
  } else if (combined.includes('ai') || combined.includes('gpt') || combined.includes('agent') || combined.includes('neural') || combined.includes('llm')) {
    matchedCategory = 'ai-machine-learning';
    tags.push('ai-powered');
  } else if (combined.includes('design') || combined.includes('ui') || combined.includes('ux') || combined.includes('color') || combined.includes('canvas')) {
    matchedCategory = 'design-creative';
    tags.push('creative', 'design-system');
  } else if (combined.includes('study') || combined.includes('learn') || combined.includes('course') || combined.includes('student')) {
    matchedCategory = 'education';
    tags.push('student-built', 'free');
  } else if (combined.includes('game') || combined.includes('play')) {
    matchedCategory = 'gaming';
  } else if (combined.includes('note') || combined.includes('task') || combined.includes('focus') || combined.includes('flow')) {
    matchedCategory = 'productivity';
    tags.push('productivity');
  }

  if (combined.includes('open source') || combined.includes('github') || combined.includes('git')) {
    tags.push('open-source');
  } else {
    tags.push('free');
  }

  return {
    source: 'heuristic',
    suggestion: {
      tagline: `${name} is a modern digital platform designed for streamlined workflows and creative discovery.`,
      description: `${name} provides an intuitive web interface at ${url}. It enables users to explore, organize, and accelerate digital creation tasks efficiently.`,
      category_id: matchedCategory,
      suggested_tags: Array.from(new Set(tags)).slice(0, 4),
      pricing_type: tags.includes('open-source') ? 'Open Source' : 'Free',
      origin_country: 'Global'
    }
  };
}

/**
 * FEATURE B: Natural-language discovery
 * Matches natural queries against actual database creations
 */
export async function naturalLanguageDiscover(
  query: string,
  approvedCreations: Creation[]
): Promise<AIDiscoveryResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      matches: approvedCreations.slice(0, 6),
      reasoning: 'Showing trending creations across all categories.',
      extractedQueryIntent: { keywords: [] }
    };
  }

  // First check if Gemini is available to parse intent
  const prompt = `Given this user search query: "${trimmed}"
And this set of digital platform creations:
${JSON.stringify(approvedCreations.map(c => ({ id: c.id, name: c.name, tagline: c.tagline, category: c.category_id, tags: c.tags, pricing: c.pricing_type, student: c.is_student_indie })))}

Match the query strictly against the real provided creations above. Return JSON:
{
  "matched_ids": ["id1", "id2"],
  "reasoning": "1 sentence explanation of why these real creations matched the user request",
  "category": "matched category or empty",
  "pricing": "matched pricing or empty",
  "audience": "e.g. students, developers, designers, or general"
}`;

  const geminiResponse = await callGemini(
    prompt,
    "You are NIRAULOOM Search AI. ONLY match provided database IDs. Never invent or hallucinate items."
  );

  if (geminiResponse) {
    try {
      const parsed = JSON.parse(geminiResponse);
      const matchedCreations = approvedCreations.filter(c => parsed.matched_ids?.includes(c.id));
      if (matchedCreations.length > 0) {
        return {
          matches: matchedCreations,
          reasoning: parsed.reasoning || `Matched ${matchedCreations.length} creations matching "${trimmed}".`,
          extractedQueryIntent: {
            category: parsed.category,
            pricing: parsed.pricing,
            audience: parsed.audience,
            keywords: trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 2)
          }
        };
      }
    } catch {
      // Continue to deterministic fallback
    }
  }

  // Smart Deterministic Matching Engine
  const tokens = trimmed.toLowerCase().split(/[\s,]+/).filter(Boolean);
  const isStudentQuery = tokens.some(t => ['student', 'students', 'college', 'university', 'undergrad', 'academic'].includes(t));
  const isFreeQuery = tokens.some(t => ['free', 'freemium', 'open-source', 'opensource', 'gratis'].includes(t));
  const isAIQuery = tokens.some(t => ['ai', 'intelligence', 'llm', 'agent', 'model', 'neural', 'machine'].includes(t));
  const isDevQuery = tokens.some(t => ['dev', 'developer', 'code', 'api', 'backend', 'frontend', 'git', 'terminal'].includes(t));
  const isDesignQuery = tokens.some(t => ['design', 'ui', 'ux', 'art', 'creative', 'graphics', 'shader', '3d'].includes(t));
  const isEcommerceQuery = tokens.some(t => ['shop', 'store', 'ecommerce', 'retail', 'clothing', 'fashion', 'market', 'commerce'].includes(t));
  const isProductivityQuery = tokens.some(t => ['productivity', 'notes', 'second brain', 'focus', 'task', 'audio'].includes(t));

  const scored = approvedCreations.map(creation => {
    let score = 0;
    const fullText = `${creation.name} ${creation.tagline} ${creation.description} ${creation.category_id} ${(creation.tags || []).join(' ')} ${creation.pricing_type} ${creation.origin_country}`.toLowerCase();

    // Direct token hits
    for (const t of tokens) {
      if (creation.name.toLowerCase().includes(t)) score += 15;
      if (creation.tagline.toLowerCase().includes(t)) score += 8;
      if (creation.description.toLowerCase().includes(t)) score += 4;
      if (creation.tags?.some(tag => tag.toLowerCase().includes(t))) score += 10;
      if (creation.category_id.toLowerCase().includes(t)) score += 8;
    }

    // Intent boosts
    if (isStudentQuery && (creation.is_student_indie || creation.tags?.includes('student-built'))) score += 20;
    if (isFreeQuery && (creation.pricing_type === 'Free' || creation.pricing_type === 'Open Source')) score += 12;
    if (isAIQuery && creation.category_id === 'ai-machine-learning') score += 16;
    if (isDevQuery && creation.category_id === 'developer-tools') score += 16;
    if (isDesignQuery && creation.category_id === 'design-creative') score += 16;
    if (isEcommerceQuery && creation.category_id === 'ecommerce') score += 16;
    if (isProductivityQuery && creation.category_id === 'productivity') score += 16;

    return { creation, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const filtered = scored.filter(s => s.score > 0).map(s => s.creation);
  const finalMatches = filtered.length > 0 ? filtered : approvedCreations.slice(0, 4);

  let reasoning = `Found ${finalMatches.length} platform creations corresponding to "${trimmed}".`;
  if (isStudentQuery && isFreeQuery) {
    reasoning = `Found free and student-developed creations matching your inquiry.`;
  } else if (isAIQuery) {
    reasoning = `Filtered intelligent machine learning and agent creations from verified makers.`;
  } else if (isDevQuery) {
    reasoning = `Matched developer utilities, infrastructure, and open-source packages.`;
  }

  return {
    matches: finalMatches,
    reasoning,
    extractedQueryIntent: {
      category: isAIQuery ? 'ai-machine-learning' : isDevQuery ? 'developer-tools' : isDesignQuery ? 'design-creative' : isEcommerceQuery ? 'ecommerce' : undefined,
      pricing: isFreeQuery ? 'Free' : undefined,
      audience: isStudentQuery ? 'Students' : isDevQuery ? 'Developers' : 'General',
      keywords: tokens
    }
  };
}

/**
 * FEATURE C: Similar creations recommendation
 */
export function getSimilarCreations(
  current: Creation,
  allCreations: Creation[],
  limit = 3
): Creation[] {
  const others = allCreations.filter(c => c.id !== current.id && c.status === 'approved');

  const scored = others.map(item => {
    let score = 0;
    if (item.category_id === current.category_id) score += 25;
    if (item.subcategory_id && item.subcategory_id === current.subcategory_id) score += 20;
    if (item.pricing_type === current.pricing_type) score += 5;

    const currentTags = current.tags || [];
    const itemTags = item.tags || [];
    const sharedTags = currentTags.filter(t => itemTags.includes(t));
    score += sharedTags.length * 10;

    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => s.item);
}

/**
 * FEATURE D: AI Curated Collection Generator
 */
export async function generateAICollection(
  userPrompt: string,
  allCreations: Creation[]
): Promise<{ title: string; description: string; items: Creation[] }> {
  const approved = allCreations.filter(c => c.status === 'approved');
  const searchResult = await naturalLanguageDiscover(userPrompt, approved);
  const selectedItems = searchResult.matches.slice(0, 6);

  let title = userPrompt.length < 32 
    ? userPrompt.charAt(0).toUpperCase() + userPrompt.slice(1) 
    : 'Curated Discovery Loom';
  let description = `A curated compilation of creations focusing on ${userPrompt}, automatically woven by NIRAULOOM AI.`;

  if (userPrompt.toLowerCase().includes('student')) {
    title = 'Student & Indie Power Tools';
    description = 'High-utility, budget-friendly and open-source applications built for students and researchers.';
  } else if (userPrompt.toLowerCase().includes('design') || userPrompt.toLowerCase().includes('shader')) {
    title = 'Sensory Web & Creative Code';
    description = 'Interactive instruments, shaders, typography showcases, and creative platforms.';
  } else if (userPrompt.toLowerCase().includes('e-commerce') || userPrompt.toLowerCase().includes('shop')) {
    title = 'Conscious Commerce & D2C Innovation';
    description = 'Next-generation storefronts, artisan marketplaces, and modern retail software.';
  }

  return {
    title,
    description,
    items: selectedItems
  };
}
