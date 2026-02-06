# 📦 API - Cadastro de Venda PARCELADA

## ⚠️ Status: IMPLEMENTADO
**Tipo de Venda:** `parcelado`  
**Prioridade:** Alta - Em desenvolvimento  
**Outros tipos** (à vista dinheiro, à vista agendado): Não implementados ainda

---

## Endpoint
```
POST /api/vendas
```

## Autenticação
```
Authorization: Bearer {token}
```

---

## 📥 Dados Enviados (FormData)

### Campos Obrigatórios

| Campo | Tipo | Valor | Descrição | Exemplo |
|-------|------|-------|-----------|---------|
| `clienteId` | string | Obrigatório | ID do cliente selecionado | "123" |
| `valor` | string | Obrigatório | Valor total da venda (formato: 0000.00) | "1500.50" |
| `parcelas` | string | Obrigatório | Quantidade de parcelas (1-60) | "12" |
| `dataVencimento` | string | Obrigatório | Data de venc. da 1ª parcela (DD/MM/AAAA) | "15/03/2026" |
| `descricao` | string | Obrigatório | Descrição/produtos vendidos | "Adubo 50kg" |
| `numeroFicha` | string | Obrigatório | Número da ficha física | "A-001" |
| `vendedorId` | string | Obrigatório | ID do vendedor (do token) | "5" |
| `tipoVenda` | string | Obrigatório | Tipo fixo: **"parcelado"** | "parcelado" |
| `rotaId` | string | Obrigatório | ID da rota selecionada | "1" |
| `fotoFicha` | File/Blob | Obrigatório | Foto da ficha (JPG/PNG, vertical) | (binário) |

---

## 📋 Exemplo de Requisição

### JavaScript/React Native (FormData):
```javascript
const formData = new FormData();

// Dados da venda
formData.append('clienteId', '123');
formData.append('valor', '1500.50');           // Sem R$, apenas números e ponto
formData.append('parcelas', '12');             // Sempre >= 1
formData.append('dataVencimento', '15/03/2026'); // DD/MM/AAAA
formData.append('descricao', 'Adubo 50kg + Semente de milho');
formData.append('numeroFicha', 'A-001');
formData.append('vendedorId', '5');
formData.append('tipoVenda', 'parcelado');     // FIXO
formData.append('rotaId', '1');

// Foto da ficha
formData.append('fotoFicha', {
  uri: 'file:///path/to/photo.jpg',
  name: 'ficha_A001.jpg',
  type: 'image/jpeg'
});

// Fazer requisição
const response = await fetch('http://localhost:3000/api/vendas', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
  body: formData,
});
```

### cURL Example:
```bash
curl -X POST http://localhost:3000/api/vendas \
  -H "Authorization: Bearer SEU_TOKEN" \
  -F "clienteId=123" \
  -F "valor=1500.50" \
  -F "parcelas=12" \
  -F "dataVencimento=15/03/2026" \
  -F "descricao=Adubo 50kg + Semente de milho" \
  -F "numeroFicha=A-001" \
  -F "vendedorId=5" \
  -F "tipoVenda=parcelado" \
  -F "rotaId=1" \
  -F "fotoFicha=@/path/to/ficha.jpg"
```

---

## 🔄 Processamento no Backend

