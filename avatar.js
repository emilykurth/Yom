'use strict';
/* Build-your-own avatar from simple shapes. */
const AVATAR_OPTIONS = {
  hair: [
    { id: 'bun', label: 'Bun' },
    { id: 'messy', label: 'Messy bun' },
    { id: 'bob', label: 'Bob' },
    { id: 'long', label: 'Long' },
    { id: 'wavy', label: 'Wavy' },
    { id: 'curly', label: 'Curly' },
  ],
  eyes: [
    { id: 'sleepy', label: 'Sleepy' },
    { id: 'round', label: 'Round' },
    { id: 'happy', label: 'Happy' },
    { id: 'wink', label: 'Wink' },
    { id: 'lashes', label: 'Lashes' },
  ],
  mouth: [
    { id: 'grin', label: 'Grin' },
    { id: 'smile', label: 'Smile' },
    { id: 'open', label: 'Laugh' },
    { id: 'oh', label: 'Oh' },
    { id: 'smirk', label: 'Smirk' },
  ],
  extra: [
    { id: 'none', label: 'Nothing' },
    { id: 'glasses', label: 'Glasses' },
    { id: 'freckles', label: 'Freckles' },
  ],
  skin: ['#F6D9C6', '#EDC3A2', '#D9A47D', '#BB7E58', '#8F5D3E', '#5F3D2A'],
  hairColor: ['#2B1D17', '#5A3424', '#8A5733', '#C68E52', '#E6C483', '#B5513A', '#9A9494', '#D98E9F'],
  bg: ['#CDD6BC', '#C5D3DC', '#D7CCE2', '#EBC4C0', '#F0D6A8', '#E9E0D4', '#8C6450', '#4E3A33'],
  shirt: ['#CF6A33', '#D2867F', '#8F9C66', '#9C6A7C', '#6F8FA6', '#E0A24E', '#3A2519', '#EDE3D6'],
};
const DEFAULT_AVATAR = { hair: 'bun', hairColor: 1, eyes: 'sleepy', mouth: 'grin', extra: 'none', skin: 0, shirt: 0, bg: 0 };

