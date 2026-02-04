const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 AgroVendas - Inicialização\n');

rl.question('Escolha o ambiente (1 para DEV, 2 para PROD): ', (answer) => {
  const envFile = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envFile, 'utf8');

  if (answer === '1') {
    console.log('\n✅ Iniciando em modo DESENVOLVIMENTO (localhost)\n');
    envContent = envContent.replace(/EXPO_PUBLIC_ENV=.*/g, 'EXPO_PUBLIC_ENV=development');
  } else if (answer === '2') {
    console.log('\n✅ Iniciando em modo PRODUÇÃO (agrosystemapp.com)\n');
    envContent = envContent.replace(/EXPO_PUBLIC_ENV=.*/g, 'EXPO_PUBLIC_ENV=production');
  } else {
    console.log('\n⚠️  Opção inválida! Usando DEV por padrão.\n');
    envContent = envContent.replace(/EXPO_PUBLIC_ENV=.*/g, 'EXPO_PUBLIC_ENV=development');
  }

  fs.writeFileSync(envFile, envContent);
  
  rl.close();
  
  // Iniciar o Expo
  try {
    execSync('npx expo start', { stdio: 'inherit' });
  } catch (error) {
    console.error('Erro ao iniciar o Expo:', error);
    process.exit(1);
  }
});
