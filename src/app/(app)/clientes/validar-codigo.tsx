import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function ValidarCodigoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();
  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tempoRestante, setTempoRestante] = useState(600); // 10 minutos em segundos
  
  // Modais
  const [modalClienteExistente, setModalClienteExistente] = useState(false);
  const [modalCriarVenda, setModalCriarVenda] = useState(false);
  const [clienteExistente, setClienteExistente] = useState<any>(null);
  const [clienteCadastrado, setClienteCadastrado] = useState<any>(null);

  // Refs para os inputs
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Desestruturar parâmetros recebidos
  const { nome, documento, telefone, endereco, codigoVerificacao, fotoDocumento, metodoEnvio } = params;

  // Debug: verificar parâmetros recebidos
  useEffect(() => {
    console.log('📋 Parâmetros recebidos:');
    console.log('   Nome:', nome);
    console.log('   Documento:', documento);
    console.log('   Telefone:', telefone);
    console.log('   Foto:', fotoDocumento ? 'PRESENTE' : 'AUSENTE');
    console.log('   Foto URI:', fotoDocumento);
  }, []);

  // Timer para código expirar
  useEffect(() => {
    const timer = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setErrorMessage('Código expirado. Solicite um novo código.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Focar no primeiro input ao carregar
  useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  // Formatar tempo restante
  const formatarTempo = (segundos: number) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  };

  const handleCodigoChange = (text: string, index: number) => {
    // Aceitar apenas números
    if (text && !/^\d+$/.test(text)) return;

    const novoCodigo = [...codigo];
    novoCodigo[index] = text;
    setCodigo(novoCodigo);
    setErrorMessage('');

    // Focar no próximo input se preencheu
    if (text && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    // Verificar automaticamente quando preencher todos
    if (novoCodigo.every(digit => digit !== '') && index === 5) {
      verificarCodigo(novoCodigo.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Voltar para o input anterior ao pressionar Backspace
    if (e.nativeEvent.key === 'Backspace' && !codigo[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const verificarCodigo = async (codigoDigitado: string) => {
    if (tempoRestante <= 0) {
      setErrorMessage('Código expirado. Solicite um novo código.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      console.log('Verificando código:', codigoDigitado);
      console.log('Código esperado:', codigoVerificacao);

      // Verificar se o código está correto
      if (codigoDigitado !== codigoVerificacao) {
        setErrorMessage('Código incorreto. Tente novamente.');
        setCodigo(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
        setLoading(false);
        return;
      }

      // Se o código estiver correto, cadastrar o cliente
      console.log('📤 Iniciando cadastro do cliente...');
      console.log('   Foto disponível:', fotoDocumento ? 'SIM' : 'NÃO');
      
      const formData = new FormData();
      formData.append('nome', nome as string);
      formData.append('documento', (documento as string).replace(/\D/g, ''));
      formData.append('telefone', (telefone as string).replace(/\D/g, ''));
      formData.append('endereco', endereco as string);
      formData.append('verificado', 'true');
      formData.append('vendedorId', user?.id?.toString() || '');
      formData.append('vendedorNome', user?.nome || '');

      // Adiciona a foto se existir
      if (fotoDocumento && typeof fotoDocumento === 'string') {
        try {
          // Verificar se é blob URL (Web) ou file URI (Mobile)
          if (fotoDocumento.startsWith('blob:')) {
            console.log('🌐 Detectado blob URL (Web), convertendo...');
            
            // Buscar o blob e converter para File
            const response = await fetch(fotoDocumento);
            const blob = await response.blob();
            const filename = `documento_${Date.now()}.jpg`;
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            
            console.log('📸 Anexando foto (Web):', { name: file.name, type: file.type, size: file.size });
            formData.append('fotoDocumento', file);
          } else {
            // Mobile - usando URI normal
            const filename = fotoDocumento.split('/').pop() || 'document.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            const fotoData = {
              uri: fotoDocumento,
              name: filename,
              type: type,
            };
            
            console.log('📸 Anexando foto (Mobile):', fotoData);
            formData.append('fotoDocumento', fotoData as any);
          }
        } catch (error) {
          console.error('❌ Erro ao processar foto:', error);
          setErrorMessage('Erro ao processar a foto do documento');
          setLoading(false);
          return;
        }
      } else {
        console.warn('⚠️ Foto não disponível ou inválida');
      }

      const response = await fetch(API_ENDPOINTS.CLIENTES.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('Resposta do cadastro:', data);

      if (response.ok && data.sucesso) {
        console.log('✅ Cliente cadastrado com sucesso!');
        setSuccessMessage('Cliente verificado e cadastrado com sucesso!');
        
        // Guardar dados do cliente cadastrado
        setClienteCadastrado(data.cliente);
        
        // Aguardar 1 segundo e perguntar sobre criar venda
        setTimeout(() => {
          setModalCriarVenda(true);
        }, 1000);
      } else if (response.status === 409) {
        // Cliente já existe (duplicado)
        console.log('⚠️ Cliente já cadastrado - Status 409');
        console.log('📊 Resposta completa da API:', JSON.stringify(data, null, 2));
        
        // Tentar pegar dados do cliente da resposta, senão usar os dados digitados
        let clienteData = data.cliente || data.data;
        
        if (!clienteData || !clienteData.nome) {
          console.log('⚠️ Backend não retornou dados do cliente. Usando dados digitados.');
          // Fallback: usar dados que foram digitados
          clienteData = {
            nome: nome,
            documento: documento,
            telefone: telefone,
            endereco: endereco,
          };
        }
        
        console.log('👤 Cliente a ser exibido:', clienteData);
        setClienteExistente(clienteData);
        setModalClienteExistente(true);
      } else {
        setErrorMessage(data.mensagem || 'Erro ao cadastrar cliente');
      }
    } catch (error: any) {
      console.error('Erro ao verificar código:', error);
      setErrorMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = () => {
    // Voltar para tela de seleção de método
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Validar Código</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Ícone */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={80} color="#4CAF50" />
          </View>

          {/* Título */}
          <Text style={styles.title}>Digite o código</Text>
          <Text style={styles.subtitle}>
            Código enviado via {metodoEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'} para {telefone}
          </Text>

          {/* Timer */}
          <View style={[styles.timerContainer, tempoRestante < 60 && styles.timerWarning]}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={tempoRestante < 60 ? '#ff9800' : '#4CAF50'} 
            />
            <Text style={[styles.timerText, tempoRestante < 60 && styles.timerWarningText]}>
              {formatarTempo(tempoRestante)}
            </Text>
          </View>

          {/* Mensagem de Sucesso */}
          {successMessage ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Mensagem de Erro */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Inputs do Código */}
          <View style={styles.codeContainer}>
            {codigo.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.codeInput,
                  digit && styles.codeInputFilled,
                  errorMessage && styles.codeInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleCodigoChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading && tempoRestante > 0 && !successMessage}
              />
            ))}
          </View>

          {/* Loading ou Botão Reenviar */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Verificando código...</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={reenviarCodigo}
              disabled={loading || successMessage !== ''}
            >
              <Ionicons name="refresh" size={20} color="#4CAF50" />
              <Text style={styles.resendText}>Reenviar código</Text>
            </TouchableOpacity>
          )}

          {/* Info adicional */}
          <View style={styles.alertContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#b0b0b0" />
            <Text style={styles.alertText}>
              Não recebeu o código? Verifique o número ou tente reenviar
            </Text>
          </View>
        </View>

        {/* Modal: Cliente Já Existe */}
        <Modal
          visible={modalClienteExistente}
          transparent
          animationType="fade"
          onRequestClose={() => setModalClienteExistente(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="alert-circle" size={50} color="#ff9800" />
                <Text style={styles.modalTitle}>Cliente Já Cadastrado</Text>
              </View>

              <Text style={styles.modalMessage}>
                Este cliente já está cadastrado no sistema:
              </Text>

              <View style={styles.modalClienteInfo}>
                <View style={styles.modalInfoRow}>
                  <Ionicons name="person" size={20} color="#4CAF50" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Nome</Text>
                    <Text style={styles.modalInfoText}>
                      {clienteExistente?.nome || clienteExistente?.name || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="document-text" size={20} color="#4CAF50" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>CPF/CNPJ</Text>
                    <Text style={styles.modalInfoText}>
                      {clienteExistente?.documento || clienteExistente?.cpfCnpj || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Ionicons name="call" size={20} color="#4CAF50" />
                  <View style={styles.modalInfoContent}>
                    <Text style={styles.modalInfoLabel}>Telefone</Text>
                    <Text style={styles.modalInfoText}>
                      {clienteExistente?.telefone || clienteExistente?.phone || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={styles.modalQuestion}>
                Deseja usar este cliente cadastrado?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setModalClienteExistente(false);
                    router.replace('/(app)/home');
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Não, voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setModalClienteExistente(false);
                    setClienteCadastrado(clienteExistente);
                    setSuccessMessage('Usando cliente existente');
                    setTimeout(() => setModalCriarVenda(true), 500);
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Sim, usar cliente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal: Criar Venda */}
        <Modal
          visible={modalCriarVenda}
          transparent
          animationType="fade"
          onRequestClose={() => setModalCriarVenda(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Ionicons name="cart" size={50} color="#4CAF50" />
                <Text style={styles.modalTitle}>Cliente Cadastrado!</Text>
              </View>

              <Text style={styles.modalMessage}>
                {clienteCadastrado?.nome} foi cadastrado com sucesso.
              </Text>

              <Text style={styles.modalQuestion}>
                Deseja criar uma venda para este cliente agora?
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setModalCriarVenda(false);
                    router.replace('/(app)/home');
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Não, voltar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={() => {
                    setModalCriarVenda(false);
                    // Navegar para tela de criar venda passando clienteId, nome e CPF
                    router.push({
                      pathname: '/(app)/vendas/criar',
                      params: { 
                        clienteId: clienteCadastrado?.id?.toString() || '',
                        clienteNome: clienteCadastrado?.nome || '',
                        clienteCpf: clienteCadastrado?.cpf || clienteCadastrado?.documento || ''
                      }
                    });
                  }}
                >
                  <Text style={styles.modalButtonTextPrimary}>Sim, criar venda</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#1a3a1a',
    padding: 30,
    borderRadius: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 30,
  },
  timerWarning: {
    backgroundColor: '#3a2a1a',
  },
  timerText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timerWarningText: {
    color: '#ff9800',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  errorText: {
    color: '#ff4444',
    marginLeft: 8,
    flex: 1,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 30,
  },
  codeInput: {
    width: 50,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  codeInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  codeInputError: {
    borderColor: '#ff4444',
    backgroundColor: '#3a1a1a',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 10,
    fontSize: 14,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 10,
  },
  resendText: {
    color: '#4CAF50',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  alertText: {
    color: '#b0b0b0',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  // Estilos dos Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  modalClienteInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a3a',
  },
  modalInfoContent: {
    marginLeft: 12,
    flex: 1,
  },
  modalInfoLabel: {
    color: '#b0b0b0',
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalInfoText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalQuestion: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  modalButtonSecondary: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  modalButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextSecondary: {
    color: '#b0b0b0',
    fontSize: 16,
    fontWeight: '600',
  },
});
