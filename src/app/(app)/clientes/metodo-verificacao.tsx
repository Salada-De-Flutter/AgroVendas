import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS } from '../../../config/api';
import { useAuth } from '../../../contexts/AuthContext';

export default function MetodoVerificacaoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [metodoPressionado, setMetodoPressionado] = useState<'whatsapp' | 'sms' | null>(null);

  // Desestruturar parâmetros recebidos
  const { nome, documento, telefone, endereco, codigoVerificacao, fotoDocumento } = params;

  const enviarCodigo = async (metodo: 'whatsapp' | 'sms') => {
    if (metodo === 'sms') {
      setErrorMessage('SMS em desenvolvimento. Use WhatsApp por enquanto.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setMetodoPressionado(metodo);

    try {
      console.log('Enviando código via', metodo);
      
      const response = await fetch(API_ENDPOINTS.CLIENTES.SEND_VERIFICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nomeCliente: nome,
          nomeVendedor: user?.nome || 'Vendedor',
          documento: documento,
          telefone: telefone,
          endereco: endereco,
          codigoVerificacao: codigoVerificacao,
          metodo: metodo,
        }),
      });

      const data = await response.json();
      console.log('Resposta do envio:', data);

      if (response.ok && data.sucesso) {
        console.log('✅ Código enviado com sucesso!');
        
        // Navegar para tela de validação
        router.push({
          pathname: '/(app)/clientes/validar-codigo',
          params: {
            nome,
            documento,
            telefone,
            endereco,
            codigoVerificacao,
            fotoDocumento,
            metodoEnvio: metodo,
          },
        });
      } else {
        setErrorMessage(data.mensagem || 'Erro ao enviar código');
      }
    } catch (error: any) {
      console.error('Erro ao enviar código:', error);
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
          <Text style={styles.headerTitle}>Verificação de Cliente</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          {/* Ícone */}
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color="#4CAF50" />
          </View>

          {/* Título */}
          <Text style={styles.title}>Escolha o método de envio</Text>
          <Text style={styles.subtitle}>
            Vamos enviar um código de verificação de 6 dígitos para o cliente
          </Text>

          {/* Informações do Cliente */}
          <View style={styles.infoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>{nome}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#b0b0b0" />
              <Text style={styles.infoText}>{telefone}</Text>
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
              O código será válido por 10 minutos
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
    marginBottom: 30,
    lineHeight: 24,
  },
  infoContainer: {
    width: '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  infoText: {
    color: '#ffffff',
    fontSize: 16,
    marginLeft: 10,
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
    gap: 15,
  },
  optionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    position: 'relative',
  },
  whatsappButton: {
    backgroundColor: '#25D366',
  },
  smsButton: {
    backgroundColor: '#3a3a3a',
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  disabledButton: {
    opacity: 0.5,
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 10,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: 5,
  },
  disabledText: {
    color: '#666666',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  comingSoonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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
