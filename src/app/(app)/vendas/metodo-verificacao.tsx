import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function MetodoVerificacaoVendaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [metodoPressionado, setMetodoPressionado] = useState<'whatsapp' | 'sms' | null>(null);

  // Dados da venda e do cliente
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
  } = params;

  const enviarCodigo = async (metodo: 'whatsapp' | 'sms') => {
    if (metodo === 'sms') {
      setErrorMessage('SMS em desenvolvimento. Use WhatsApp por enquanto.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setMetodoPressionado(metodo);

    try {
      console.log('[VerificacaoVenda] Enviando código via', metodo);
      const response = await fetch(API_ENDPOINTS.VENDAS.SEND_VERIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clienteId,
          clienteNome,
          clienteTelefone,
          nomeVendedor: user?.nome || 'Vendedor',
          codigoVerificacao,
          metodo,
          valor,
          tipoVenda,
        }),
      });
      const data = await response.json();
      console.log('[VerificacaoVenda] Resposta:', data);

      if (response.ok && data.sucesso) {
        console.log('[VerificacaoVenda] Código enviado com sucesso');
        
        // Navegar para tela de validação passando TODOS os dados
        router.push({
          pathname: '/(app)/vendas/validar-codigo',
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
            metodoEnvio: metodo,
          },
        });
      } else {
        setErrorMessage(data.mensagem || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('[VerificacaoVenda] Erro ao enviar código:', error);
      setErrorMessage('Erro de conexão. Verifique sua internet.');
    } finally {
      setLoading(false);
      setMetodoPressionado(null);
    }
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
          <Text style={styles.headerTitle}>Verificação de Venda</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
          <View style={styles.content}>
            {/* Ícone */}
            <View style={styles.iconContainer}>
              <Ionicons name="shield-checkmark" size={80} color="#4CAF50" />
            </View>
            {/* Título */}
            <Text style={styles.title}>Escolha o método de envio</Text>
            <Text style={styles.subtitle}>
              Vamos enviar um código de verificação de 6 dígitos para o cliente confirmar a venda
            </Text>
            {/* Informações do Cliente e Venda */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={20} color="#b0b0b0" />
                <Text style={styles.infoText}>{clienteNome}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color="#b0b0b0" />
                <Text style={styles.infoText}>{clienteTelefone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="cash-outline" size={20} color="#4CAF50" />
                <Text style={[styles.infoText, styles.valorText]}>{valor}</Text>
              </View>
            </View>
            {/* Mensagem de Erro */}
            {errorMessage ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#ff4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}
            {/* Opções de Envio */}
            <View style={styles.optionsContainer}>
              {/* WhatsApp */}
              <TouchableOpacity
                style={[styles.optionButton, styles.whatsappButton]}
                onPress={() => enviarCodigo('whatsapp')}
                disabled={loading}
              >
                {loading && metodoPressionado === 'whatsapp' ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-whatsapp" size={32} color="#ffffff" />
                    <Text style={styles.optionTitle}>WhatsApp</Text>
                    <Text style={styles.optionSubtitle}>Envio rápido e gratuito</Text>
                  </>
                )}
              </TouchableOpacity>
              {/* SMS */}
              <TouchableOpacity
                style={[styles.optionButton, styles.smsButton, styles.disabledButton]}
                onPress={() => enviarCodigo('sms')}
                disabled={true}
              >
                <Ionicons name="mail-outline" size={32} color="#666666" />
                <Text style={[styles.optionTitle, styles.disabledText]}>SMS</Text>
                <Text style={[styles.optionSubtitle, styles.disabledText]}>Em desenvolvimento</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>EM BREVE</Text>
                </View>
              </TouchableOpacity>
            </View>
            {/* Info adicional */}
            <View style={styles.alertContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#4CAF50" />
              <Text style={styles.alertText}>
                O código será válido por 10 minutos e garante que o cliente confirma a venda
              </Text>
            </View>
          </View>
        </ScrollView>
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
    width: 120,
    height: 120,
    borderRadius: 60,
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
    lineHeight: 22,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#ffffff',
    marginLeft: 12,
  },
  valorText: {
    fontWeight: 'bold',
    color: '#4CAF50',
    fontSize: 18,
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
  optionsContainer: {
    width: '100%',
    gap: 16,
  },
  optionButton: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  smsButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#3a3a3a',
  },
  disabledButton: {
    opacity: 0.6,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 4,
    opacity: 0.8,
  },
  disabledText: {
    color: '#666666',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  alertText: {
    color: '#4CAF50',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
});
