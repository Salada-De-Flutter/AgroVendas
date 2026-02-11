import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';

export default function CriarVendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user } = useAuth();

  // Parâmetros vindos da tela anterior
  const clienteIdParam = params.clienteId as string | undefined;
  const clienteNomeParam = params.clienteNome as string | undefined;
  const clienteCpfParam = params.clienteCpf as string | undefined;
  const clienteTelefoneParam = params.clienteTelefone as string | undefined;
  const tipoVendaParam = params.tipoVenda as string | undefined;
  const rotaIdParam = params.rotaId as string | undefined;
  const rotaNomeParam = params.rotaNome as string | undefined;

  const [clienteId, setClienteId] = useState(clienteIdParam || '');
  const [clienteNome, setClienteNome] = useState(clienteNomeParam || '');
  const [clienteCpf, setClienteCpf] = useState(clienteCpfParam || '');
  const [clienteTelefone, setClienteTelefone] = useState(clienteTelefoneParam || '');
  const [tipoVenda, setTipoVenda] = useState(tipoVendaParam || '');
  const [rotaId, setRotaId] = useState(rotaIdParam || '');
  const [rotaNome, setRotaNome] = useState(rotaNomeParam || '');
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('1');
  const [dataVencimento, setDataVencimento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroFicha, setNumeroFicha] = useState('');
  const [fotoFicha, setFotoFicha] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para o modal PDF
  const [modalPdfVisivel, setModalPdfVisivel] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  // Handlers do modal PDF
  const handlePularPDF = () => {
    setModalPdfVisivel(false);
      router.replace({ pathname: '/(app)/vendas' as any });
  };

  const handleBaixarPDF = async () => {
    setBaixandoPdf(true);
    setErrorMessage('');
    try {
      // Simulação de download do PDF
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccessMessage('PDF baixado com sucesso!');
      // Aqui você pode implementar a lógica real de download e compartilhamento
    } catch (e) {
      setErrorMessage('Erro ao baixar PDF.');
    } finally {
      setBaixandoPdf(false);
    }
  };

  // Verificar se é venda à vista (não permite alterar parcelas)
  const isVista = tipoVenda === 'vista_dinheiro' || tipoVenda === 'vista_agendado';

  // Validar se dados essenciais foram passados
  useEffect(() => {
    if (!clienteId || !clienteNome || !tipoVenda) {
      router.replace({ pathname: '/(app)/vendas/selecionar-cliente' as any });
    }
  }, []);

  // Atualizar estados quando mudar parâmetros
  useEffect(() => {
    if (clienteIdParam) {
      setClienteId(clienteIdParam);
      setClienteNome(clienteNomeParam || '');
      setClienteCpf(clienteCpfParam || '');
      setClienteTelefone(clienteTelefoneParam || '');
      setTipoVenda(tipoVendaParam || '');
      setRotaId(rotaIdParam || '');
      setRotaNome(rotaNomeParam || '');
    }
  }, [clienteIdParam, clienteNomeParam, clienteCpfParam, clienteTelefoneParam, tipoVendaParam, rotaIdParam, rotaNomeParam]);

  // Formatar valor monetário
  const formatarValor = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    const value = parseFloat(numbers) / 100;
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleValorChange = (text: string) => {
    const formatted = formatarValor(text);
    setValor(formatted);
  };

  // Obter nome do tipo de venda para exibição
  const getTipoVendaNome = () => {
    switch (tipoVenda) {
      case 'vista_dinheiro':
        return 'À Vista - Dinheiro';
      case 'vista_agendado':
        return 'À Vista - Agendado';
      case 'parcelado':
        return 'Parcelado';
      default:
        return '';
    }
  };

  // Calcular valor de cada parcela
  const calcularValorParcela = () => {
    const valorNumerico = parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.'));
    const numeroParcelas = parseInt(parcelas) || 1;
    
    if (isNaN(valorNumerico) || numeroParcelas === 0) return 'R$ 0,00';
    
    const valorParcela = valorNumerico / numeroParcelas;
    return valorParcela.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  // Formatar data
  const formatarData = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  const formatarCPF = (cpf: string) => {
    const numeros = cpf.replace(/\D/g, '');
    
    if (numeros.length !== 11) return cpf;
    
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Tirar/selecionar foto da ficha
  const selecionarFoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      setErrorMessage('Permissão para acessar a galeria é necessária');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoFicha(result.assets[0].uri);
      setErrorMessage('');
    }
  };

  const tirarFoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      setErrorMessage('Permissão para acessar a câmera é necessária');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoFicha(result.assets[0].uri);
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validações
    if (!clienteId) {
      setErrorMessage('Selecione um cliente');
      return;
    }

    if (!valor || valor === 'R$ 0,00') {
      setErrorMessage('Informe o valor da venda');
      return;
    }

    if (!parcelas || parseInt(parcelas) < 1) {
      setErrorMessage('Informe a quantidade de parcelas');
      return;
    }

    if (!dataVencimento || dataVencimento.length < 10) {
      setErrorMessage('Informe a data de vencimento completa');
      return;
    }

    if (!descricao) {
      setErrorMessage('Informe a descrição da venda');
      return;
    }

    if (!numeroFicha) {
      setErrorMessage('Informe o número da ficha');
      return;
    }

    if (!fotoFicha) {
      setErrorMessage('Adicione uma foto da ficha');
      return;
    }

    // Gerar código de verificação de 6 dígitos
    const codigoVerificacao = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('[Venda] Código de verificação gerado:', codigoVerificacao);

    // Redirecionar para tela de método de verificação
    router.push({
      pathname: '/(app)/vendas/metodo-verificacao',
      params: {
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
      },
    });

    // O modal PDF será exibido apenas após a verificação, não aqui.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Venda</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
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

            {/* Cliente Selecionado */}
            <Text style={styles.label}>Cliente Selecionado</Text>
            <View style={styles.clienteInfoBox}>
              <View style={styles.clienteIconContainer}>
                <Ionicons name="person" size={24} color="#4CAF50" />
              </View>
              <View style={styles.clienteInfo}>
                <Text style={styles.clienteNomeText}>{clienteNome}</Text>
                <Text style={styles.clienteCpfText}>CPF: {formatarCPF(clienteCpf)}</Text>
              </View>
              <View style={styles.clienteBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
            </View>

            {/* Tipo de Venda e Rota */}
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Ionicons name="cash" size={20} color="#2196F3" />
                <View style={styles.infoCardTexts}>
                  <Text style={styles.infoCardLabel}>Tipo</Text>
                  <Text style={styles.infoCardValue}>{getTipoVendaNome()}</Text>
                </View>
              </View>
              <View style={styles.infoCard}>
                <Ionicons name="navigate" size={20} color="#2196F3" />
                <View style={styles.infoCardTexts}>
                  <Text style={styles.infoCardLabel}>Rota</Text>
                  <Text style={styles.infoCardValue}>{rotaNome}</Text>
                </View>
              </View>
            </View>

            {/* Valor */}
            <Text style={styles.label}>Valor Total *</Text>
            <TextInput
              style={styles.input}
              placeholder="R$ 0,00"
              placeholderTextColor="#666666"
              value={valor}
              onChangeText={handleValorChange}
              keyboardType="numeric"
            />

            {/* Parcelas */}
            <Text style={styles.label}>
              Número de Parcelas *
              {isVista && <Text style={styles.labelInfo}> (fixo para vendas à vista)</Text>}
            </Text>
            <TextInput
              style={[styles.input, isVista && styles.inputDisabled]}
              placeholder="1"
              placeholderTextColor="#666666"
              value={isVista ? '1' : parcelas}
              onChangeText={!isVista ? setParcelas : undefined}
              keyboardType="numeric"
              editable={!isVista}
            />

            {/* Valor da Parcela */}
            {!isVista && parcelas && parseInt(parcelas) > 0 && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color="#4CAF50" />
                <Text style={styles.infoText}>
                  Cada parcela: <Text style={styles.infoTextBold}>{calcularValorParcela()}</Text>
                </Text>
              </View>
            )}

            {/* Data de Vencimento */}
            <Text style={styles.label}>
              {isVista && tipoVenda === 'vista_agendado' ? 'Data do Pagamento *' : 'Data de Vencimento (1ª parcela) *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#666666"
              value={dataVencimento}
              onChangeText={(text) => setDataVencimento(formatarData(text))}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Descrição */}
            <Text style={styles.label}>Descrição/Produto *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Ex: Adubo 50kg, Semente de milho..."
              placeholderTextColor="#666666"
              value={descricao}
              onChangeText={setDescricao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Número da Ficha */}
            <Text style={styles.label}>Número da Ficha *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 001, A-123..."
              placeholderTextColor="#666666"
              value={numeroFicha}
              onChangeText={setNumeroFicha}
            />

            {/* Foto da Ficha */}
            <Text style={styles.label}>Foto da Ficha *</Text>
            
            {fotoFicha ? (
              <View style={styles.fotoContainer}>
                <Image source={{ uri: fotoFicha }} style={styles.fotoPreview} />
                <TouchableOpacity
                  style={styles.removerFotoButton}
                  onPress={() => setFotoFicha(null)}
                >
                  <Ionicons name="close-circle" size={30} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.fotoButtons}>
                <TouchableOpacity style={styles.fotoButton} onPress={tirarFoto}>
                  <Ionicons name="camera" size={32} color="#4CAF50" />
                  <Text style={styles.fotoButtonText}>Tirar Foto</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.fotoButton} onPress={selecionarFoto}>
                  <Ionicons name="images" size={32} color="#4CAF50" />
                  <Text style={styles.fotoButtonText}>Galeria</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Botão de Cadastrar */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.submitButtonText}>Cadastrando...</Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Cadastrar Venda</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Download do PDF */}
      <Modal
        visible={modalPdfVisivel}
        transparent={true}
        animationType="fade"
        onRequestClose={handlePularPDF}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="document-text" size={64} color="#4CAF50" />
            </View>
            
            <Text style={styles.modalTitle}>Venda Cadastrada!</Text>
            <Text style={styles.modalMessage}>
              Deseja baixar o PDF do parcelamento? Você poderá visualizar, compartilhar ou imprimir.
            </Text>

            {errorMessage ? (
              <View style={styles.modalErrorContainer}>
                <Text style={styles.modalErrorText}>{errorMessage}</Text>
              </View>
            ) : null}

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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  successText: {
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
  },
  labelInfo: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#b0b0b0',
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  inputDisabled: {
    backgroundColor: '#1a1a1a',
    opacity: 0.6,
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  clienteInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  clienteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2a4a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNomeText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  clienteCpfText: {
    fontSize: 13,
    color: '#b0b0b0',
    marginTop: 2,
  },
  clienteBadge: {
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2a3a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  infoCardTexts: {
    marginLeft: 8,
    flex: 1,
  },
  infoCardLabel: {
    fontSize: 11,
    color: '#b0b0b0',
    marginBottom: 2,
  },
  infoCardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    color: '#4CAF50',
    marginLeft: 8,
    fontSize: 14,
  },
  infoTextBold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  fotoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  fotoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: '#2a2a2a',
  },
  removerFotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
  },
  fotoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  fotoButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3a3a3a',
    borderStyle: 'dashed',
  },
  fotoButtonText: {
    color: '#4CAF50',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Modal de PDF
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1a3a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#b0b0b0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalErrorContainer: {
    backgroundColor: '#3a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  modalErrorText: {
    color: '#ff4444',
    fontSize: 14,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#4CAF50',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  modalButtonDisabled: {
    opacity: 0.6,
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
