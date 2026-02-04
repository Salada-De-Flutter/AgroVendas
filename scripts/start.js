const { execSync } = require('child_process');

// Pegar todos os argumentos
const args = process.argv.slice(2);
const mode = args[0]; // 'dev' ou 'prod'
const hasTunnel = args.includes('--tunnel') || args.includes('-t');

// Configurar ambiente
if (mode === 'prod') {
  console.log('\n🚀 Modo PRODUÇÃO - Usando API: https://api.agrosystemapp.com/api\n');
  process.env.EXPO_PUBLIC_USE_PROD_API = 'true';
} else {
  console.log('\n🛠️  Modo DESENVOLVIMENTO - Usando API: http://localhost:3000/api\n');
  process.env.EXPO_PUBLIC_USE_PROD_API = 'false';
}

// Montar comando
const tunnelFlag = hasTunnel ? ' --tunnel' : '';
const command = `npx expo start --clear${tunnelFlag}`;

console.log(`Executando: ${command}\n`);

// Executar
execSync(command, { 
  stdio: 'inherit',
  env: { ...process.env }
});
