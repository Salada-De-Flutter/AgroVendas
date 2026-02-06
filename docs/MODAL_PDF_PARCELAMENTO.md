# Modal de Download de PDF - Venda Parcelada

## Descrição

Após o cadastro bem-sucedido de uma venda parcelada, o sistema exibe um modal perguntando ao vendedor se ele deseja baixar e imprimir o PDF do comprovante de parcelamento imediatamente.

## Fluxo de Funcionamento

1. **Cadastro da Venda**: Vendedor preenche e envia o formulário de venda parcelada
2. **Resposta da API**: Backend retorna sucesso com o ID da venda criada
3. **Exibição do Modal**: Modal é exibido automaticamente apenas para vendas do tipo `parcelado`
4. **Escolha do Vendedor**:
   - **Baixar PDF**: Sistema baixa o PDF e abre o seletor de compartilhamento
   - **Agora Não**: Modal é fechado e vendedor é redirecionado para a tela inicial

## Implementação Frontend

### Estados Utilizados

```typescript
const [modalPdfVisivel, setModalPdfVisivel] = useState(false);
const [vendaIdCriada, setVendaIdCriada] = useState<string | null>(null);
const [baixandoPdf, setBaixandoPdf] = useState(false);
```

### Lógica de Exibição

```typescript
// Após cadastro bem-sucedido
if (responseApi.ok && data.sucesso) {
  setSuccessMessage('Venda cadastrada com sucesso!');

  // Se for venda parcelada, perguntar se deseja baixar o PDF
  if (tipoVenda === 'parcelado' && data.vendaId) {
    setVendaIdCriada(data.vendaId);
    setModalPdfVisivel(true);
  } else {
    // Para outros tipos, voltar para home após 2 segundos
    setTimeout(() => {
      router.replace('/(app)/home');
    }, 2000);
  }
}
```

### Função de Download do PDF

```typescript
const baixarEAbrirPDF = async (vendaId: string) => {
  setBaixandoPdf(true);
  setErrorMessage('');

  try {
    // URL para baixar o PDF
    const pdfUrl = API_ENDPOINTS.VENDAS.PDF(vendaId);
    
    // Criar arquivo no diretório de documentos
    const fileName = `venda_${vendaId}_${Date.now()}.pdf`;
    const file = new ExpoFile(Paths.document, fileName);

    // Baixar o PDF usando fetch e salvar no arquivo
    const response = await fetch(pdfUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao baixar o PDF');
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Escrever no arquivo
    await file.create();
    const stream = file.writableStream();
    const writer = stream.getWriter();
    await writer.write(uint8Array);
    await writer.close();

    // Verificar se está disponível para compartilhar/abrir
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Comprovante de Venda Parcelada',
        UTI: 'com.adobe.pdf',
      });
    } else {
      setErrorMessage('Não foi possível abrir o PDF');
    }
  } catch (error: any) {
    console.error('Erro ao baixar PDF:', error);
    setErrorMessage('Erro ao baixar o PDF. Tente novamente.');
  } finally {
    setBaixandoPdf(false);
  }
};
```

### Handlers do Modal

```typescript
const handleBaixarPDF = async () => {
  if (vendaIdCriada) {
    await baixarEAbrirPDF(vendaIdCriada);
    setModalPdfVisivel(false);
    router.replace('/(app)/home');
  }
};

const handlePularPDF = () => {
  setModalPdfVisivel(false);
  router.replace('/(app)/home');
};
```

## Interface do Modal

### Estrutura Visual

```typescript
<Modal
  visible={modalPdfVisivel}
  transparent={true}
  animationType="fade"
  onRequestClose={handlePularPDF}
>
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Ícone de documento */}
      <View style={styles.modalIconContainer}>
        <Ionicons name="document-text" size={64} color="#4CAF50" />
      </View>
      
      {/* Título e mensagem */}
      <Text style={styles.modalTitle}>Venda Cadastrada!</Text>
      <Text style={styles.modalMessage}>
        Deseja baixar e imprimir o PDF do parcelamento agora?
      </Text>

      {/* Mensagem de erro (se houver) */}
      {errorMessage ? (
        <View style={styles.modalErrorContainer}>
          <Text style={styles.modalErrorText}>{errorMessage}</Text>
        </View>
      ) : null}

      {/* Botões de ação */}
      <View style={styles.modalButtons}>
        <TouchableOpacity
          style={[styles.modalButton, styles.modalButtonSecondary]}
          onPress={handlePularPDF}
          disabled={baixandoPdf}
        >
          <Text style={styles.modalButtonTextSecondary}>Agora Não</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalButton, styles.modalButtonPrimary, baixandoPdf && styles.modalButtonDisabled]}
          onPress={handleBaixarPDF}
          disabled={baixandoPdf}
        >
          {baixandoPdf ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="download" size={20} color="#ffffff" />
              <Text style={styles.modalButtonTextPrimary}>Baixar PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
```