### 1️⃣ Validações
```javascript
// Validar campos obrigatórios
if (!clienteId || !valor || !parcelas || !dataVencimento || 
    !descricao || !numeroFicha || !vendedorId || !tipoVenda || 
    !rotaId || !fotoFicha) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Campos obrigatórios faltando'
  });
}

// Validar tipo de venda
if (tipoVenda !== 'parcelado') {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Tipo de venda inválido. Use: parcelado'
  });
}

// Validar valor
const valorNumerico = parseFloat(valor);
if (isNaN(valorNumerico) || valorNumerico <= 0) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Valor da venda inválido'
  });
}

// Validar parcelas
const numeroParcelas = parseInt(parcelas);
if (isNaN(numeroParcelas) || numeroParcelas < 1 || numeroParcelas > 60) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Número de parcelas deve ser entre 1 e 60'
  });
}

// Validar data
const [dia, mes, ano] = dataVencimento.split('/');
const dataObj = new Date(`${ano}-${mes}-${dia}`);
if (isNaN(dataObj.getTime())) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Data de vencimento inválida'
  });
}

// Validar se data não é passada
if (dataObj < new Date()) {
  return res.status(400).json({
    sucesso: false,
    mensagem: 'Data de vencimento não pode ser no passado'
  });
}

// Verificar se cliente existe
const cliente = await db.query('SELECT * FROM clientes WHERE id = ?', [clienteId]);
if (!cliente) {
  return res.status(404).json({
    sucesso: false,
    mensagem: 'Cliente não encontrado'
  });
}

// Verificar se rota existe
const rota = await db.query('SELECT * FROM rotas WHERE id = ?', [rotaId]);
if (!rota) {
  return res.status(404).json({
    sucesso: false,
    mensagem: 'Rota não encontrada'
  });
}

// Verificar se número da ficha já existe
const fichaExiste = await db.query('SELECT id FROM vendas WHERE numero_ficha = ?', [numeroFicha]);
if (fichaExiste) {
  return res.status(409).json({
    sucesso: false,
    mensagem: 'Já existe uma venda com este número de ficha'
  });
}
```

### 2️⃣ Calcular Parcelas
```javascript
const valorTotal = parseFloat(valor);
const numParcelas = parseInt(parcelas);

// Calcular valor base da parcela
const valorBase = Math.floor((valorTotal * 100) / numParcelas) / 100;

// Calcular centavos restantes
const somaParcelas = valorBase * numParcelas;
const centavosRestantes = Math.round((valorTotal - somaParcelas) * 100);

// Primeira parcela recebe os centavos extras
const valorPrimeiraParcela = valorBase + (centavosRestantes / 100);

console.log('Cálculo de parcelas:');
console.log(`  Valor total: R$ ${valorTotal.toFixed(2)}`);
console.log(`  Parcelas: ${numParcelas}x`);
console.log(`  Valor base: R$ ${valorBase.toFixed(2)}`);
console.log(`  1ª parcela: R$ ${valorPrimeiraParcela.toFixed(2)}`);
console.log(`  Demais: R$ ${valorBase.toFixed(2)}`);
```

### 3️⃣ Criar Cobranças no Asaas
```javascript
const [dia, mes, ano] = dataVencimento.split('/');
const dataPrimeiroVenc = new Date(`${ano}-${mes}-${dia}`);

const parcelas = [];

for (let i = 0; i < numParcelas; i++) {
  // Calcular data de vencimento desta parcela
  const dataVenc = new Date(dataPrimeiroVenc);
  dataVenc.setMonth(dataVenc.getMonth() + i);
  
  // Ajustar se dia não existe no mês (ex: 31/02)
  if (dataVenc.getDate() !== parseInt(dia)) {
    dataVenc.setDate(0); // Último dia do mês anterior
  }
  
  // Valor: primeira parcela com centavos extras, demais valor base
  const valorParcela = i === 0 ? valorPrimeiraParcela : valorBase;
  
  // Criar cobrança no Asaas
  const cobranca = await asaasApi.post('/payments', {
    customer: cliente.asaasCustomerId,
    billingType: 'BOLETO',
    value: valorParcela,
    dueDate: dataVenc.toISOString().split('T')[0],
    description: `${descricao} - Parcela ${i + 1}/${numParcelas}`,
    externalReference: `FICHA-${numeroFicha}-P${i + 1}`,
  });
  
  parcelas.push({
    numero: i + 1,
    valor: valorParcela,
    dataVencimento: dataVenc.toISOString().split('T')[0],
    asaasPaymentId: cobranca.data.id,
    status: 'PENDENTE',
    linkBoleto: cobranca.data.bankSlipUrl,
    linkPix: cobranca.data.invoiceUrl,
  });
}
```

