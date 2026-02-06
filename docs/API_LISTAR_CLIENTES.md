# 📋 API - Listar Clientes

## Endpoint
```
GET /api/clientes
```

## Autenticação
```
Authorization: Bearer {token}
```
O token JWT do vendedor autenticado.

---

## 📤 Resposta Esperada

### ✅ Sucesso (200)
```json
{
  "sucesso": true,
  "clientes": [
    {
      "id": 123,
      "nome": "João Silva",
      "cpf": "12345678901",
      "telefone": "(11) 98765-4321",
      "email": "joao@email.com",
      "endereco": "Rua das Flores, 123",
      "asaasCustomerId": "cus_000005164829",
      "vendedorId": 5,
      "vendedorNome": "Maria Santos",
      "criadoEm": "2026-02-01T10:30:00Z",
      "atualizadoEm": "2026-02-01T10:30:00Z"
    },
    {
      "id": 124,
      "nome": "Pedro Oliveira",
      "cpf": "98765432100",
      "telefone": "(11) 91234-5678",
      "email": null,
      "endereco": "Av. Principal, 456",
      "asaasCustomerId": "cus_000005164830",
      "vendedorId": 7,
      "vendedorNome": "Carlos Silva",
      "criadoEm": "2026-02-01T14:20:00Z",
      "atualizadoEm": "2026-02-01T14:20:00Z"
    }
  ],
  "total": 2
}
```

### ❌ Não autorizado (401)
```json
{
  "sucesso": false,
  "mensagem": "Token inválido ou expirado"
}
```

### ❌ Erro no servidor (500)
```json
{
  "sucesso": false,
  "mensagem": "Erro ao buscar clientes"
}
```

---

## 🔍 Filtros e Ordenação (Opcional)

### Query Parameters opcionais:
```
GET /api/clientes?busca=joão&ordem=nome&limite=20
```

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `busca` | string | Buscar por nome ou CPF | `João` ou `123.456` |
| `ordem` | string | Ordenar por campo | `nome`, `criadoEm`, `id` |
| `limite` | number | Limitar resultados | `20` |
| `pagina` | number | Página (paginação) | `1` |

**Nota:** Se não houver filtros implementados, retornar todos os clientes do vendedor.

---

## 🔒 Segurança

### Importante:
- ✅ **Retorna TODOS os clientes do sistema** (não filtra por vendedor)
- Validar o token antes de processar a requisição
- Inclui campo `vendedorNome` para identificar quem cadastrou

### Exemplo de SQL com JOIN:
```sql
SELECT 
  c.*,
  v.nome as vendedorNome
FROM clientes c
LEFT JOIN vendedores v ON c.vendedor_id = v.id
ORDER BY c.nome ASC;
```

---

## 📊 Estrutura dos Dados

### Campos obrigatórios no retorno:
- ✅ `id` - ID único do cliente
- ✅ `nome` - Nome completo
- ✅ `cpf` - CPF (11 dígitos, sem formatação ou com)
- ✅ `telefone` - Telefone (pode ser null)
- ✅ `vendedorNome` - Nome do vendedor que cadastrou
- ❌ `email` - E-mail (opcional, pode ser null)
- ❌ `endereco` - Endereço (opcional)
- ❌ `asaasCustomerId` - ID do cliente no Asaas (opcional)

### Campos adicionais úteis:
- `criadoEm` - Data/hora de criação
- `atualizadoEm` - Data/hora da última atualização
- `ativo` - Se o cliente está ativo (boolean)

---

## 🧪 Teste Manual

### cURL Example:
```bash
curl -X GET "http://localhost:3000/api/clientes" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Com filtro de busca:
```bash
curl -X GET "http://localhost:3000/api/clientes?busca=joão" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

---

## 💡 Implementação Recomendada

### No Backend (Node.js/Express):
```javascript
router.get('/clientes', authMiddleware, async (req, res) => {
  try {
    const { busca, ordem = 'nome', limite = 100 } = req.query;

    let query = `
      SELECT 
        c.*,
        v.nome as vendedorNome
      FROM clientes c
      LEFT JOIN vendedores v ON c.vendedor_id = v.id
      WHERE 1=1
    `;
    const params = [];

    // Adicionar busca se fornecida
    if (busca) {
      query += ' AND (c.nome LIKE ? OR c.cpf LIKE ?)';
      params.push(`%${busca}%`, `%${busca}%`);
    }

    // Ordenação
    query += ` ORDER BY c.${ordem} ASC LIMIT ?`;
    params.push(parseInt(limite));

    const clientes = await db.query(query, params);

    res.json({
      sucesso: true,
      clientes: clientes,
      total: clientes.length
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar clientes'
    });
  }
});
```

---

## 📌 Observações

1. **Performance**: Se houver muitos clientes, considerar paginação
2. **Cache**: Considerar cache de curta duração (30-60s)
3. **Busca**: Implementar busca case-insensitive e remover caracteres especiais do CPF para busca
4. **Ordenação**: Padrão deve ser por nome (ordem alfabética)
5. **Vendedor**: Campo `vendedorNome` ajuda a identificar quem cadastrou cada cliente
6. **Acesso Global**: Qualquer vendedor autenticado pode ver todos os clientes do sistema

---

**Desenvolvido para:** AgroVendas App  
**Versão:** 1.0  
**Data:** Fevereiro/2026