### Características Visuais

- **Background Overlay**: Fundo escuro semi-transparente (rgba(0, 0, 0, 0.8))
- **Card do Modal**: Fundo cinza escuro (#2a2a2a) com bordas arredondadas
- **Ícone**: Grande ícone de documento verde em círculo
- **Botões**:
  - **Agora Não**: Botão secundário com borda, texto cinza
  - **Baixar PDF**: Botão primário verde com ícone de download
- **Indicador de Loading**: ActivityIndicator aparece durante o download

## Dependências Necessárias

```json
{
  "dependencies": {
    "expo-file-system": "^XX.X.X",
    "expo-sharing": "^XX.X.X"
  }
}
```

### Instalação

```bash
npx expo install expo-file-system expo-sharing
```

## Endpoint da API

### GET /api/vendas/:id/pdf

**Headers:**
```
Authorization: Bearer <token>
```

**Resposta:**
- Content-Type: `application/pdf`
- Arquivo PDF binário com o comprovante de parcelamento

### Estrutura do PDF

O PDF deve conter:
1. **Cabeçalho**: Logo e informações da empresa
2. **Dados do Cliente**: Nome, CPF, telefone
3. **Dados da Venda**: Valor total, número de parcelas, data
4. **Tabela de Parcelas**: Número, valor, vencimento, link de pagamento
5. **Rodapé**: Informações adicionais e observações

## Comportamento em Diferentes Tipos de Venda

| Tipo de Venda | Exibe Modal? | Comportamento |
|---------------|--------------|---------------|
| `parcelado` | ✅ Sim | Exibe modal perguntando sobre download do PDF |
| `vista_dinheiro` | ❌ Não | Redireciona direto para home após 2 segundos |
| `vista_agendado` | ❌ Não | Redireciona direto para home após 2 segundos |

## Tratamento de Erros

### Cenários de Erro

1. **Erro ao baixar PDF**: Exibe mensagem no modal, permite tentar novamente
2. **Compartilhamento não disponível**: Exibe mensagem de erro
3. **Erro de conexão**: Informa ao usuário sobre problema de conexão

### Mensagens de Erro

- "Erro ao baixar o PDF. Tente novamente."
- "Não foi possível abrir o PDF"

## Experiência do Usuário

### Fluxo Positivo
1. Vendedor cadastra venda parcelada
2. Modal aparece com sucesso
3. Vendedor clica em "Baixar PDF"
4. Sistema baixa o PDF
5. Seletor de compartilhamento do OS aparece
6. Vendedor escolhe aplicativo para abrir (ex: WhatsApp, Email, Impressora)
7. Redirecionamento para tela inicial

### Fluxo Alternativo
1. Vendedor cadastra venda parcelada
2. Modal aparece com sucesso
3. Vendedor clica em "Agora Não"
4. Redirecionamento imediato para tela inicial

### Fluxo com Erro
1. Vendedor cadastra venda parcelada
2. Modal aparece com sucesso
3. Vendedor clica em "Baixar PDF"
4. Erro ocorre durante download
5. Mensagem de erro é exibida no modal
6. Vendedor pode tentar novamente ou escolher "Agora Não"

## Notas Técnicas

### Expo File System (Nova API)

A implementação usa a nova API do `expo-file-system`:

- `Paths.document`: Diretório de documentos do aplicativo
- `ExpoFile`: Classe para manipular arquivos
- Métodos de stream para escrita de dados

### Expo Sharing

O `expo-sharing` permite abrir o seletor nativo do sistema operacional para:
- Compartilhar o PDF em redes sociais
- Enviar por email ou WhatsApp
- Abrir em aplicativos de leitura de PDF
- Enviar para impressora compatível

### Segurança

- O token JWT é enviado no header `Authorization` para autenticar a requisição
- O PDF só pode ser baixado pelo vendedor que criou a venda
- Arquivo é salvo no diretório privado do aplicativo

## Melhorias Futuras

1. **Histórico de PDFs**: Salvar PDFs baixados para acesso posterior
2. **Preview do PDF**: Exibir preview antes de compartilhar
3. **Envio Automático**: Opção de enviar automaticamente para o cliente via WhatsApp
4. **Personalização**: Permitir vendedor escolher o que incluir no PDF
5. **Assinatura Digital**: Capturar assinatura do cliente no PDF
