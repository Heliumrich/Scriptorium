import type { APIRoute } from 'astro';

export const prerender = false;

const BOOK_ALIASES: Record<string, string> = {
  // Ancien Testament
  "genese": "GEN", "genèse": "GEN", "gn": "GEN", "gen": "GEN",
  "exode": "EXO", "ex": "EXO",
  "levitique": "LEV", "lévitique": "LEV", "lv": "LEV", "lev": "LEV",
  "nombres": "NUM", "nb": "NUM", "nm": "NUM", "num": "NUM",
  "deuteronome": "DEU", "deutéronome": "DEU", "dt": "DEU", "deu": "DEU",
  "josue": "JOS", "josué": "JOS", "jos": "JOS",
  "juges": "JDG", "jg": "JDG", "jdc": "JDG",
  "ruth": "RUT", "rt": "RUT",
  "1 samuel": "1SA", "1samuel": "1SA", "1sa": "1SA", "1rg": "1SA", "1 s": "1SA",
  "2 samuel": "2SA", "2samuel": "2SA", "2sa": "2SA", "2rg": "2SA", "2 s": "2SA",
  "1 rois": "1KI", "1rois": "1KI", "1ki": "1KI", "3rg": "1KI", "1 r": "1KI",
  "2 rois": "2KI", "2rois": "2KI", "2ki": "2KI", "4rg": "2KI", "2 r": "2KI",
  "1 chroniques": "1CH", "1chroniques": "1CH", "1ch": "1CH", "1par": "1CH",
  "2 chroniques": "2CH", "2chroniques": "2CH", "2ch": "2CH", "2par": "2CH",
  "esdras": "EZR", "esr": "EZR", "ezr": "EZR",
  "nehemie": "NEH", "néhémie": "NEH", "neh": "NEH",
  "tobie": "TOB", "tob": "TOB",
  "judith": "JDT", "jdt": "JDT",
  "esther": "EST", "est": "EST",
  "1 maccabees": "1MA", "1maccabees": "1MA", "1ma": "1MA", "1mcc": "1MA", "1 m": "1MA",
  "2 maccabees": "2MA", "2maccabees": "2MA", "2ma": "2MA", "2mcc": "2MA", "2 m": "2MA",
  "job": "JOB", "jb": "JOB",
  "psaumes": "PSA", "psaume": "PSA", "ps": "PSA",
  "proverbes": "PRO", "pr": "PRO",
  "ecclesiaste": "ECC", "ecclésiaste": "ECC", "eccl": "ECC", "ecl": "ECC",
  "cantique": "SNG", "cantique des cantiques": "SNG", "ct": "SNG", "sng": "SNG",
  "sagesse": "WIS", "sap": "WIS", "wis": "WIS",
  "ecclesiastique": "SIR", "ecclésiastique": "SIR", "sir": "SIR", "si": "SIR",
  "isaie": "ISA", "isaïe": "ISA", "is": "ISA",
  "jeremie": "JER", "jérémie": "JER", "jr": "JER",
  "lamentations": "LAM", "lam": "LAM",
  "baruch": "BAR", "ba": "BAR",
  "ezechiel": "EZK", "ézéchiel": "EZK", "ez": "EZK",
  "daniel": "DAN", "dn": "DAN",
  "osee": "HOS", "osée": "HOS", "os": "HOS",
  "joel": "JOL", "joël": "JOL", "jl": "JOL",
  "amos": "AMO", "am": "AMO",
  "abdias": "OBA", "abd": "OBA", "oba": "OBA",
  "jonas": "JON", "jon": "JON",
  "michee": "MIC", "michée": "MIC", "mi": "MIC", "mch": "MIC",
  "nahum": "NAM", "na": "NAM",
  "habacuc": "HAB", "ha": "HAB",
  "sophonie": "ZEP", "so": "ZEP", "soph": "ZEP",
  "aggee": "HAG", "aggée": "HAG", "ag": "HAG",
  "zacharie": "ZEC", "za": "ZEC", "zach": "ZEC",
  "malachie": "MAL", "ml": "MAL",

  // Nouveau Testament
  "matthieu": "MAT", "mt": "MAT", "matt": "MAT",
  "marc": "MRK", "mc": "MRK", "mrk": "MRK",
  "luc": "LUK", "lc": "LUK", "luk": "LUK",
  "jean": "JHN", "jn": "JHN", "jhn": "JHN", "john": "JHN",
  "actes": "ACT", "ac": "ACT", "act": "ACT",
  "romains": "ROM", "rm": "ROM", "rom": "ROM",
  "1 corinthiens": "1CO", "1corinthiens": "1CO", "1co": "1CO", "1cor": "1CO",
  "2 corinthiens": "2CO", "2corinthiens": "2CO", "2co": "2CO", "2cor": "2CO",
  "galates": "GAL", "ga": "GAL", "gal": "GAL",
  "ephesiens": "EPH", "éphésiens": "EPH", "ep": "EPH", "eph": "EPH",
  "philippiens": "PHP", "ph": "PHP", "phlp": "PHP", "php": "PHP",
  "colossiens": "COL", "col": "COL",
  "1 thessaloniciens": "1TH", "1thessaloniciens": "1TH", "1th": "1TH", "1thes": "1TH",
  "2 thessaloniciens": "2TH", "2thessaloniciens": "2TH", "2th": "2TH", "2thes": "2TH",
  "1 timothee": "1TI", "1timothée": "1TI", "1tm": "1TI", "1tim": "1TI",
  "2 timothee": "2TI", "2timothée": "2TI", "2tm": "2TI", "2tim": "2TI",
  "tite": "TIT", "tt": "TIT", "tit": "TIT",
  "philemon": "PHM", "philémon": "PHM", "phm": "PHM",
  "hebreux": "HEB", "hébreux": "HEB", "he": "HEB", "hbr": "HEB",
  "jacques": "JAS", "jc": "JAS", "jac": "JAS",
  "1 pierre": "1PE", "1pierre": "1PE", "1p": "1PE", "1ptr": "1PE", "1pe": "1PE",
  "2 pierre": "2PE", "2pierre": "2PE", "2p": "2PE", "2ptr": "2PE", "2pe": "2PE",
  "1 jean": "1JN", "1jean": "1JN", "1jn": "1JN", "1jo": "1JN",
  "2 jean": "2JN", "2jean": "2JN", "2jn": "2JN", "2jo": "2JN",
  "3 jean": "3JN", "3jean": "3JN", "3jn": "3JN", "3jo": "3JN",
  "jude": "JUD", "jud": "JUD",
  "apocalypse": "REV", "ap": "REV", "apc": "REV", "rev": "REV", "revelation": "REV",
};

