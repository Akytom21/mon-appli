export type DoctolibCategory =
  | 'generaliste' | 'urgences' | 'specialiste' | 'pharmacie'
  | 'hospital'    | 'pharmacy' | 'doctor'       | 'specialist';

const SPECIALITE_SLUGS: Record<string, string> = {
  cardiologue:               'cardiologue',
  cardiologie:               'cardiologue',
  dermatologue:              'dermatologue',
  dermatologie:              'dermatologue',
  neurologue:                'neurologue',
  neurologie:                'neurologue',
  ophtalmologue:             'ophtalmologue',
  ophtalmologie:             'ophtalmologue',
  'orthopédiste':            'chirurgien-orthopediste',
  'orthopédie':              'chirurgien-orthopediste',
  psychiatre:                'psychiatre',
  psychiatrie:               'psychiatre',
  'pédiatre':                'pediatre',
  'pédiatrie':               'pediatre',
  'gynécologue':             'gynécologue-médical',
  'gynécologie':             'gynécologue-médical',
  orl:                       'oto-rhino-laryngologue',
  'oto-rhino-laryngologue':  'oto-rhino-laryngologue',
  'oto-rhino-laryngologie':  'oto-rhino-laryngologue',
  rhumatologue:              'rhumatologue',
  rhumatologie:              'rhumatologue',
  'gastro-entérologue':      'gastro-enterologue',
  'gastro-entérologie':      'gastro-enterologue',
  pneumologue:               'pneumologue',
  pneumologie:               'pneumologue',
  endocrinologue:            'endocrinologue',
  endocrinologie:            'endocrinologue',
  urologue:                  'urologue',
  urologie:                  'urologue',
  radiologue:                'radiologue',
  radiologie:                'radiologue',
  chirurgien:                'chirurgien',
  'nephrologue':             'nephrologue',
  'nephrologie':             'nephrologue',
  'oncologue':               'oncologue',
  'oncologie':               'oncologue',
  'allergologue':            'allergologue',
  'allergologie':            'allergologue',
  'infectiologue':           'infectiologue',
};

function getCategorySlug(type: DoctolibCategory, specialite?: string): string {
  switch (type) {
    case 'generaliste':
    case 'doctor':
      return 'medecin-generaliste';
    case 'urgences':
    case 'hospital':
      return 'urgences';
    case 'pharmacie':
    case 'pharmacy':
      return 'pharmacien';
    case 'specialiste':
    case 'specialist': {
      if (specialite) {
        const key = specialite.toLowerCase().trim();
        const slug = SPECIALITE_SLUGS[key];
        if (slug) return slug;
      }
      return 'medecin-specialiste';
    }
    default:
      return 'medecin-generaliste';
  }
}

function toNameSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/^(dr\.?|pr\.?|prof\.?|m\.?|mme\.?|docteur|professeur)\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const BASE = 'https://www.doctolib.fr';
const CITY = 'nice';

export function getDoctolibUrl(
  name: string,
  type: DoctolibCategory,
  specialite?: string,
): string {
  const slug = getCategorySlug(type, specialite);
  if (type === 'urgences' || type === 'hospital') {
    return `${BASE}/${slug}/${CITY}`;
  }
  const nameSlug = toNameSlug(name);
  if (nameSlug.length > 2) {
    return `${BASE}/${slug}/${CITY}/${nameSlug}`;
  }
  return `${BASE}/${slug}/${CITY}`;
}
