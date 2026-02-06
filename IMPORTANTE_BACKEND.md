# ⚠️ CORREÇÃO URGENTE - Backend

## Problema Encontrado

O endpoint `POST /api/clientes` está retornando erro **409** (cliente duplicado) **SEM** os dados do cliente existente:

### ❌ Resposta Atual (INCORRETA):
```json
{
  "sucesso": false,
  "mensagem": "Cliente com este documento já está cadastrado"
}
```

### ✅ Resposta Esperada (CORRETA):
```json
{
  "sucesso": false,
  "mensagem": "Cliente com este documento já está cadastrado",
  "cliente": {
    "id": 123,
    "nome": "João Silva",
    "documento": "12345678900",
    "telefone": "11987654321",
    "endereco": "Rua das Flores, 123, São Paulo - SP",
    "verificado": true,
    "vendedorId": 5,
    "vendedorNome": "Maria Santos",
    "asaasCustomerId": "cus_000005432764",
    "fotoDocumentoUrl": "https://exemplo.com/uploads/documentos/12345678900.jpg",
    "criadoEm": "2026-02-06T10:30:00Z"
  }
}
```

## Solução

No código do backend, quando detectar cliente duplicado (status 409), **buscar os dados do cliente no banco** e incluir no objeto `cliente` da resposta.

### Exemplo (Node.js/Express):
```javascript
// Verificar se cliente já existe
const clienteExistente = await Cliente.findOne({ 
  where: { documento: documento } 
});

if (clienteExistente) {
  return res.status(409).json({
    sucesso: false,
    mensagem: "Cliente com este documento já está cadastrado",
    cliente: {
      id: clienteExistente.id,
      nome: clienteExistente.nome,
      documento: clienteExistente.documento,
      telefone: clienteExistente.telefone,
      endereco: clienteExistente.endereco,
      verificado: clienteExistente.verificado,
      vendedorId: clienteExistente.vendedor_id,
      vendedorNome: clienteExistente.vendedor_nome,
      asaasCustomerId: clienteExistente.asaas_customer_id,
      fotoDocumentoUrl: clienteExistente.foto_documento_url,
      criadoEm: clienteExistente.created_at
    }
  });
}
```

## Impacto

Sem essa correção, o app está usando um **fallback temporário** que mostra os dados digitados pelo vendedor, mas **não** os dados reais do banco de dados.

---

**Status:** 🔴 CRÍTICO - Implementar o mais rápido possível  
**Data:** 06/02/2026
