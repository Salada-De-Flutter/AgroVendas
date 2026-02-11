import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function ValidarCodigoVendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();
  const [codigo, setCodigo] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tempoRestante, setTempoRestante] = useState(600); // 10 minutos

  // Refs para os inputs
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Dados da venda
  const {
    clienteId,
    clienteNome,
    clienteCpf,
    clienteTelefone,
    tipoVenda,
    rotaId,
    rotaNome,
    valor,
    parcelas,
    dataVencimento,
    descricao,
    numeroFicha,
    fotoFicha,
    codigoVerificacao,
    metodoEnvio,
  } = params;

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
      console.log('[ValidarCodigo] Código digitado:', codigoDigitado);
      console.log('[ValidarCodigo] Código esperado:', codigoVerificacao);

      // Verificar se o código está correto
      if (codigoDigitado !== codigoVerificacao) {
        setErrorMessage('Código incorreto. Tente novamente.');
        setCodigo(['', '', '', '', '', '']);
        inputRefs[0].current?.focus();
        setLoading(false);
        return;
      }

      // Código correto - cadastrar venda
      console.log('[ValidarCodigo] Código correto! Cadastrando venda...');
      
      const isVista = tipoVenda === 'vista_dinheiro' || tipoVenda === 'vista_agendado';
      
      const formData = new FormData();
      formData.append('clienteId', clienteId as string);
      formData.append('valor', (valor as string).replace(/[^\d,]/g, '').replace(',', '.'));
      formData.append('parcelas', isVista ? '1' : (parcelas as string));
      formData.append('dataVencimento', dataVencimento as string);
      formData.append('descricao', descricao as string);
      formData.append('numeroFicha', numeroFicha as string);
      formData.append('vendedorId', user?.id?.toString() || '');
      formData.append('tipoVenda', tipoVenda as string);
      formData.append('rotaId', rotaId as string);
      formData.append('codigoVerificado', 'true');

      // Adicionar foto
      if (fotoFicha && typeof fotoFicha === 'string') {
        try {
          if (fotoFicha.startsWith('blob:')) {
            const response = await fetch(fotoFicha);
            const blob = await response.blob();
            const filename = `ficha_${Date.now()}.jpg`;
            const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
            formData.append('fotoFicha', file);
          } else {
            const filename = fotoFicha.split('/').pop() || 'ficha.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('fotoFicha', {
              uri: fotoFicha,
              name: filename,
              type: type,
            } as any);
          }
        } catch (error) {
          console.error('[ValidarCodigo] Erro ao processar foto:', error);
          setErrorMessage('Erro ao processar a foto da ficha');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(API_ENDPOINTS.VENDAS.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      console.log('[ValidarCodigo] Resposta:', data);

      if (response.ok && data.sucesso) {
        console.log('[ValidarCodigo] Venda cadastrada com sucesso!');
        setSuccessMessage('Venda cadastrada com sucesso!');
        // Sempre garantir vendaId correto e string
        const vendaIdFinal = (data.vendaId || data.id)?.toString();
        if (tipoVenda === 'parcelado' && vendaIdFinal) {
          setTimeout(() => {
            router.replace({
              pathname: '/(app)/home',
              params: {
                mostrarModalPdf: 'true',
                vendaId: vendaIdFinal,
              },
            });
          }, 1500);
        } else {
          setTimeout(() => {
            router.replace('/(app)/home');
          }, 1500);
        }
      } else {
        setErrorMessage(data.mensagem || 'Erro ao cadastrar venda');
      }
    } catch (error: any) {
      console.error('[ValidarCodigo] Erro:', error);
      setErrorMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
    }
  };

  const reenviarCodigo = () => {
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
            <Ionicons name="keypad" size={60} color="#4CAF50" />
          </View>

          {/* Título */}
          <Text style={styles.title}>Digite o código</Text>
          <Text style={styles.subtitle}>
            Código enviado para {clienteNome} via {metodoEnvio === 'whatsapp' ? 'WhatsApp' : 'SMS'}
          </Text>

          {/* Mensagens */}
          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#ff4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Inputs do código */}
          <View style={styles.codigoContainer}>
            {codigo.map((digit, index) => (
              <TextInput
                key={index}
                ref={inputRefs[index]}
                style={[
                  styles.codigoInput,
                  digit && styles.codigoInputFilled,
                  errorMessage && !loading && styles.codigoInputError,
                ]}
                value={digit}
                onChangeText={(text) => handleCodigoChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!loading && tempoRestante > 0}
              />
            ))}
          </View>

          {/* Timer */}
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={20} color={tempoRestante < 60 ? '#ff4444' : '#4CAF50'} />
            <Text style={[styles.timerText, tempoRestante < 60 && styles.timerTextUrgent]}>
              Tempo restante: {formatarTempo(tempoRestante)}
            </Text>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Verificando código...</Text>
            </View>
          )}

          {/* Botão reenviar */}
          <TouchableOpacity
            style={styles.reenviarButton}
            onPress={reenviarCodigo}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#4CAF50" />
            <Text style={styles.reenviarText}>Reenviar código</Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={16} color="#b0b0b0" />
            <Text style={styles.infoText}>
              Venda no valor de {valor} para o cliente {clienteNome}
            </Text>
          </View>
        </View>
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
    marginTop: 40,
    marginBottom: 30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a3a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
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
  codigoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 30,
  },
  codigoInput: {
    width: 50,
    height: 60,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a3a',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  codigoInputFilled: {
    borderColor: '#4CAF50',
    backgroundColor: '#1a3a1a',
  },
  codigoInputError: {
    borderColor: '#ff4444',
    backgroundColor: '#3a1a1a',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 16,
    color: '#4CAF50',
    marginLeft: 8,
  },
  timerTextUrgent: {
    color: '#ff4444',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    color: '#b0b0b0',
    marginTop: 12,
  },
  reenviarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 20,
  },
  reenviarText: {
    color: '#4CAF50',
    fontSize: 16,
    marginLeft: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 8,
    marginTop: 30,
    width: '100%',
  },
  infoText: {
    color: '#b0b0b0',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
});
