import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Names returned by Better Design's Iconoir search. Fetch once at build time;
// no icon CDN or network dependency exists in the running application.
const names = ['home', 'user', 'user-circle', 'group', 'book', 'book-stack', 'open-book', 'calendar', 'calendar-check', 'check', 'check-circle', 'shield-check', 'wallet', 'candlestick-chart', 'bell', 'arrow-right', 'arrow-left', 'arrow-down', 'search', 'menu', 'eye', 'eye-closed', 'graduation-cap', 'plus', 'user-plus'];
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = path.join(root, 'src/components/icons');
await mkdir(destination, { recursive: true });
const exports = [];
for (const name of names) {
  const response = await fetch(`https://api.iconify.design/iconoir/${name}.svg`);
  if (!response.ok) throw new Error(`Icon ${name}: HTTP ${response.status}`);
  const svg = await response.text();
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  if (!viewBox || /<script|foreignObject|href=/i.test(svg)) throw new Error(`Unexpected icon source: ${name}`);
  const body = svg.replace(/^.*?<svg\b[^>]*>/s, '').replace(/<\/svg>\s*$/, '')
    .replace(/stroke-width=/g, 'strokeWidth=').replace(/stroke-linecap=/g, 'strokeLinecap=')
    .replace(/stroke-linejoin=/g, 'strokeLinejoin=').replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=');
  const component = name.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('') + 'Icon';
  await writeFile(path.join(destination, `${component}.tsx`), `import type { SVGProps } from 'react';\nexport function ${component}(props: SVGProps<SVGSVGElement>) { return <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="24" height="24" aria-hidden="true" focusable="false" {...props}>${body}</svg>; }\n`);
  exports.push(`export { ${component} } from './${component}';`);
}
await writeFile(path.join(destination, 'index.ts'), exports.join('\n') + '\n');
console.log(`Installed ${names.length} verified Iconoir icons.`);
