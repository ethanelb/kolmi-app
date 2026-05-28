// Edge Function : matchmaker-chat
// Le bot agit comme le matchmaker concierge de Kolmi. Il reçoit du
// contexte (profil user, profils disponibles classés par affinité,
// historique) et présente / commente / coordonne — il ne fait pas de
// chat user-à-user.
//
// La clé ANTHROPIC_API_KEY est lue depuis les secrets Supabase, jamais
// embarquée dans le bundle mobile.

import Anthropic from 'npm:@anthropic-ai/sdk@0.87.0'

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY') ?? '',
})

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type AvailableProfile = {
  id: string
  firstName: string
  age?: number
  city?: string
  maisonId?: string
  maisonLabel?: string
  occupation?: string
  teaser?: string
  bio?: string
  intentions?: string
  interests?: string[]
}

type UserContext = {
  firstName?: string
  age?: number
  maisonId?: string
  maisonLabel?: string
  tokens?: number
}

function buildSystemPrompt(user: UserContext | undefined, profiles: AvailableProfile[]): string {
  const userBlock = user
    ? [
        `## L'utilisateur en face de vous`,
        user.firstName ? `- Prénom : ${user.firstName}` : null,
        user.age ? `- Âge : ${user.age}` : null,
        user.maisonLabel ? `- Maison : ${user.maisonLabel}` : null,
        typeof user.tokens === 'number'
          ? `- Tokens disponibles : ${user.tokens} (une rencontre demandée coûte 1 token)`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    : ''

  const profilesBlock = profiles.length
    ? [
        `## Profils que vous pouvez présenter (classés par affinité)`,
        ...profiles.slice(0, 10).map((p, i) => {
          const lines = [
            `### ${i + 1}. ${p.firstName}${p.age ? `, ${p.age} ans` : ''}${p.city ? `, ${p.city}` : ''}`,
            p.maisonLabel ? `- Maison : ${p.maisonLabel}` : null,
            p.occupation ? `- Occupation : ${p.occupation}` : null,
            p.teaser ? `- Teaser : ${p.teaser}` : null,
            p.intentions ? `- Intentions : ${p.intentions}` : null,
            p.interests?.length ? `- Centres d'intérêt : ${p.interests.join(', ')}` : null,
            p.bio ? `- Bio : ${p.bio}` : null,
            `- ID interne : \`${p.id}\``,
          ]
            .filter(Boolean)
            .join('\n')
          return lines
        }),
      ].join('\n\n')
    : '## Profils disponibles\n(Aucun profil dans la sélection du jour pour l\'instant.)'

  return `Vous êtes le matchmaker concierge de **Kolmi**, application française de rencontres curées. Vous parlez à l'utilisateur en vouvoiement, ton mat, littéraire, italique éditorial. Pas d'emoji. Pas de point d'exclamation. Phrases courtes.

## Votre rôle
- Présenter les profils ci-dessous, un à un, en éditorial : citer le prénom, l'âge, la Maison, et donner UNE raison précise de la mettre en avant.
- Réagir aux questions de l'utilisateur sur un profil (caractère, style de vie, ce qu'ils cherchent).
- Coordonner une rencontre quand l'utilisateur dit qu'il veut rencontrer une personne : confirmer le coût (1 token), expliquer la suite (créneaux, lieu).
- Si l'utilisateur n'a plus de tokens, lui suggérer de visiter la page Premium.

## Vous ne faites JAMAIS
- Du chat user-à-user (vous êtes l'intermédiaire, jamais le pont direct).
- De fausses promesses sur des profils qui ne sont pas dans la liste.
- De superlatifs ("incroyable", "exceptionnel") — soyez précis, pas commercial.

${userBlock}

${profilesBlock}

## Style attendu
- Quand vous citez un prénom, restez sobre. Vous pouvez italiser une phrase entre guillemets si vous citez le profil.
- Restez bref : 2-4 phrases par message en général. Vous n'écrivez pas un roman, vous parlez à quelqu'un.
- Quand vous présentez un profil, structurez : prénom + âge + ville → Maison → raison d'affinité → une qualité notable.`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const body = await req.json()
    const message = typeof body.message === 'string' ? body.message : ''
    const history = Array.isArray(body.history) ? body.history : []
    const userContext: UserContext | undefined = body.user_context
    const availableProfiles: AvailableProfile[] = Array.isArray(body.available_profiles)
      ? body.available_profiles
      : []

    if (!message.trim()) {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      })
    }

    const messages = [
      ...history,
      { role: 'user' as const, content: message },
    ]

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: buildSystemPrompt(userContext, availableProfiles),
      messages,
    })

    const text =
      response.content[0]?.type === 'text' ? response.content[0].text : ''

    return new Response(JSON.stringify({ reply: text }), {
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    })
  }
})
