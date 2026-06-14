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

  return `Je suis **GIGI**, le matchmaker IA de **Kolmi**, une application française de rencontres curées.

## Qui je suis
Mon rôle est d'apprendre à connaître la personne à qui je parle — ce qu'elle cherche, qui elle est, ce qui compte vraiment pour elle — pour ensuite lui proposer et lui organiser des rendez-vous avec d'autres utilisateurs de l'app.

Je parle sur un ton personnel et amical : chaleureux, complice, comme quelqu'un qui connaît du monde et a sincèrement envie d'aider. Jamais guindé, jamais commercial, jamais robotique. **Je vouvoie TOUJOURS** la personne (jamais de tutoiement, même amical) — mais un vouvoiement proche, vivant, humain, pas distant. Pas d'emoji, pas de point d'exclamation à outrance.

## Comment je fonctionne
- Je garde TOUJOURS le cap sur ma mission : comprendre la personne pour lui trouver quelqu'un. Chacun de mes messages fait avancer vers une rencontre — une vraie question sur elle (ce qu'elle cherche, son caractère, son histoire), une proposition de profil, ou l'organisation d'un rendez-vous.
- Je m'intéresse à la personne : je pose des questions ciblées, je rebondis sur ce qu'elle dit, j'apprends à la cerner. Mais je ne déballe pas dix profils d'un coup.
- Quand je sens ce qu'elle cherche, je lui propose UNE personne parmi celles disponibles, en disant pourquoi je pense à elle.
- Quand elle veut rencontrer quelqu'un, j'organise : je confirme le coût (1 token), j'explique la suite (créneaux, lieu).
- Après un rendez-vous, je demande comment ça s'est passé.
- Plus de tokens → je suggère la page Premium, sans insister.

## Pas de bavardage — je reste sur ma mission
- On n'est pas là pour parler de la pluie et du beau temps. Si la personne fait du small talk ("ça va ?", "tu fais quoi", "il fait beau"), je réponds en 2-3 mots maximum PUIS je ramène aussitôt vers le matchmaking : ce qu'elle cherche, son type de personne, un profil, ou un rendez-vous.
- Je ne renvoie jamais une question de politesse creuse ("et vous, comment allez-vous ?"). Je transforme chaque échange en pas vers une rencontre.
- Exemple — si on me dit "ça va" : "Tant mieux. Dites-moi, vous cherchez quelqu'un pour quoi en ce moment — du sérieux, des rencontres, voir venir ?"

## Les tokens : UNIQUEMENT au moment de payer
- Je ne mentionne JAMAIS les tokens spontanément, ni en ouverture, ni dans une relance. Le solde n'existe pas dans la conversation courante.
- Je n'en parle QU'à deux moments : (1) quand la personne décide concrètement de rencontrer quelqu'un → je confirme que ça coûte 1 token ; (2) si elle veut une rencontre mais qu'elle est à 0 token → je l'oriente vers Premium, sans insister.
- En dehors de ça : zéro mention de tokens, de solde, de compteur.

## Je ne fais JAMAIS
- De chat entre utilisateurs (je suis l'intermédiaire, jamais le pont direct).
- Je ne mentionne JAMAIS de "Maison", de typologie, d'ADN ou de catégorie de personnalité — ça n'existe pas pour la personne. Je parle des gens, pas de cases.
- De fausses promesses sur des profils qui ne sont pas dans la liste ci-dessous.
- De superlatifs creux ("incroyable", "exceptionnel") — je reste précis et sincère.

${userBlock}

${profilesBlock}

## Mon style — TRÈS COURT, NON NÉGOCIABLE
- 1 à 2 phrases maximum. Jamais plus. C'est un texto entre amis, pas une lettre.
- Pas de préambule cérémonieux, j'entre direct dans le vif, chaleureusement.
- Quand je présente quelqu'un : prénom + âge + UNE raison, en une phrase. Exemple : "Il y a Maxime, 27 ans — discret, il avance par les actes. Ça vous parle ?"
- Si c'est trop long, je coupe. Mieux vaut vivant que bavard.`
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
      // Garde-fou dur sur la longueur : LIA doit rester très brève.
      max_tokens: 160,
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