### 4️⃣ Upload da Foto
```javascript
// Criar nome único para arquivo
const timestamp = Date.now();
const extensao = fotoFicha.originalname.split('.').pop();
const nomeArquivo = `ficha_${numeroFicha.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${extensao}`;

// Salvar arquivo (exemplo com multer)
const caminhoFoto = `/uploads/fichas/${nomeArquivo}`;
await fs.promises.writeFile(`./public${caminhoFoto}`, fotoFicha.buffer);

// URL pública
const fotoUrl = `${process.env.API_URL}${caminhoFoto}`;
```

### 5️⃣ Salvar no Banco de Dados
```sql
-- Inserir venda
INSERT INTO vendas (
  cliente_id,
  vendedor_id,
  rota_id,
  tipo_venda,
  valor_total,
  numero_parcelas,
  descricao,
  numero_ficha,
  foto_ficha_url,
  data_vencimento_primeira,
  status,
  created_at
) VALUES (
  123,
  5,
  1,
  'parcelado',
  1500.50,
  12,
  'Adubo 50kg + Semente de milho',
  'A-001',
  'https://api.com/uploads/fichas/ficha_A001_1234567.jpg',
  '2026-03-15',
  'ATIVA',
  NOW()
)
RETURNING id;

-- Inserir parcelas
INSERT INTO parcelas (
  venda_id,
  numero_parcela,
  valor,
  data_vencimento,
  status,
  asaas_payment_id,
  link_boleto,
  link_pix
) VALUES
  (venda_id, 1, 125.04, '2026-03-15', 'PENDENTE', 'pay_abc1', 'https://...', 'https://...'),
  (venda_id, 2, 125.04, '2026-04-15', 'PENDENTE', 'pay_abc2', 'https://...', 'https://...'),
  (venda_id, 3, 125.04, '2026-05-15', 'PENDENTE', 'pay_abc3', 'https://...', 'https://...'),
  ... (demais parcelas)
```

---

## 📤 Resposta Esperada

### ✅ Sucesso (200)
```json
{
  "sucesso": true,
  "mensagem": "Venda parcelada cadastrada com sucesso",
  "venda": {
    "id": 456,
    "clienteId": 123,
    "clienteNome": "João Silva",
    "clienteCpf": "12345678901",
    "vendedorId": 5,
    "vendedorNome": "Maria Santos",
    "rotaId": 1,
    "rotaNome": "Rota Padrão",
    "tipoVenda": "parcelado",
    "valorTotal": 1500.50,
    "numeroParcelas": 12,
    "descricao": "Adubo 50kg + Semente de milho",
    "numeroFicha": "A-001",
    "fotoFichaUrl": "https://api.com/uploads/fichas/ficha_A001_1234567.jpg",
    "dataVencimentoPrimeira": "2026-03-15",
    "status": "ATIVA",
    "criadoEm": "2026-02-06T14:30:00Z",
    "parcelas": [
      {
        "numero": 1,
        "valor": 125.04,
        "dataVencimento": "2026-03-15",
        "status": "PENDENTE",
        "asaasPaymentId": "pay_abc1",
        "linkBoleto": "https://asaas.com/boleto/abc1",
        "linkPix": "https://asaas.com/pix/abc1"
      },
      {
        "numero": 2,
        "valor": 125.04,
        "dataVencimento": "2026-04-15",
        "status": "PENDENTE",
        "asaasPaymentId": "pay_abc2",
        "linkBoleto": "https://asaas.com/boleto/abc2",
        "linkPix": "https://asaas.com/pix/abc2"
      }
      // ... demais parcelas
    ]
  }
}
```

### ❌ Erros Possíveis

**Validação (400)**
```json
{
  "sucesso": false,
  "mensagem": "Número de parcelas deve ser entre 1 e 60"
}
```

**Cliente não encontrado (404)**
```json
{
  "sucesso": false,
  "mensagem": "Cliente não encontrado"
}
```

**Ficha duplicada (409)**
```json
{
  "sucesso": false,
  "mensagem": "Já existe uma venda com este número de ficha"
}
```

**Erro no Asaas (500)**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar cobranças no Asaas: Customer not found"
}
```

---

## 🔒 Regras de Negócio

### Parcelas
- ✅ Mínimo: 1 parcela
- ✅ Máximo: 60 parcelas
- ✅ Primeira parcela recebe centavos extras da divisão
- ✅ Demais parcelas: valor igual

### Datas
- ✅ Data de vencimento da 1ª parcela não pode ser passada
- ✅ Demais parcelas: +1 mês, +2 meses, etc.
- ✅ Se dia não existe no mês (ex: 31/02), usar último dia do mês

### Asaas
- ✅ Criar todas as parcelas no Asaas
- ✅ billingType: 'BOLETO' (posteriormente pode ser PIX ou CREDIT_CARD)
- ✅ externalReference: FICHA-{numeroFicha}-P{numeroParcela}
- ✅ Guardar: asaasPaymentId, linkBoleto, linkPix

### Foto da Ficha
- ✅ Formatos aceitos: JPG, JPEG, PNG
- ✅ Tamanho máximo: 5MB
- ✅ Armazenar com nome único (evitar conflitos)
- ✅ Foto deve ser vertical (3:4)

### Número da Ficha
- ✅ Deve ser único no sistema
- ✅ Validar antes de criar a venda

---

## 🧪 Testando

### 1. Teste Básico (12 parcelas)
```bash
curl -X POST http://localhost:3000/api/vendas \
  -H "Authorization: Bearer TOKEN" \
  -F "clienteId=1" \
  -F "valor=1200.00" \
  -F "parcelas=12" \
  -F "dataVencimento=15/03/2026" \
  -F "descricao=Teste venda parcelada" \
  -F "numeroFicha=TEST-001" \
  -F "vendedorId=1" \
  -F "tipoVenda=parcelado" \
  -F "rotaId=1" \
  -F "fotoFicha=@ficha.jpg"