function normalizeBook(text: string): string | null {
  if (!text) return null;

  let t = text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents
    .replace(/[.\s]+/g, ' ')
    .trim();

  // Essai direct
  if (BOOK_ALIASES[t]) return BOOK_ALIASES[t];

  // Essai sans espaces (1corinthiens, etc.)
  const nospace = t.replace(/\s+/g, '');
  if (BOOK_ALIASES[nospace]) return BOOK_ALIASES[nospace];

  return null;
}

function parseReference(ref: string) {
  if (!ref) return { book: null, chapter: null, verse: null };

  ref = ref.trim();

  // Livre + chapitre + verset  →  Jean 3:16 | Jean 3,16 | Jean 3 16
  let m = ref.match(/^(.+?)\s+(\d+)\s*[:.,\s]\s*(\d+)$/i);
  if (m) {
    return {
      book: normalizeBook(m[1]),
      chapter: parseInt(m[2], 10),
      verse: parseInt(m[3], 10)
    };
  }

  // Livre + chapitre seul  →  Jean 3
  m = ref.match(/^(.+?)\s+(\d+)$/i);
  if (m) {
    return {
      book: normalizeBook(m[1]),
      chapter: parseInt(m[2], 10),
      verse: null
    };
  }

  return { book: null, chapter: null, verse: null };
}

export const GET: APIRoute = ({ request }) => {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref') || '';

  const result = parseReference(ref);
  console.log('PARSE:', JSON.stringify(ref), '→', result);

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
};