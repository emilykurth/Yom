'use strict';
/* Flat, single-colour food icons (they take the category's tint via currentColor). */
const FOOD_ICONS = {
  burger: { label: 'Burger', emoji: '🍔', svg: '<rect x="12" y="12" width="40" height="13" rx="6.5"/><rect x="12" y="28" width="40" height="4" rx="2"/><rect x="12" y="35" width="40" height="4" rx="2"/><rect x="12" y="42" width="40" height="11" rx="5.5"/>' },
  pizza: { label: 'Pizza slice', emoji: '🍕', svg: '<path d="M32 10 L52 46 H12 Z"/><rect x="10" y="48" width="44" height="8" rx="4"/><circle cx="31" cy="30" r="3.4" fill-opacity=".55"/><circle cx="25" cy="39" r="3" fill-opacity=".55"/><circle cx="37" cy="40" r="3" fill-opacity=".55"/>' },
  smoothie: { label: 'Smoothie', emoji: '🥤', svg: '<rect x="18" y="26" width="28" height="30" rx="5"/><rect x="16" y="20" width="32" height="7" rx="3.5" fill-opacity=".7"/><path d="M33 22 V8 h9" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' },
  bubbletea: { label: 'Bubble tea', emoji: '🧋', svg: '<path d="M18 22 H46 L42 56 H22 Z"/><rect x="15" y="17" width="34" height="6" rx="3" fill-opacity=".7"/><path d="M34 19 L38 6" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><circle cx="27" cy="48" r="2.6" fill-opacity=".45"/><circle cx="33" cy="51" r="2.6" fill-opacity=".45"/><circle cx="38" cy="47" r="2.6" fill-opacity=".45"/>' },
  coffee: { label: 'Coffee', emoji: '☕', svg: '<path d="M12 24 H44 V40 a12 12 0 0 1 -12 12 H24 a12 12 0 0 1 -12 -12 Z"/><path d="M44 28 h3 a7 7 0 0 1 0 14 h-4" fill="none" stroke="currentColor" stroke-width="3.6"/><rect x="10" y="54" width="36" height="4" rx="2" fill-opacity=".6"/><path d="M22 10 q3 4 0 8 M30 10 q3 4 0 8" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-opacity=".6"/>' },
  roll: { label: 'Cinnamon roll', emoji: '🥐', svg: '<circle cx="32" cy="32" r="22"/><path d="M32 32 m-3 0 a3 3 0 1 1 6 0 a7 7 0 1 1 -14 0 a11 11 0 1 1 22 0 a15 15 0 1 1 -30 0" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="2.8" stroke-linecap="round"/>' },
  donut: { label: 'Donut', emoji: '🍩', svg: '<path fill-rule="evenodd" d="M32 10 a22 22 0 1 1 0 44 a22 22 0 1 1 0 -44 Z M32 25 a7 7 0 1 0 0 14 a7 7 0 1 0 0 -14 Z"/><path d="M20 22 l3 2 M42 20 l-2 3 M46 36 l-3 1 M19 40 l3 -1 M30 46 l2 3" stroke="#000" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>' },
  cookie: { label: 'Cookie', emoji: '🍪', svg: '<path d="M32 10 a22 22 0 1 0 22 22 a8 8 0 0 1 -9 -9 a8 8 0 0 1 -9 -9 a8 8 0 0 1 -4 -4 Z"/><circle cx="24" cy="26" r="2.6" fill-opacity=".45"/><circle cx="30" cy="40" r="2.6" fill-opacity=".45"/><circle cx="20" cy="38" r="2" fill-opacity=".45"/><circle cx="41" cy="42" r="2.4" fill-opacity=".45"/>' },
  cake: { label: 'Cake', emoji: '🍰', svg: '<rect x="12" y="30" width="40" height="24" rx="4"/><rect x="12" y="38" width="40" height="4" fill-opacity=".55"/><path d="M12 32 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0 q5 -8 10 0" fill-opacity=".7"/><rect x="30" y="14" width="4" height="12" rx="2"/><circle cx="32" cy="11" r="3" fill-opacity=".6"/>' },
  cupcake: { label: 'Cupcake', emoji: '🧁', svg: '<path d="M16 34 H48 L44 56 H20 Z"/><path d="M14 34 a18 14 0 0 1 36 0 Z" fill-opacity=".7"/><circle cx="32" cy="14" r="4"/>' },
  icecream: { label: 'Ice cream', emoji: '🍦', svg: '<path d="M20 30 H44 L32 58 Z"/><circle cx="32" cy="22" r="13" fill-opacity=".75"/>' },
  pie: { label: 'Pie / tart', emoji: '🥧', svg: '<path d="M8 34 H56 L50 50 H14 Z"/><path d="M10 34 a22 12 0 0 1 44 0 Z" fill-opacity=".7"/><path d="M20 28 l6 -6 M30 26 l6 -6 M40 28 l4 -4" stroke="#000" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>' },
  taco: { label: 'Taco', emoji: '🌮', svg: '<path d="M8 48 a24 24 0 0 1 48 0 Z"/><path d="M14 40 q6 -8 12 -2 q6 -8 12 -2 q6 -8 12 0" fill="none" stroke="currentColor" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>' },
  fries: { label: 'Fries', emoji: '🍟', svg: '<rect x="20" y="10" width="5" height="26" rx="2" fill-opacity=".7"/><rect x="27" y="7" width="5" height="28" rx="2" fill-opacity=".7"/><rect x="34" y="9" width="5" height="26" rx="2" fill-opacity=".7"/><rect x="41" y="13" width="5" height="22" rx="2" fill-opacity=".7"/><path d="M14 30 H50 L45 56 H19 Z"/>' },
  hotdog: { label: 'Hot dog', emoji: '🌭', svg: '<rect x="6" y="26" width="52" height="12" rx="6" fill-opacity=".6"/><rect x="10" y="30" width="44" height="18" rx="9"/><path d="M14 30 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 8 0 q4 -4 6 0" fill="none" stroke="currentColor" stroke-width="2.4" stroke-opacity=".5"/>' },
  sandwich: { label: 'Sandwich', emoji: '🥪', svg: '<path d="M10 50 L32 12 L54 50 Z"/><path d="M14 44 H50" stroke="#000" stroke-opacity=".18" stroke-width="4"/><rect x="8" y="50" width="48" height="6" rx="3" fill-opacity=".6"/>' },
  noodles: { label: 'Noodles / ramen', emoji: '🍜', svg: '<path d="M8 30 H56 a24 22 0 0 1 -48 0 Z"/><path d="M38 6 L30 30 M46 8 L36 30" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-opacity=".6"/><rect x="22" y="52" width="20" height="4" rx="2"/>' },
  sushi: { label: 'Sushi', emoji: '🍣', svg: '<rect x="10" y="30" width="44" height="18" rx="9"/><path d="M12 32 q20 -16 40 0 Z" fill-opacity=".6"/><rect x="28" y="30" width="8" height="18" fill-opacity=".45"/>' },
  chicken: { label: 'Chicken', emoji: '🍗', svg: '<ellipse cx="26" cy="28" rx="16" ry="18" transform="rotate(-35 26 28)"/><rect x="36" y="38" width="7" height="18" rx="3" transform="rotate(-45 40 47)" fill-opacity=".7"/><circle cx="51" cy="50" r="4" fill-opacity=".7"/><circle cx="47" cy="54" r="4" fill-opacity=".7"/>' },
  egg: { label: 'Breakfast', emoji: '🍳', svg: '<path d="M14 26 q-6 14 8 22 q8 6 18 2 q14 -4 10 -18 q-2 -10 -14 -12 q-14 -4 -22 6 Z"/><circle cx="32" cy="32" r="8" fill-opacity=".55"/>' },
  bread: { label: 'Bread / pastry', emoji: '🍞', svg: '<path d="M12 28 a10 10 0 0 1 4 -14 H48 a10 10 0 0 1 4 14 V52 H12 Z"/><path d="M24 22 v6 M32 22 v6 M40 22 v6" stroke="#000" stroke-opacity=".18" stroke-width="2.6" stroke-linecap="round"/>' },
  cheese: { label: 'Cheese', emoji: '🧀', svg: '<path d="M8 30 L46 14 L56 30 V50 H8 Z"/><circle cx="22" cy="40" r="4" fill-opacity=".5"/><circle cx="40" cy="38" r="3" fill-opacity=".5"/><circle cx="46" cy="46" r="2" fill-opacity=".5"/>' },
  strawberry: { label: 'Strawberry', emoji: '🍓', svg: '<path d="M32 58 C14 46 10 30 16 22 C22 16 42 16 48 22 C54 30 50 46 32 58 Z"/><path d="M20 20 L32 12 L44 20 L36 22 L32 18 L28 22 Z" fill-opacity=".6"/><circle cx="26" cy="32" r="1.6" fill="#000" fill-opacity=".2"/><circle cx="36" cy="30" r="1.6" fill="#000" fill-opacity=".2"/><circle cx="31" cy="40" r="1.6" fill="#000" fill-opacity=".2"/><circle cx="40" cy="40" r="1.6" fill="#000" fill-opacity=".2"/><circle cx="24" cy="42" r="1.6" fill="#000" fill-opacity=".2"/>' },
  cocktail: { label: 'Drink', emoji: '🍸', svg: '<path d="M10 14 H54 L32 36 Z"/><rect x="30" y="34" width="4" height="18" rx="2"/><rect x="20" y="52" width="24" height="4" rx="2"/><circle cx="44" cy="12" r="5" fill-opacity=".6"/>' },
  bowl: { label: 'Bowl / salad', emoji: '🥗', svg: '<circle cx="22" cy="26" r="8" fill-opacity=".6"/><circle cx="34" cy="22" r="9" fill-opacity=".6"/><circle cx="44" cy="28" r="7" fill-opacity=".6"/><path d="M8 32 H56 a24 20 0 0 1 -48 0 Z"/>' },
  plate: { label: 'Other', emoji: '🍽️', svg: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="13" fill="#000" fill-opacity=".1"/>' },
};
const EMOJI_TO_ICON = Object.fromEntries(Object.entries(FOOD_ICONS).map(([k, v]) => [v.emoji, k]));
EMOJI_TO_ICON['🍦'] = 'icecream'; EMOJI_TO_ICON['🍨'] = 'icecream'; EMOJI_TO_ICON['🍧'] = 'icecream';
EMOJI_TO_ICON['🥯'] = 'bread'; EMOJI_TO_ICON['🥨'] = 'bread'; EMOJI_TO_ICON['🍵'] = 'coffee';
EMOJI_TO_ICON['🍺'] = 'cocktail'; EMOJI_TO_ICON['🍷'] = 'cocktail'; EMOJI_TO_ICON['🍹'] = 'cocktail';
EMOJI_TO_ICON['🌯'] = 'taco'; EMOJI_TO_ICON['🍲'] = 'noodles'; EMOJI_TO_ICON['🍝'] = 'noodles'; EMOJI_TO_ICON['🍛'] = 'bowl';
EMOJI_TO_ICON['🥞'] = 'egg'; EMOJI_TO_ICON['🧇'] = 'egg'; EMOJI_TO_ICON['🍱'] = 'sushi'; EMOJI_TO_ICON['🥟'] = 'sushi';

/* Illustrated avatar, in the same grey style. */
const AVATAR_SVG = `<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs><clipPath id="av-clip"><circle cx="100" cy="100" r="96"/></clipPath></defs>
  <circle class="av-bg" cx="100" cy="100" r="96"/>
  <g clip-path="url(#av-clip)">
    <path class="av-shirt" d="M44 210 C44 168 70 152 100 152 C130 152 156 168 156 210 Z"/>
    <rect x="88" y="128" width="24" height="30" rx="8" fill="#E9C2AC"/>
    <circle class="av-hair" cx="66" cy="44" r="20"/>
    <circle cx="80" cy="34" r="6" fill="#6E5268"/>
    <ellipse class="av-hair" cx="100" cy="86" rx="54" ry="52"/>
    <circle cx="55" cy="102" r="10" fill="#E9C2AC"/>
    <circle cx="145" cy="102" r="10" fill="#E9C2AC"/>
    <ellipse cx="100" cy="100" rx="44" ry="46" fill="#F2D4C2"/>
    <path d="M56 84 C58 52 80 42 100 42 C124 42 144 56 144 78 C128 64 112 60 98 58 C86 64 72 74 56 84 Z" class="av-hair"/>
    <path d="M74 92 h18 M108 92 h18" stroke="#5B4256" stroke-width="4" stroke-linecap="round"/>
    <path d="M76 97 a7 5 0 0 0 14 0 M110 97 a7 5 0 0 0 14 0" fill="#5B4256"/>
    <path d="M100 98 v18" stroke="#DDB29C" stroke-width="4" stroke-linecap="round"/>
    <circle cx="72" cy="114" r="8" fill="#E9A68C"/>
    <circle cx="128" cy="114" r="8" fill="#E9A68C"/>
    <rect x="88" y="122" width="24" height="10" rx="5" fill="#fff"/>
    <circle cx="100" cy="142" r="3" fill="#E9A68C"/>
  </g>
</svg>`;
