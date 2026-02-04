import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function AddClientScreen() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [documento, setDocumento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [fotoDocumento, setFotoDocumento] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Validar CPF
  const validarCPF = (cpf: string): boolean => {
    const numbers = cpf.replace(/\D/g, '');
    
    if (numbers.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(numbers)) return false;
    
    // Valida primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(numbers.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers.charAt(9))) return false;
    
    // Valida segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(numbers.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(numbers.charAt(10))) return false;
    
    return true;
  };

  // Formatar CPF/CNPJ
  const formatarDocumento = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  // Formatar telefone
  const formatarTelefone = (text: string) => {
    const numbers = text.replace(/\D/g, '');
    
    // (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
  };

  // Solicitar foto
  const selecionarFoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      setErrorMessage('Permissão para acessar a galeria é necessária');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoDocumento(result.assets[0].uri);
      setErrorMessage('');
    }
  };

  // Tirar foto
  const tirarFoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      setErrorMessage('Permissão para acessar a câmera é necessária');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setFotoDocumento(result.assets[0].uri);
      setErrorMessage('');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    // Validações
    if (!nome || !documento || !telefone || !endereco) {
      setErrorMessage('Preencha todos os campos obrigatórios');
      return;
    }

    // Valida CPF (se tiver 11 dígitos)
    const numbers = documento.replace(/\D/g, '');
    if (numbers.length === 11 && !validarCPF(documento)) {
      setErrorMessage('CPF inválido. Verifique os números digitados.');
      return;
    }

    if (!fotoDocumento) {
      setErrorMessage('Adicione uma foto do documento');
      return;
    }

    setLoading(true);

    try {
      // TODO: Implementar chamada para API com FormData para enviar a imagem
      const formData = new FormData();
      formData.append('nome', nome);
      formData.append('documento', documento.replace(/\D/g, '')); // Remove formatação
      formData.append('telefone', telefone.replace(/\D/g, '')); // Remove formatação
      formData.append('endereco', endereco);
      
      // Adiciona a foto
      if (fotoDocumento) {
        const filename = fotoDocumento.split('/').pop() || 'document.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('fotoDocumento', {
          uri: fotoDocumento,
          name: filename,
          type: type,
        } as any);
      }
      
      // Simulação - em produção trocar por fetch para API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Cliente cadastrado:', { 
        nome, 
        documento, 
        telefone, 
        endereco,
        fotoDocumento: fotoDocumento ? 'anexada' : 'não anexada'
      });
      
      setSuccessMessage('Cliente cadastrado com sucesso!');
      
      // Limpar campos
      setNome('');
      setDocumento('');
      setTelefone('');
      setEndereco('');
      setFotoDocumento(null);

      // Voltar para home após 2 segundos
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error);
      setErrorMessage('Erro ao cadastrar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Cliente</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mensagem de Erro */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#ff4444" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Mensagem de Sucesso */}
        {successMessage ? (
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Campo Nome */}
        <Text style={styles.label}>Nome Completo *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Digite o nome completo"
            placeholderTextColor="#666"
            value={nome}
            onChangeText={setNome}
            autoCapitalize="words"
          />
        </View>

        {/* Campo CPF/CNPJ */}
        <Text style={styles.label}>CPF ou CNPJ *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="card-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#666"
            value={documento}
            onChangeText={(text) => setDocumento(formatarDocumento(text))}
            keyboardType="numeric"
            maxLength={18}
          />
        </View>

        {/* Campo Telefone */}
        <Text style={styles.label}>Telefone (Celular) *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="call-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="(00) 00000-0000"
            placeholderTextColor="#666"
            value={telefone}
            onChangeText={(text) => setTelefone(formatarTelefone(text))}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </View>

        {/* Campo Endereço */}
        <Text style={styles.label}>Endereço *</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="location-outline" size={20} color="#b0b0b0" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Rua, número, bairro, cidade"
            placeholderTextColor="#666"
            value={endereco}
            onChangeText={setEndereco}
            autoCapitalize="words"
            multiline
          />
        </View>

        {/* Foto do Documento */}
        <Text style={styles.label}>Foto do Documento *</Text>
        <Text style={styles.helperText}>RG, CNH, ou documento com foto</Text>

        {fotoDocumento ? (
          <View style={styles.photoContainer}>
            <Image source={{ uri: fotoDocumento }} style={styles.photo} />
            <TouchableOpacity 
              style={styles.removePhotoButton}
              onPress={() => setFotoDocumento(null)}
            >
              <Ionicons name="close-circle" size={32} color="#ff4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoButton} onPress={tirarFoto}>
              <Ionicons name="camera" size={32} color="#4CAF50" />
              <Text style={styles.photoButtonText}>Tirar Foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.photoButton} onPress={selecionarFoto}>
              <Ionicons name="images" size={32} color="#4CAF50" />
              <Text style={styles.photoButtonText}>Galeria</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Botão Salvar */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Salvando...' : 'Cadastrar Cliente'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e0e0',
    marginBottom: 8,
    marginTop: 16,
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 15,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  photoButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#2a2a2a',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonDisabled: {
    backgroundColor: '#2a5a2d',
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4a1a1a',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  errorText: {
    color: '#ff6666',
    fontSize: 14,
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
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  successText: {
    color: '#66ff66',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});
