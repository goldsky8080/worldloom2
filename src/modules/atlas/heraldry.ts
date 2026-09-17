import type { Crest } from './model';
const shields = [
  'M18 12H82V52Q82 76 50 91Q18 76 18 52Z',
  'M20 14H80V57L50 92L20 57Z',
  'M50 8L83 20V55Q79 78 50 92Q21 78 17 55V20Z',
  'M15 15Q50 2 85 15L79 60Q65 85 50 93Q35 85 21 60Z',
  'M22 10H78L88 42L76 71L50 91L24 71L12 42Z',
  'M18 13H82V63L65 86L50 94L35 86L18 63Z',
];
const sigils = [
  'M35 39L40 49L50 34L60 49L66 39V62H35Z',
  'M49 38V69M49 48L34 36L30 24M49 48L65 36L70 24M36 37L26 38M63 37L75 37M44 54L39 66M54 54L60 66',
  'M30 57L41 39L52 46L65 37L75 43L63 53L61 69L48 60L37 70Z',
  'M50 29L57 42L72 43L62 54L65 71L50 63L35 71L38 54L28 43L43 42Z',
  'M31 61H69L63 72H40ZM50 29V60M46 32L30 57H46ZM54 35L68 57H54Z',
  'M29 63L45 32L56 32L73 63H60L50 42L40 63ZM41 70H61',
  'M34 61L50 28L66 61ZM41 64L38 74M59 64L62 74',
  'M28 49H72M50 27V73M33 32L67 68M33 68L67 32',
  'M31 67V40L50 29L69 40V67ZM44 67V53H56V67',
  'M31 60L42 33L60 37L70 61L53 72Z',
  'M27 56Q50 23 74 56Q50 79 27 56ZM50 42V68',
  'M30 39L50 65L70 39M31 64L50 35L70 64',
  'M30 70L50 27L70 70M37 54H63',
  'M35 31H64L55 49L70 65L49 73L31 58L45 48Z',
  'M27 48L46 33L68 37L76 56L62 70L40 64Z',
  'M50 27L59 41L77 44L63 57L66 75L50 67L34 75L37 57L23 44L41 41Z',
  'M31 62Q33 31 50 33Q70 31 70 60L50 72Z',
  'M29 36H71V67H29ZM39 36V67M61 36V67M29 49H71',
  'M27 63L42 33L50 46L59 28L75 64Z',
  'M50 28L70 49L50 73L30 49Z',
];
const tails = [
  'M19 49L4 44V93L19 84ZM81 49L96 44V93L81 84Z',
  'M16 43L3 35L8 91L23 79ZM84 43L97 35L92 91L77 79Z',
  'M22 41L6 42V83L14 72L23 89ZM78 41L94 42V83L86 72L77 89Z',
  'M22 45L5 47L11 94L22 82ZM78 45L95 47L89 94L78 82Z',
  'M18 48L4 40L7 95L24 87ZM82 48L96 40L93 95L76 87Z',
];
export function crestSvg(crest: Crest) {
  const p = crest.primaryColor,
    s = crest.secondaryColor,
    shape = shields[crest.shield % 6],
    sigil = sigils[crest.sigil % 20],
    n = crest.pattern % 8;
  let pattern = '';
  if (n === 0) pattern = '<path d="M12 5H90V96H12Z" fill="' + p + '" opacity=".25"/>';
  if (n === 1) pattern = '<path d="M10 5H50V95H10Z" fill="' + p + '"/>';
  if (n === 2) pattern = '<path d="M5 34H95V61H5Z" fill="' + p + '"/>';
  if (n === 3) pattern = '<path d="M0 79L81 0L106 23L22 106Z" fill="' + p + '"/>';
  if (n === 4) pattern = '<path d="M5 60L50 24L95 60V82L50 47L5 82Z" fill="' + p + '"/>';
  if (n === 5) pattern = '<path d="M42 8H58V92H42ZM8 44H92V58H8Z" fill="' + p + '"/>';
  if (n === 6)
    for (let i = 0; i < 4; i++)
      pattern += '<path d="M' + (18 + i * 18) + ' 9V95" stroke="' + p + '" stroke-width="8"/>';
  if (n === 7)
    for (let y = 20; y < 80; y += 20)
      for (let x = 20; x < 80; x += 20)
        pattern += '<rect x="' + x + '" y="' + y + '" width="10" height="10" fill="' + p + '"/>';
  const ornament =
    crest.ornament === 0
      ? ''
      : '<path d="M32 14L30 ' +
        (4 + crest.ornament) +
        'L41 10L50 1L59 10L70 ' +
        (4 + crest.ornament) +
        'L68 14Z" fill="#cab67c" stroke="#263d37" stroke-width="2"/>';
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><clipPath id="shield"><path d="' +
    shape +
    '"/></clipPath></defs><path d="' +
    tails[crest.banner % 5] +
    '" fill="' +
    p +
    '" stroke="#182e2b" stroke-width="2"/><path d="' +
    shape +
    '" fill="' +
    s +
    '"/><g clip-path="url(#shield)">' +
    pattern +
    '</g><path d="' +
    shape +
    '" fill="none" stroke="#cab67c" stroke-width="2.5"/><path d="' +
    sigil +
    '" fill="none" stroke="#eee1b6" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>' +
    ornament +
    '</svg>'
  );
}
export const crestDataUrl = (crest: Crest) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(crestSvg(crest));
