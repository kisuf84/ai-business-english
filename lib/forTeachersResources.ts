export type TeacherResource = {
  id: string;
  title: string;
  docsUrl: string;
  embedUrl: string;
};

const GAMMA_RESOURCE_URLS = [
  "https://gamma.app/docs/Technology-addiction-l4gq73n792quxde",
  "https://gamma.app/docs/Working-Online-vs-Working-in-an-Office-83lu2p93ijx63n3?mode=doc",
  "https://gamma.app/docs/Time-Management-r4she9kttte8p2o?mode=doc",
  "https://gamma.app/docs/The-influence-of-music-on-mood-u6prfx2fdleslvj?mode=doc",
  "https://gamma.app/docs/The-role-of-family-in-career-choices-ufgj88mue19pik7?mode=doc",
  "https://gamma.app/docs/Studying-online-vs-studying-in-a-classroom-ryatrat4xln66l5?mode=doc",
  "https://gamma.app/docs/Saving-money-vs-spending-money-0e4r9a0gb3vj0ff?mode=doc",
  "https://gamma.app/docs/Balancing-Work-and-Personal-Life-esouvyew5hfyd3d?mode=doc",
  "https://gamma.app/docs/Remote-Work-and-Digital-Nomad-Life-s4uxrlfyvy8irxw?mode=doc",
  "https://gamma.app/docs/The-future-of-jobs-f4q8z20dcbv4r73?mode=doc",
  "https://gamma.app/docs/Climate-Change-and-Daily-Habits-8hgd6s9cn1qbn5v?mode=doc",
  "https://gamma.app/docs/Starting-a-Small-Business-vfn3wi63hur6udz?mode=doc",
  "https://gamma.app/docs/The-Role-of-Technology-in-Education-rlzwkzvfh9etl32?mode=doc",
  "https://gamma.app/docs/Online-Shopping-vs-Physical-Stores-Making-Smart-Consumer-Choices-7ndginalvm3vdor?mode=doc",
  "https://gamma.app/docs/Learning-English-through-Movies-and-Music-atdhlq40srluik5?mode=doc",
  "https://gamma.app/docs/Living-Abroad-and-Cultural-Differences-chxhfszz87wxab6?mode=doc",
  "https://gamma.app/docs/Traveling-on-a-Budget-m4moxstphocd13p?mode=doc",
  "https://gamma.app/docs/The-Importance-of-Mental-Health-2teooo45zly8kdx?mode=doc",
  "https://gamma.app/docs/Life-After-Social-Media-zlykukp99oc2n93?mode=doc",
  "https://gamma.app/docs/The-Impact-of-Artificial-Intelligence-on-Daily-Life-ax1ry8aq47cmzjy?mode=doc",
  "https://gamma.app/docs/Success-Money-or-Happiness-nyd00cef184x9x6?mode=doc",
  "https://gamma.app/docs/Living-in-a-big-city-vs-a-small-town-v6kirzpm06otwmf?mode=doc",
  "https://gamma.app/docs/Daily-routines-and-productivity-mcan3cqa6v5crhe?mode=doc",
  "https://gamma.app/docs/The-importance-of-sleep-obt7iqwg8az2f2t?mode=doc",
  "https://gamma.app/docs/Dating-apps-vs-real-relationships-tl5vehcmzvkowpw?mode=doc",
  "https://gamma.app/docs/Traditional-Food-vs-Fast-Food-vuglnxg9noabj60?mode=doc",
  "https://gamma.app/docs/Learning-New-Skills-as-an-Adult-anwwwisgsf25dwn?mode=doc",
  "https://gamma.app/docs/The-Influence-of-Social-Media-Influencers-lnwxkvj9n1ruqll?mode=doc",
  "https://gamma.app/docs/Poverty-ezw2tl7mnw6rpku?mode=doc",
  "https://gamma.app/docs/Unemployment-m20r9awhntbtr1e?mode=doc",
  "https://gamma.app/docs/Copy-of-Unemployment-34d8hoemilgfdm5?mode=doc",
  "https://gamma.app/docs/The-Power-of-Positive-Thinking-gok6pytfaw237w6?mode=doc",
  "https://gamma.app/docs/The-impact-of-smartphones-on-communication-e92kk6aqpjgpfb6?mode=doc",
  "https://gamma.app/docs/Traveling-Alone-vs-Traveling-with-Friends-otbd12n0w9gg4g9?mode=doc",
  "https://gamma.app/docs/Tourism-and-Overtourism-7lakk54tjl8xcd9?mode=doc",
  "https://gamma.app/docs/Freelancing-vs-Full-Time-Jobs-cg8tmek78j96wfp?mode=doc",
  "https://gamma.app/docs/Online-Privacy-and-Personal-Data-7dyo1olxkxmnfir?mode=doc",
  "https://gamma.app/docs/Cultural-Traditions-in-a-Global-World-qncblyqu2etwwj4?mode=doc",
  "https://gamma.app/docs/The-Importance-of-Teamwork-ag5f4z8nd534yn5?mode=doc",
  "https://gamma.app/docs/The-influence-of-movies-on-society-pawckb1rff4m2vo?mode=doc",
  "https://gamma.app/docs/Dealing-with-Stress-ew3l9kgzq1kf7vb?mode=doc",
  "https://gamma.app/docs/Social-media-and-self-image-ongvua35336pby2?mode=doc",
  "https://gamma.app/docs/Entrepreneurship-d63nfx2lr0ebk2u?mode=doc",
  "https://gamma.app/docs/Celebrities-Fame-3iuy66miy2l278m?mode=doc",
  "https://gamma.app/docs/The-Importance-of-Customer-Service-ivjioxwn77dxe7x?mode=doc",
  "https://gamma.app/docs/Learning-from-Mistakes-yp09292awnxue3t?mode=doc",
  "https://gamma.app/docs/The-role-of-sports-in-daily-life-jbr5vtmve0h15tq?mode=doc",
  "https://gamma.app/docs/Effective-Time-Management-wjgg26i96ku51u3?mode=doc",
  "https://gamma.app/docs/The-importance-of-soft-skills-sbh4vwfujna5zcp?mode=doc",
  "https://gamma.app/docs/The-impact-of-advertising-dmapb4oeuepz5a6?mode=doc",
  "https://gamma.app/docs/Living-Without-the-Internet-hrlspjzrbmq6ed3?mode=doc",
  "https://gamma.app/docs/Healthy-Eating-Habits-t42egcyalgbjf8g?mode=doc",
  "https://gamma.app/docs/Healthy-Lifestyle-vs-Busy-Lifestyle-lrw5vd3v4vc9qu9?mode=doc",
];

