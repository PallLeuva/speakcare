// No transpilation: copy the readable source into an inspectable source manifest.
// Build a standard ZIP using Node's built-in APIs, with no npm dependencies.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
const paths=['README.md','package.json','.gitignore','.devcontainer/devcontainer.json',
  'dist/index.html','dist/app.js','dist/data.js','dist/compose.js','dist/styles.css','dist/layout.css','dist/favicon.svg',
  'dist/source.html','dist/source.js','dist/source.css','scripts/server.mjs','scripts/build.mjs','scripts/start-codespace.sh','tests/compose.test.mjs'];
const files={};
for(const path of paths) files[path]=await readFile(new URL('../'+path,import.meta.url),'utf8');
await writeFile(new URL('../dist/source-code.json',import.meta.url),JSON.stringify(files,null,2));

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
const local=[],central=[];
let offset=0;
for(const [path,contents] of Object.entries(files)){
  const name=Buffer.from('speakcare/'+path),data=Buffer.from(contents),compressed=deflateRawSync(data),crc=crc32(data);
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(23585,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(compressed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(name.length,26);
  local.push(header,name,compressed);
  const entry=Buffer.alloc(46);entry.writeUInt32LE(0x02014b50,0);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt16LE(23585,14);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(compressed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42);central.push(entry,name);
  offset+=header.length+name.length+compressed.length;
}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(paths.length,8);end.writeUInt16LE(paths.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);
await writeFile(new URL('../dist/SpeakCare-source.zip',import.meta.url),Buffer.concat([...local,directory,end]));
// GitHub Pages can publish /docs directly from main without an Actions workflow.
await mkdir(new URL('../docs/', import.meta.url), {recursive:true});
const publicFiles=[...paths.filter(path=>path.startsWith('dist/')).map(path=>path.slice(5)), 'source-code.json','SpeakCare-source.zip'];
for(const name of publicFiles) await copyFile(new URL('../dist/'+name,import.meta.url),new URL('../docs/'+name,import.meta.url));
await writeFile(new URL('../docs/.nojekyll',import.meta.url),'');
console.log(`SpeakCare is ready: ${paths.length} source files, source viewer and ZIP. GitHub Pages output: docs/.`);