let avatarUid = 0;
function avatarSVG(input, viewBox = '0 0 200 200') {
  const a = { ...DEFAULT_AVATAR, ...(input || {}) };
  if (!AVATAR_OPTIONS.hair.some(h => h.id === a.hair)) a.hair = a.hair === 'short' ? 'bob' : 'bun';
  const bg = AVATAR_OPTIONS.bg[a.bg] || AVATAR_OPTIONS.bg[0];
  const longHair = a.hair === 'long' || a.hair === 'wavy';
  const skin = AVATAR_OPTIONS.skin[a.skin] || AVATAR_OPTIONS.skin[0];
  const hc = AVATAR_OPTIONS.hairColor[a.hairColor] || AVATAR_OPTIONS.hairColor[0];
  const shirt = AVATAR_OPTIONS.shirt[a.shirt] || AVATAR_OPTIONS.shirt[0];
  const ink = '#3A2519';
  const clip = `avc${++avatarUid}`;

  // hair that sits behind the head
  const back = {
    bun: `<circle cx="66" cy="44" r="20" fill="${hc}"/><ellipse cx="100" cy="86" rx="54" ry="52" fill="${hc}"/>`,
    bob: `<path d="M44 92 C44 50 70 36 100 36 C130 36 156 50 156 92 V138 a10 10 0 0 1 -10 10 H54 a10 10 0 0 1 -10 -10 Z" fill="${hc}"/>`,
    long: `<path d="M42 96 C42 50 70 34 100 34 C130 34 158 50 158 96 V176 H42 Z" fill="${hc}"/>`,
    wavy: `<path d="M44 96 C44 50 70 34 100 34 C130 34 156 50 156 96 C166 108 148 120 158 132 C168 144 150 156 160 168 L162 180 H38 L40 168 C50 156 32 144 42 132 C52 120 34 108 44 96 Z" fill="${hc}"/>`,
    messy: `<ellipse cx="100" cy="86" rx="54" ry="52" fill="${hc}"/><circle cx="100" cy="36" r="19" fill="${hc}"/><circle cx="86" cy="30" r="11" fill="${hc}"/><circle cx="115" cy="28" r="10" fill="${hc}"/><path d="M92 18 q-6 -8 -14 -6 M110 16 q4 -9 13 -8 M120 34 q10 -2 14 -10" fill="none" stroke="${hc}" stroke-width="4" stroke-linecap="round"/>`,
    curly: [[58, 70], [66, 52], [82, 40], [100, 36], [118, 40], [134, 52], [142, 70], [148, 90], [52, 90], [146, 110], [54, 110]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="17" fill="${hc}"/>`).join(''),
  }[a.hair] || '';

  // hair that sits in front (fringe / cap)
  const front = {
    bun: `<path d="M56 84 C58 52 80 42 100 42 C124 42 144 56 144 78 C128 64 112 60 98 58 C86 64 72 74 56 84 Z" fill="${hc}"/>`,
    bob: `<path d="M55 90 C54 56 76 44 100 44 C124 44 146 56 145 90 C146 80 140 72 132 70 H68 C60 72 54 80 55 90 Z" fill="${hc}"/>`,
    long: `<path d="M56 88 C56 54 78 42 100 42 C126 42 146 58 144 90 C136 70 118 58 104 56 C96 68 76 80 56 88 Z" fill="${hc}"/>`,
    wavy: `<path d="M56 92 C56 54 78 42 100 42 C126 42 146 58 144 92 C140 80 134 72 126 70 C118 78 110 64 100 66 C90 74 80 62 72 72 C64 76 58 84 56 92 Z" fill="${hc}"/>`,
    messy: `<path d="M56 86 C58 54 80 42 100 42 C124 42 144 56 144 82 C130 66 112 60 96 60 C84 66 70 74 56 86 Z" fill="${hc}"/><path d="M60 82 q-6 14 0 26 q4 8 0 16 M141 80 q6 14 -1 26" fill="none" stroke="${hc}" stroke-width="5" stroke-linecap="round"/>`,
    curly: [[70, 62], [86, 54], [102, 52], [118, 56], [132, 66]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="${hc}"/>`).join(''),
  }[a.hair] || '';

  const eyes = {
    sleepy: `<path d="M74 92 h18 M108 92 h18" stroke="${ink}" stroke-width="4" stroke-linecap="round"/><path d="M76 97 a7 5 0 0 0 14 0 M110 97 a7 5 0 0 0 14 0" fill="${ink}"/>`,
    round: `<circle cx="83" cy="96" r="6" fill="${ink}"/><circle cx="117" cy="96" r="6" fill="${ink}"/><circle cx="85" cy="94" r="2" fill="#fff"/><circle cx="119" cy="94" r="2" fill="#fff"/>`,
    happy: `<path d="M75 99 q8 -10 16 0 M109 99 q8 -10 16 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`,
    wink: `<circle cx="83" cy="96" r="6" fill="${ink}"/><circle cx="85" cy="94" r="2" fill="#fff"/><path d="M109 97 h16" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`,
    lashes: `<circle cx="83" cy="97" r="6" fill="${ink}"/><circle cx="117" cy="97" r="6" fill="${ink}"/><path d="M77 90 l-4 -4 M83 88 v-5 M89 90 l4 -4 M111 90 l-4 -4 M117 88 v-5 M123 90 l4 -4" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>`,
  }[a.eyes] || '';

  const mouth = {
    grin: `<rect x="88" y="120" width="24" height="10" rx="5" fill="#fff"/>`,
    smile: `<path d="M87 121 q13 12 26 0" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`,
    open: `<path d="M86 119 h28 a14 13 0 0 1 -28 0 Z" fill="${ink}"/><path d="M93 127 a7 5 0 0 1 14 0 a14 13 0 0 1 -14 0 Z" fill="#E58C86"/>`,
    oh: `<ellipse cx="100" cy="125" rx="6" ry="7" fill="${ink}"/>`,
    smirk: `<path d="M90 126 q12 4 22 -6" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`,
  }[a.mouth] || '';

  const extra = {
    none: '',
    glasses: `<g fill="none" stroke="${ink}" stroke-width="3"><circle cx="83" cy="96" r="12"/><circle cx="117" cy="96" r="12"/><path d="M95 95 q5 -4 10 0 M71 94 l-14 -4 M129 94 l14 -4"/></g>`,
    freckles: `<g fill="${ink}" fill-opacity=".35"><circle cx="70" cy="108" r="1.8"/><circle cx="76" cy="112" r="1.8"/><circle cx="66" cy="114" r="1.8"/><circle cx="130" cy="108" r="1.8"/><circle cx="124" cy="112" r="1.8"/><circle cx="134" cy="114" r="1.8"/></g>`,
  }[a.extra] || '';

  return `<svg viewBox="${viewBox}" aria-hidden="true">
  <defs><clipPath id="${clip}"><circle cx="100" cy="100" r="96"/></clipPath></defs>
  <circle class="av-bg" cx="100" cy="100" r="96" style="fill:${bg}"/>
  <g clip-path="url(#${clip})">
    ${longHair ? back : ''}
    <path d="M44 210 C44 168 70 152 100 152 C130 152 156 168 156 210 Z" fill="${shirt}"/>
    <rect x="88" y="128" width="24" height="30" rx="8" fill="${skin}"/>
    <rect x="88" y="128" width="24" height="14" fill="#000" fill-opacity=".08"/>
    ${longHair ? '' : back}
    <circle cx="55" cy="102" r="10" fill="${skin}"/>
    <circle cx="145" cy="102" r="10" fill="${skin}"/>
    <ellipse cx="100" cy="100" rx="44" ry="46" fill="${skin}"/>
    ${front}
    ${eyes}
    <path d="M100 100 v14" stroke="#000" stroke-opacity=".13" stroke-width="4" stroke-linecap="round"/>
    <circle cx="72" cy="114" r="8" fill="#E2846F" fill-opacity=".38"/>
    <circle cx="128" cy="114" r="8" fill="#E2846F" fill-opacity=".38"/>
    ${extra}
    ${mouth}
  </g>
</svg>`;
}
