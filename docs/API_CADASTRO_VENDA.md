# 📝 API - Cadastro de Venda

## Endpoint
```
POST /api/vendas
```

## Autenticação
```
Authorization: Bearer {token}
```
O token JWT do vendedor autenticado.

---

## 📥 Dados Recebidos (FormData)

| Campo | Tipo | Obrigatório | Descrição | Exemplo |
|-------|------|-------------|-----------|---------|
| `clienteId` | string | ✅ | ID do cliente | "123" |
| `valor` | string | ✅ | Valor total da venda (decimal) | "1500.50" |
| `parcelas` | string | ✅ | Quantidade de parcelas | "12" ou "1" |
| `dataVencimento` | string | ✅ | Data de vencimento da 1ª parcela (DD/MM/AAAA) | "15/03/2026" |
| `descricao` | string | ✅ | Descrição/produto vendido | "Adubo 50kg + Semente de milho" |
| `numeroFicha` | string | ✅ | Número da ficha física | "A-001" |
| `vendedorId` | string | ✅ | ID do vendedor | "5" |
| `tipoVenda` | string | ✅ | Tipo da venda | "vista_dinheiro", "vista_agendado" ou "parcelado" |
| `rotaId` | string | ✅ | ID da rota selecionada | "1" |
| `fotoFicha` | File | ✅ | Foto da ficha física (JPG/PNG) | (arquivo binário) |

### Tipos de Venda

| Tipo | Descrição | Parcelas |
|------|-----------|----------|
| `vista_dinheiro` | Pagamento imediato em dinheiro ao vendedor | Sempre 1 |
| `vista_agendado` | Pagamento à vista em data futura específica | Sempre 1 |
| `parcelado` | Pagamento dividido em múltiplas parcelas | 1 a 60 |

---

## ⚙️ Fluxo de Processamento

### 1️⃣ **Validar dados recebidos**
- Verificar se todos os campos obrigatórios estão presentes
- Validar formato do valor (decimal positivo)
- Validar quantidade de parcelas (inteiro > 0)
- **Validar tipo de venda** (deve ser: vista_dinheiro, vista_agendado ou parcelado)
- **Se tipo for à vista, ignorar parcelas e forçar parcelas = 1**
- Validar formato da data (DD/MM/AAAA)
- Verificar se cliente, vendedor e rota existem

### 2️⃣ **Calcular parcelas**
```javascript
const valorTotal = parseFloat(valor);
const numParcelas = parseInt(parcelas);
const valorParcela = valorTotal / numParcelas;

// Converter data para objeto Date
const [dia, mes, ano] = dataVencimento.split('/');
const dataVencimentoPrimeira = new Date(ano, mes - 1, dia);
```

### 3️⃣ **Criar cobrança no Asaas**
```javascript
// Criar parcelas no Asaas
const parcelasAsaas = [];

for (let i = 0; i < numParcelas; i++) {
  const dataVenc = new Date(dataVencimentoPrimeira);
  dataVenc.setMonth(dataVenc.getMonth() + i);
  
  const cobranca = await asaas.criarCobranca({
    customer: cliente.asaasCustomerId,
    billingType: 'BOLETO', // ou 'PIX', 'CREDIT_CARD'
    value: valorParcela,
    dueDate: dataVenc.toISOString().split('T')[0],
    description: `${descricao} - Parcela ${i + 1}/${numParcelas}`,
    externalReference: `FICHA-${numeroFicha}-P${i + 1}`
  });
  
  parcelasAsaas.push({
    numero: i + 1,
    valor: valorParcela,
    dataVencimento: dataVenc,
    asaasPaymentId: cobranca.id,
    status: 'PENDENTE',
    linkBoleto: cobranca.bankSlipUrl,
    linkPix: cobranca.invoiceUrl
  });
}
```

### 4️⃣ **Salvar no Database**
```sql
-- Salvar venda
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
  '/uploads/fichas/A001_xxx.jpg',
  '2026-03-15',
  NOW()
)
RETURNING id;

-- Salvar parcelas
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
  (venda_id, 1, 125.04, '2026-03-15', 'PENDENTE', 'pay_xxx1', 'https://...', 'https://...'),
  (venda_id, 2, 125.04, '2026-04-15', 'PENDENTE', 'pay_xxx2', 'https://...', 'https://...'),
  ...
```

### 5️⃣ **Upload da Foto**
- Salvar foto da ficha em storage
- Formato recomendado: `ficha_{numeroFicha}_{timestamp}.{ext}`
- Armazenar URL no banco

---

## 📤 Resposta Esperada

