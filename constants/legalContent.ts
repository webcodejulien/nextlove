export const APP_NAME = 'NextLove';
export const COMPANY_NAME = 'NextLove SAS';
export const COMPANY_EMAIL = 'contact@nextlove.app';
export const PRIVACY_EMAIL = 'privacy@nextlove.app';
export const COMPANY_ADDRESS = '42 rue de la Paix, 75002 Paris, France';
export const DPO_EMAIL = 'dpo@nextlove.app';
export const LAST_UPDATE_CGU = '14 mai 2026';
export const LAST_UPDATE_PRIVACY = '14 mai 2026';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LegalSection {
  id: string;
  title: string;
  content: string;
}

// ─── CGU ─────────────────────────────────────────────────────────────────────

export const CGU_SECTIONS: LegalSection[] = [
  {
    id: 'intro',
    title: '1. Objet et acceptation',
    content: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application mobile NextLove, éditée par ${COMPANY_NAME}, société par actions simplifiée au capital de 10 000 €, immatriculée au RCS de Paris, dont le siège social est situé au ${COMPANY_ADDRESS}.

En créant un compte et en utilisant NextLove, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser l'application.

L'application est réservée aux personnes majeures (18 ans et plus). En créant un compte, vous certifiez avoir atteint l'âge légal requis dans votre pays de résidence.`,
  },
  {
    id: 'account',
    title: '2. Création et gestion du compte',
    content: `Pour utiliser NextLove, vous devez créer un compte en fournissant une adresse email valide et un mot de passe. Vous êtes seul responsable de la confidentialité de vos identifiants et de toutes les activités effectuées depuis votre compte.

Vous vous engagez à :
• Fournir des informations exactes et à jour
• Utiliser une photo de profil vous représentant réellement
• Ne pas créer de compte au nom d'une autre personne
• Signaler toute utilisation non autorisée de votre compte

${COMPANY_NAME} se réserve le droit de suspendre ou de supprimer tout compte ne respectant pas ces conditions.`,
  },
  {
    id: 'usage',
    title: '3. Règles de bonne conduite',
    content: `L'utilisation de NextLove est soumise au respect d'un ensemble de règles visant à garantir une expérience positive pour tous les utilisateurs.

Il est strictement interdit de :
• Publier des contenus illicites, diffamatoires, obscènes ou portant atteinte à la dignité humaine
• Harceler, menacer ou intimider d'autres utilisateurs
• Diffuser des informations personnelles d'autrui sans consentement
• Utiliser l'application à des fins commerciales ou publicitaires sans autorisation
• Créer plusieurs comptes ou utiliser des robots, scripts ou tout autre moyen automatisé
• Tenter de contourner les mesures de sécurité de l'application
• Publier des contenus sexuellement explicites

Tout manquement à ces règles pourra entraîner la suspension immédiate du compte, sans préavis ni remboursement.`,
  },
  {
    id: 'premium',
    title: '4. Abonnement Premium',
    content: `NextLove propose un abonnement Premium à 9,99 €/mois donnant accès à des fonctionnalités avancées (likes illimités, Super Likes, voir qui a liké votre profil, analyse IA avancée, etc.).

L'abonnement est sans engagement et peut être résilié à tout moment depuis les paramètres de l'application. La résiliation prend effet à la fin de la période de facturation en cours.

Les paiements sont traités de manière sécurisée par Stripe. ${COMPANY_NAME} ne stocke aucune donnée bancaire sur ses serveurs.

Aucun remboursement ne sera effectué pour les périodes déjà entamées. Conformément à l'article L. 221-28 du Code de la consommation, le droit de rétractation de 14 jours ne s'applique pas aux contenus numériques dont l'exécution a commencé.`,
  },
  {
    id: 'ip',
    title: '5. Propriété intellectuelle',
    content: `L'ensemble des éléments constituant NextLove (marques, logos, textes, images, sons, logiciels, bases de données) sont la propriété exclusive de ${COMPANY_NAME} ou de ses partenaires et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, diffusion ou exploitation, totale ou partielle, de ces éléments sans autorisation écrite préalable de ${COMPANY_NAME} est strictement interdite.

En publiant du contenu sur NextLove (photos, textes, etc.), vous accordez à ${COMPANY_NAME} une licence non exclusive, mondiale, gratuite, pour utiliser, reproduire et afficher ce contenu dans le cadre du fonctionnement de l'application.`,
  },
  {
    id: 'liability',
    title: '6. Limitation de responsabilité',
    content: `NextLove est une plateforme de mise en relation et ne peut garantir la rencontre de votre partenaire idéal. ${COMPANY_NAME} n'est pas responsable des interactions entre utilisateurs, des informations fournies par les utilisateurs ou des conséquences des rencontres organisées via l'application.

${COMPANY_NAME} s'efforce d'assurer la disponibilité permanente de l'application mais ne peut garantir l'absence d'interruptions. L'application est fournie "en l'état" sans garantie d'aucune sorte.

En tout état de cause, la responsabilité de ${COMPANY_NAME} ne saurait excéder le montant des sommes versées par l'utilisateur au cours des 12 derniers mois.`,
  },
  {
    id: 'termination',
    title: '7. Résiliation',
    content: `Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application. La suppression entraîne l'effacement de vos données personnelles dans un délai de 30 jours, conformément à notre Politique de confidentialité.

${COMPANY_NAME} se réserve le droit de suspendre ou supprimer tout compte violant les présentes CGU, sans préavis ni remboursement.`,
  },
  {
    id: 'law',
    title: '8. Droit applicable et litiges',
    content: `Les présentes CGU sont régies par le droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable avant tout recours judiciaire.

À défaut d'accord amiable, tout litige relatif à l'interprétation ou à l'exécution des présentes CGU sera soumis aux tribunaux compétents de Paris.

Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, ${COMPANY_NAME} propose un dispositif de médiation de la consommation. Vous pouvez y recourir gratuitement via : www.mediateur-consommation.fr

Pour toute question : ${COMPANY_EMAIL}`,
  },
];