const UPPER_TOKENS = new Set(["AI", "UK", "USA", "US", "CEO", "HR", "IT"]);
const LOWER_TOKENS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "for",
  "from",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "vs",
  "with",
]);

function toReadableTitle(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const last = pathname.split("/").pop() || "";
    const withoutId = last.replace(/-[a-z0-9]{10,}$/i, "");
    const words = withoutId
      .split("-")
      .filter(Boolean)
      .map((raw, index) => {
        const upper = raw.toUpperCase();
        if (UPPER_TOKENS.has(upper)) return upper;
        const lower = raw.toLowerCase();
        if (index > 0 && LOWER_TOKENS.has(lower)) return lower;
        return `${lower.slice(0, 1).toUpperCase()}${lower.slice(1)}`;
      });
    return words.join(" ") || "Gamma Resource";
  } catch {
    return "Gamma Resource";
  }
}

function extractGammaDocId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split("/").pop() || "";
    const match = last.match(/-([a-z0-9]{10,})$/i);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function toEmbedUrl(id: string): string {
  return `https://gamma.app/embed/${id}`;
}

export const TEACHER_RESOURCES: TeacherResource[] = GAMMA_RESOURCE_URLS.flatMap((url) => {
  const id = extractGammaDocId(url);
  if (!id) return [];

  return [
    {
      id,
      title: toReadableTitle(url),
      docsUrl: url,
      embedUrl: toEmbedUrl(id),
    },
  ];
});

export function getTeacherResourceById(id: string): TeacherResource | null {
  return TEACHER_RESOURCES.find((resource) => resource.id === id) ?? null;
}