```

**Resultado esperado:** 12 parcelas de R$ 100,00

### 2. Teste com Centavos (10 parcelas de R$ 155,55)
```bash
# Valor total: R$ 1555.55
# 10 parcelas = R$ 155,55 cada
# Centavos: 1555.55 / 10 = 155.555 → 155.55 + 0.05 centavos extras
# 1ª parcela: R$ 155.60
# Demais: R$ 155.55
```

### 3. Teste de Validação
```bash
# Parcelas inválidas (61)
-F "parcelas=61"  # Deve retornar erro

# Data passada
-F "dataVencimento=01/01/2025"  # Deve retornar erro

# Valor zero
-F "valor=0.00"  # Deve retornar erro
```

---

## 📊 Tabelas do Banco (Estrutura Recomendada)

### Tabela: vendas
```sql
CREATE TABLE vendas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cliente_id INT NOT NULL,
  vendedor_id INT NOT NULL,
  rota_id INT NOT NULL,
  tipo_venda ENUM('vista_dinheiro', 'vista_agendado', 'parcelado') NOT NULL,
  valor_total DECIMAL(10, 2) NOT NULL,
  numero_parcelas INT NOT NULL,
  descricao TEXT NOT NULL,
  numero_ficha VARCHAR(50) UNIQUE NOT NULL,
  foto_ficha_url VARCHAR(255) NOT NULL,
  data_vencimento_primeira DATE NOT NULL,
  status ENUM('ATIVA', 'CANCELADA', 'CONCLUIDA') DEFAULT 'ATIVA',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (vendedor_id) REFERENCES vendedores(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id),
  
  INDEX idx_cliente (cliente_id),
  INDEX idx_vendedor (vendedor_id),
  INDEX idx_numero_ficha (numero_ficha),
  INDEX idx_tipo_venda (tipo_venda)
);
```

### Tabela: parcelas
```sql
CREATE TABLE parcelas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  venda_id INT NOT NULL,
  numero_parcela INT NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status ENUM('PENDENTE', 'PAGA', 'ATRASADA', 'CANCELADA') DEFAULT 'PENDENTE',
  asaas_payment_id VARCHAR(100),
  link_boleto VARCHAR(255),
  link_pix VARCHAR(255),
  data_pagamento DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (venda_id) REFERENCES vendas(id) ON DELETE CASCADE,
  
  INDEX idx_venda (venda_id),
  INDEX idx_status (status),
  INDEX idx_data_vencimento (data_vencimento),
  INDEX idx_asaas_payment_id (asaas_payment_id)
);
```

---

## 🚀 Próximos Passos

- [ ] Implementar endpoint POST /api/vendas para tipo "parcelado"
- [ ] Integrar com Asaas para criar cobranças
- [ ] Implementar upload de fotos
- [ ] Criar webhook para receber updates do Asaas
- [ ] Implementar endpoint GET /api/vendas (listar vendas)
- [ ] Implementar endpoint GET /api/vendas/:id (detalhes)
- [ ] Implementar endpoint GET /api/vendas/:id/pdf (gerar PDF do parcelamento)
- [ ] **Futuramente:** Implementar tipos "vista_dinheiro" e "vista_agendado"

---

## 📄 Gerar PDF do Parcelamento

### Endpoint
```
GET /api/vendas/:id/pdf
```

### Autenticação
```
Authorization: Bearer {token}
```

### Descrição
Gera e retorna um PDF com os detalhes completos da venda parcelada, incluindo:
- Dados do cliente
- Dados do vendedor
- Informações da venda (valor, descrição, número da ficha)
- Tabela com todas as parcelas (número, valor, vencimento, status)
- Links de pagamento (boleto e PIX) de cada parcela

### Exemplo de Requisição
```javascript
// Baixar PDF da venda
const response = await fetch(`http://localhost:3000/api/vendas/${vendaId}/pdf`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

if (response.ok) {
  const blob = await response.blob();
  // Processar blob do PDF
}
```

### Response Headers
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="venda_A001_parcelas.pdf"
```

### ✅ Sucesso (200)
Retorna arquivo PDF binário

### ❌ Erros

**Venda não encontrada (404)**
```json
{
  "sucesso": false,
  "mensagem": "Venda não encontrada"
}
```

**Não autorizado (401)**
```json
{
  "sucesso": false,
  "mensagem": "Token inválido ou expirado"
}
```

### 📋 Conteúdo do PDF

O PDF deve conter:

**Cabeçalho:**
- Logo da empresa (se houver)
- Título: "Comprovante de Parcelamento"
- Data de emissão

**Dados do Cliente:**
- Nome completo
- CPF
- Telefone
- Endereço

**Dados da Venda:**
- Número da Ficha
- Data da venda
- Vendedor responsável
- Rota
- Descrição dos produtos
- Valor total
- Número de parcelas

**Tabela de Parcelas:**
| Parcela | Vencimento | Valor | Status | Boleto | PIX |
|---------|------------|-------|--------|--------|-----|
| 1/12 | 15/03/2026 | R$ 125,04 | Pendente | [Link] | [Link] |
| 2/12 | 15/04/2026 | R$ 125,04 | Pendente | [Link] | [Link] |
| ... | ... | ... | ... | ... | ... |

**Rodapé:**
- Total: R$ 1.500,50
- Informações de contato
- Observações importantes

### 💡 Implementação Backend (Exemplo com PDFKit)

```javascript
const PDFDocument = require('pdfkit');

router.get('/vendas/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const vendaId = req.params.id;
    
    // Buscar venda com todas as relações
    const venda = await db.query(`
      SELECT 
        v.*,
        c.nome as cliente_nome,
        c.cpf as cliente_cpf,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        vend.nome as vendedor_nome,
        r.nome as rota_nome
      FROM vendas v
      JOIN clientes c ON v.cliente_id = c.id
      JOIN vendedores vend ON v.vendedor_id = vend.id
      JOIN rotas r ON v.rota_id = r.id
      WHERE v.id = ?
    `, [vendaId]);
    
    if (!venda) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Venda não encontrada'
      });
    }
    
    // Buscar parcelas
    const parcelas = await db.query(`
      SELECT * FROM parcelas 
      WHERE venda_id = ? 
      ORDER BY numero_parcela ASC
    `, [vendaId]);
    
    // Criar PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 
      `attachment; filename="venda_${venda.numero_ficha}_parcelas.pdf"`);
    
    // Pipe PDF para response
    doc.pipe(res);
    
    // Cabeçalho
    doc.fontSize(20).text('Comprovante de Parcelamento', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 
      { align: 'right' });
    doc.moveDown();
    
    // Dados do Cliente
    doc.fontSize(14).text('Dados do Cliente:', { underline: true });
    doc.fontSize(10);
    doc.text(`Nome: ${venda.cliente_nome}`);
    doc.text(`CPF: ${formatarCPF(venda.cliente_cpf)}`);
    doc.text(`Telefone: ${venda.cliente_telefone}`);
    doc.text(`Endereço: ${venda.cliente_endereco}`);
    doc.moveDown();
    
    // Dados da Venda
    doc.fontSize(14).text('Dados da Venda:', { underline: true });
    doc.fontSize(10);
    doc.text(`Número da Ficha: ${venda.numero_ficha}`);
    doc.text(`Data: ${new Date(venda.created_at).toLocaleDateString('pt-BR')}`);
    doc.text(`Vendedor: ${venda.vendedor_nome}`);
    doc.text(`Rota: ${venda.rota_nome}`);
    doc.text(`Descrição: ${venda.descricao}`);
    doc.moveDown();
    
    // Resumo Financeiro
    doc.fontSize(14).text('Resumo Financeiro:', { underline: true });
    doc.fontSize(10);
    doc.text(`Valor Total: R$ ${venda.valor_total.toFixed(2)}`);
    doc.text(`Parcelas: ${venda.numero_parcelas}x`);
    doc.moveDown();
    
    // Tabela de Parcelas
    doc.fontSize(14).text('Parcelas:', { underline: true });
    doc.fontSize(9);
    
    // Cabeçalho da tabela
    const tableTop = doc.y;
    doc.text('Nº', 50, tableTop);
    doc.text('Vencimento', 100, tableTop);
    doc.text('Valor', 200, tableTop);
    doc.text('Status', 280, tableTop);
    doc.text('Boleto/PIX', 350, tableTop);
    
    doc.moveDown();
    let yPosition = doc.y;
    
    // Linhas da tabela
    parcelas.forEach((parcela, index) => {
      doc.text(`${parcela.numero_parcela}/${venda.numero_parcelas}`, 50, yPosition);
      doc.text(new Date(parcela.data_vencimento).toLocaleDateString('pt-BR'), 
        100, yPosition);
      doc.text(`R$ ${parcela.valor.toFixed(2)}`, 200, yPosition);
      doc.text(parcela.status, 280, yPosition);
      doc.text('Ver QR Code', 350, yPosition);
      
      yPosition += 20;
      
      // Nova página se necessário
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });
    
    // Rodapé
    doc.fontSize(8).text(
      'Este documento é um comprovante de parcelamento. ' +
      'Para pagamento, utilize os links de boleto ou PIX disponíveis.',
      50, 750, { align: 'center', width: 500 }
    );
    
    // Finalizar PDF
    doc.end();
    
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao gerar PDF'
    });
  }
});

function formatarCPF(cpf) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
```

### 📱 Abrindo PDF no React Native

```javascript
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

async function baixarEAbrirPDF(vendaId, token) {
  try {
    // Baixar PDF
    const downloadUrl = `http://localhost:3000/api/vendas/${vendaId}/pdf`;
    const fileUri = FileSystem.documentDirectory + `venda_${vendaId}.pdf`;
    
    const downloadResult = await FileSystem.downloadAsync(
      downloadUrl,
      fileUri,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    
    console.log('PDF baixado em:', downloadResult.uri);
    
    // Verificar se o dispositivo suporta compartilhamento
    const canShare = await Sharing.isAvailableAsync();
    
    if (canShare) {
      // Abrir com app externo (visualizador de PDF, impressora, etc)
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Abrir PDF com...',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Erro', 'Não é possível abrir o PDF neste dispositivo');
    }
    
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    Alert.alert('Erro', 'Não foi possível baixar o PDF');
  }
}
```

---

**Desenvolvido para:** AgroVendas App  
**Tipo de Venda:** Parcelado (IMPLEMENTADO)  
**Versão:** 1.0  
**Data:** Fevereiro/2026