### ✅ Sucesso (200)
```json
{
  "sucesso": true,
  "mensagem": "Venda cadastrada com sucesso",
  "venda": {
    "id": 456,
    "clienteId": 123,
    "clienteNome": "João Silva",
    "vendedorId": 5,
    "vendedorNome": "Maria Santos",
    "rotaId": 1,
    "rotaNome": "Rota Padrão",
    "tipoVenda": "parcelado",
    "tipoVendaNome": "Parcelado",
    "valorTotal": 1500.50,
    "numeroParcelas": 12,
    "valorParcela": 125.04,
    "descricao": "Adubo 50kg + Semente de milho",
    "numeroFicha": "A-001",
    "fotoFichaUrl": "https://exemplo.com/uploads/fichas/A001_xxx.jpg",
    "dataVencimentoPrimeira": "2026-03-15",
    "criadoEm": "2026-02-06T14:30:00Z",
    "parcelas": [
      {
        "numero": 1,
        "valor": 125.04,
        "dataVencimento": "2026-03-15",
        "status": "PENDENTE",
        "asaasPaymentId": "pay_xxx1",
        "linkBoleto": "https://asaas.com/boleto/xxx1",
        "linkPix": "https://asaas.com/pix/xxx1"
      },
      {
        "numero": 2,
        "valor": 125.04,
        "dataVencimento": "2026-04-15",
        "status": "PENDENTE",
        "asaasPaymentId": "pay_xxx2",
        "linkBoleto": "https://asaas.com/boleto/xxx2",
        "linkPix": "https://asaas.com/pix/xxx2"
      }
      // ... demais parcelas
    ]
  }
}
```

### ❌ Erros

**Validação (400)**
```json
{
  "sucesso": false,
  "mensagem": "Valor da venda deve ser maior que zero"
}
```

**Cliente não encontrado (404)**
```json
{
  "sucesso": false,
  "mensagem": "Cliente não encontrado"
}
```

**Erro no Asaas (500)**
```json
{
  "sucesso": false,
  "mensagem": "Erro ao criar cobrança no Asaas: {erro_detalhado}"
}
```

---

## 🔒 Validações Necessárias

### Valor
- Deve ser maior que 0
- Formato: decimal com 2 casas (1500.50)

### Parcelas
- Deve ser inteiro > 0
- Máximo recomendado: 60 parcelas

### Data de Vencimento
- Formato: DD/MM/AAAA
- Não pode ser data passada
- Validar dia/mês/ano válidos

### Número da Ficha
- Verificar se não existe venda com mesmo número de ficha
- Campo único no sistema

### Foto da Ficha
- Formatos: JPG, JPEG, PNG
- Tamanho máximo: 5MB

---

## 📊 Cálculos Importantes

### Valor da Parcela
```javascript
// Distribuir centavos nas primeiras parcelas se necessário
const valorTotal = 1500.50;
const numParcelas = 12;
const valorBase = Math.floor((valorTotal * 100) / numParcelas) / 100;
const centavosRestantes = Math.round((valorTotal * 100) - (valorBase * 100 * numParcelas));

// Primeira parcela pega os centavos extras
const valorPrimeiraParcela = valorBase + (centavosRestantes / 100);
```

### Datas de Vencimento
```javascript
// Parcelas mensais
for (let i = 0; i < numParcelas; i++) {
  const data = new Date(dataVencimentoPrimeira);
  data.setMonth(data.getMonth() + i);
  // Se dia não existir no mês (ex: 31/02), ajustar para último dia do mês
  if (data.getDate() !== dataVencimentoPrimeira.getDate()) {
    data.setDate(0); // último dia do mês anterior
  }
}
```

---

## 🔄 Tratamento de Erros

### Se falhar no Asaas:
- **Não** salvar venda no banco
- Retornar erro específico
- Log completo para debug

### Se falhar no Database (após Asaas):
- Cancelar/deletar cobranças criadas no Asaas
- Retornar erro ao app
- Log do erro

### Se falhar no Upload:
- Considerar como erro crítico
- Fazer rollback completo
- Retornar mensagem clara

---

## 🧪 Teste Manual

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
  -F "fotoFicha=@/path/to/ficha.jpg"
```

---

## 📌 Observações Importantes

1. **Integração Asaas**: Todas as parcelas devem ser criadas no Asaas
2. **Links de Pagamento**: Guardar links de boleto e PIX de cada parcela
3. **Notificações**: Considerar enviar WhatsApp para cliente com links de pagamento
4. **Webhook**: Implementar webhook do Asaas para atualizar status das parcelas
5. **Cancelamento**: Implementar endpoint para cancelar venda (cancelar todas as cobranças no Asaas)
6. **Tipos de Venda**:
   - **À Vista Dinheiro**: Parcelas = 1, pagamento imediato, não criar no Asaas (dinheiro direto ao vendedor)
   - **À Vista Agendado**: Parcelas = 1, criar 1 cobrança no Asaas com data específica
   - **Parcelado**: Criar N cobranças no Asaas conforme número de parcelas
7. **Rotas**: Validar se a rota existe e está ativa antes de cadastrar a venda
8. **Validação de Tipo**: Sempre validar que o tipo seja um dos três permitidos

---

**Desenvolvido para:** AgroVendas App  
**Versão:** 1.0  
**Data:** Fevereiro/2026
