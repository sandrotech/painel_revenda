const fs = require('fs');

const content = fs.readFileSync('fuze_pro.html', 'utf8');

const cssMatch = content.match(/<style>([\s\S]*?)<\/style>/);
if(cssMatch) {
  fs.writeFileSync('public/css/style.css', cssMatch[1].trim());
  console.log('CSS extracted');
}

// O regex de script pode ser complicado se houver mais de um. 
// No caso, sabemos que o script principal é o último antes do </body>
const scriptParts = content.split('<script>');
if (scriptParts.length >= 2) {
  // O último script
  const lastScript = scriptParts[scriptParts.length - 1];
  const jsMatch = lastScript.match(/([\s\S]*?)<\/script>/);
  if (jsMatch) {
    fs.writeFileSync('public/js/app.js', jsMatch[1].trim());
    console.log('JS extracted');
  }
}

// Replace
let newHtml = content.replace(/<style>[\s\S]*?<\/style>/, '<link rel="stylesheet" href="/css/style.css">');
// Remover o ultimo script 
const htmlParts = newHtml.split('<script>');
const lastPart = htmlParts.pop(); // tira o ultimo script
// Junta o resto e coloca o script novo
newHtml = htmlParts.join('<script>') + '<script src="/js/app.js"></script>\n' + lastPart.replace(/[\s\S]*?<\/script>/, '');

fs.writeFileSync('views/index.html', newHtml);
console.log('HTML extracted');
