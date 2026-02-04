const { execSync } = require('child_process');

// Pegar argumento (dev ou prod)
// process.argv[2] é o primeiro argumento passado para o script
const env = process.argv[2];

// Se não passou argumento, usar prod como padrão
const mode = (env === 'dev') ? 'dev' : 'prod';

// Definir qual arquivo .env usar
let envFile;
let envName;

if (mode === 'dev') {
  envFile = '.env.development';
  envName = 'DESENVOLVIMENTO (localhost)';
} else {
  envFile = '.env.production';
  envName = 'PRODUÇÃO (api.agrosystemapp.com)';
}

console.log(`\n🚀 AgroVendas - Iniciando em modo ${envName}\n`);

// Copiar o arquivo .env correto
const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '..', envFile);
const targetFile = path.join(__dirname, '..', '.env');

if (fs.existsSync(sourceFile)) {
  const content = fs.readFileSync(sourceFile, 'utf8');
  fs.writeFileSync(targetFile, content);
  
  // Remover .env.development e .env.production temporariamente para forçar uso do .env
  const devFile = path.join(__dirname, '..', '.env.development');
  const prodFile = path.join(__dirname, '..', '.env.production');
  const devBackup = path.join(__dirname, '..', '.env.development.backup');
  const prodBackup = path.join(__dirname, '..', '.env.production.backup');
  
  if (fs.existsSync(devFile)) fs.renameSync(devFile, devBackup);
  if (fs.existsSync(prodFile)) fs.renameSync(prodFile, prodBackup);
  
  console.log(`✅ Usando configurações de ${mode === 'dev' ? 'desenvolvimento' : 'produção'}\n`);
} else {
  console.log(`⚠️  Arquivo ${envFile} não encontrado, usando configuração padrão\n`);
}

// Iniciar o Expo
try {
  execSync('npx expo start --clear', { stdio: 'inherit' });
} catch (error) {
  console.error('Erro ao iniciar o Expo:', error);
} finally {
  // Restaurar arquivos .env.development e .env.production
  const devBackup = path.join(__dirname, '..', '.env.development.backup');
  const prodBackup = path.join(__dirname, '..', '.env.production.backup');
  const devFile = path.join(__dirname, '..', '.env.development');
  const prodFile = path.join(__dirname, '..', '.env.production');
  
  if (fs.existsSync(devBackup)) fs.renameSync(devBackup, devFile);
  if (fs.existsSync(prodBackup)) fs.renameSync(prodBackup, prodFile);
}