// ─── Politique de confidentialité ────────────────────────────────────────────

export const PRIVACY_SECTIONS: LegalSection[] = [
  {
    id: 'intro',
    title: '1. Introduction et responsable du traitement',
    content: `${COMPANY_NAME} ("nous", "notre") attache une importance primordiale à la protection de vos données personnelles. Cette Politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos données conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.

Responsable du traitement :
${COMPANY_NAME}
${COMPANY_ADDRESS}
Contact DPO : ${DPO_EMAIL}`,
  },
  {
    id: 'data-collected',
    title: '2. Données collectées',
    content: `Nous collectons les données suivantes :

Données que vous nous fournissez :
• Identité : prénom, âge, sexe, photo de profil
• Coordonnées : adresse email
• Informations de profil : profession, ville, centres d'intérêt, questionnaire de personnalité
• Communications : messages échangés avec d'autres utilisateurs

Données collectées automatiquement :
• Données de connexion : adresse IP, type d'appareil, système d'exploitation, version de l'app
• Données de navigation : pages visitées, fonctionnalités utilisées, durée des sessions
• Token de notification push (si autorisé)
• Localisation approximative (ville uniquement, si autorisée)

Données de paiement :
• Gérées exclusivement par Stripe. ${COMPANY_NAME} ne stocke aucune donnée bancaire.`,
  },
  {
    id: 'purposes',
    title: '3. Finalités et bases légales',
    content: `Nous traitons vos données sur les bases légales suivantes :

Exécution du contrat (CGU) :
• Créer et gérer votre compte
• Vous mettre en relation avec d'autres utilisateurs
• Traiter vos paiements Premium
• Envoyer des notifications de matchs et messages

Intérêt légitime :
• Assurer la sécurité et prévenir la fraude
• Améliorer l'application et corriger les bugs
• Analyser l'utilisation pour optimiser l'expérience

Consentement :
• Envoyer des communications marketing (si acceptées)
• Partager des données avec des partenaires analytiques
• Utiliser votre localisation précise`,
  },
  {
    id: 'sharing',
    title: '4. Partage des données',
    content: `Nous ne vendons jamais vos données personnelles à des tiers.

Nous partageons vos données uniquement avec :
• Stripe (traitement des paiements) – États-Unis, Privacy Shield
• Supabase (hébergement des données) – Union Européenne
• Expo / Expo Push Service (notifications) – États-Unis
• Anthropic (analyse de compatibilité IA) – États-Unis

Tous nos sous-traitants sont soumis à des contrats de traitement des données conformes au RGPD. Les transferts hors UE sont encadrés par des clauses contractuelles types approuvées par la Commission européenne.

Nous pouvons divulguer vos données aux autorités compétentes si la loi l'exige ou pour protéger nos droits légaux.`,
  },
  {
    id: 'retention',
    title: '5. Durée de conservation',
    content: `Vos données sont conservées pour les durées suivantes :

• Données de compte : durée de vie du compte + 30 jours après suppression
• Messages : 12 mois après la fin du match ou la suppression du compte
• Données de facturation : 10 ans (obligation légale comptable)
• Logs de connexion : 12 mois (obligation légale)
• Données analytiques anonymisées : 36 mois

À l'issue de ces durées, vos données sont définitivement supprimées ou anonymisées.`,
  },
  {
    id: 'rights',
    title: '6. Vos droits RGPD',
    content: `Conformément au RGPD, vous disposez des droits suivants :

✅ Droit d'accès : obtenir une copie de vos données
✅ Droit de rectification : corriger des données inexactes
✅ Droit à l'effacement : supprimer vos données ("droit à l'oubli")
✅ Droit à la portabilité : recevoir vos données dans un format structuré
✅ Droit d'opposition : vous opposer à certains traitements
✅ Droit à la limitation : limiter le traitement de vos données
✅ Droit de retirer votre consentement à tout moment

Pour exercer ces droits : ${PRIVACY_EMAIL}
Nous répondrons dans un délai de 30 jours.

Vous pouvez également déposer une réclamation auprès de la CNIL :
www.cnil.fr — 3 place de Fontenoy, 75007 Paris`,
  },
  {
    id: 'cookies',
    title: '7. Cookies et traceurs',
    content: `L'application utilise des technologies similaires aux cookies pour :

Cookies essentiels (non soumis au consentement) :
• Session d'authentification Supabase
• Préférences de l'application (langue, thème)

Cookies analytiques (avec consentement) :
• Mesure d'audience anonymisée
• Analyse des fonctionnalités utilisées

Vous pouvez gérer vos préférences depuis les paramètres de l'application ou refuser les cookies non essentiels lors de l'affichage de la bannière de consentement.`,
  },
  {
    id: 'security',
    title: '8. Sécurité des données',
    content: `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :

• Chiffrement des données en transit (TLS 1.3)
• Chiffrement des données au repos (AES-256)
• Authentification sécurisée via Supabase Auth
• Paiements traités par Stripe (certifié PCI DSS Level 1)
• Accès aux données limité au personnel autorisé
• Audits de sécurité réguliers

En cas de violation de données susceptible d'affecter vos droits, nous vous notifierons dans les 72 heures conformément à l'article 34 du RGPD.`,
  },
  {
    id: 'minors',
    title: '9. Mineurs',
    content: `NextLove est strictement réservé aux personnes majeures (18 ans et plus). Nous ne collectons sciemment aucune donnée concernant des mineurs. Si vous pensez qu'un mineur utilise l'application, veuillez nous contacter à ${PRIVACY_EMAIL} afin que nous puissions prendre les mesures appropriées.`,
  },
  {
    id: 'changes',
    title: '10. Modifications',
    content: `Nous pouvons modifier cette Politique de confidentialité à tout moment. Toute modification substantielle vous sera notifiée par email ou via une notification dans l'application au moins 30 jours avant son entrée en vigueur.

La date de dernière mise à jour figure en haut de ce document. En continuant à utiliser NextLove après une modification, vous acceptez la nouvelle version de la Politique.

Pour toute question : ${PRIVACY_EMAIL}`,
  },
];
