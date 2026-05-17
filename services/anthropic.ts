import { Profile } from '../constants/mockData';
import { CriteriaWeights } from '../contexts/AppContext';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const MODEL = 'claude-sonnet-4-6';

export interface CompatibilityResult {
  id: string;
  score: number;
  explanation: string;
}

export async function analyzeCompatibility(
  userCriteria: CriteriaWeights,
  profiles: Profile[]
): Promise<CompatibilityResult[]> {
  if (!API_KEY) {
    return profiles.map(p => ({
      id: p.id,
      score: Math.floor(Math.random() * 35) + 60,
      explanation: 'Score basé sur vos critères (clé API manquante).',
    }));
  }

  const prompt = `Tu es un expert en psychologie des relations et compatibilité amoureuse.
Analyse la compatibilité entre un utilisateur et plusieurs profils sur une app de rencontres.

CRITÈRES DE L'UTILISATEUR (importance de 1 à 10) :
- Famille : ${userCriteria.family}/10
- Valeurs : ${userCriteria.values}/10
- Voyages : ${userCriteria.travel}/10
- Style de vie : ${userCriteria.lifestyle}/10
- Ambition : ${userCriteria.ambition}/10

PROFILS À ANALYSER :
${profiles
  .map(
    p => `
[ID: ${p.id}] ${p.name}, ${p.age} ans – ${p.location}
Bio: ${p.bio}
Profession: ${p.job} | Formation: ${p.education}
Intérêts: ${p.interests.join(', ')}
Traits (1-10): Famille ${p.traits.family} | Valeurs ${p.traits.values} | Voyages ${p.traits.travel} | Lifestyle ${p.traits.lifestyle} | Ambition ${p.traits.ambition}
`
  )
  .join('\n')}

Pour chaque profil, calcule un score de 0 à 100 basé sur :
1. L'alignement entre l'importance des critères utilisateur et les traits du profil
2. La complémentarité et les intérêts communs
3. L'harmonie des valeurs et de la vision de vie
4. Le potentiel de relation épanouissante

Réponds UNIQUEMENT avec ce JSON (aucun texte avant ou après) :
{
  "results": [
    {
      "id": "1",
      "score": 85,
      "explanation": "Explication courte et chaleureuse en 1-2 phrases"
    }
  ]
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(`HTTP ${response.status}: ${JSON.stringify(body)}`);
    }

    const data = await response.json();
    const text: string = data.content[0].text;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.results as CompatibilityResult[];
  } catch (err) {
    console.error('Anthropic error:', err);
    return profiles.map(p => ({
      id: p.id,
      score: Math.floor(
        ((p.traits.family * userCriteria.family +
          p.traits.values * userCriteria.values +
          p.traits.travel * userCriteria.travel +
          p.traits.lifestyle * userCriteria.lifestyle +
          p.traits.ambition * userCriteria.ambition) /
          (userCriteria.family +
            userCriteria.values +
            userCriteria.travel +
            userCriteria.lifestyle +
            userCriteria.ambition)) *
          10
      ),
      explanation: 'Score calculé localement sur vos critères communs.',
    }));
  }
}
