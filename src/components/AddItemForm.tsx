import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useWardrobeStore } from '../store/wardrobeStore';
import { ClothingCategory } from '../types';
import * as FileSystem from 'expo-file-system';

interface AddItemFormProps {
  onClose: () => void;
}

// Предустановленные материалы
const PREDEFINED_MATERIALS = [
  'cotton',
  'polyester',
  'wool',
  'silk',
  'linen',
  'synthetic',
  'blend',
  'leather',
  'suede',
  'denim',
  'corduroy',
];

export const AddItemForm: React.FC<AddItemFormProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [category, setCategory] = useState<ClothingCategory>('top');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [material, setMaterial] = useState('');
  const [customMaterial, setCustomMaterial] = useState('');
  const [materialDropdownOpen, setMaterialDropdownOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [season, setSeason] = useState<string[]>(['spring', 'summer', 'autumn', 'winter']);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const addItem = useWardrobeStore(state => state.addItem);

  /** Выбор фото: камера */
  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') return accessWebCamera();
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert(t('common.error'), t('addItem.cameraPermission'));
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  /** Выбор фото: галерея */
  const handlePickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert(t('common.error'), t('addItem.galleryPermission'));
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
  };

  /** Web-камера */
  const accessWebCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        const confirmed = window.confirm(t('addItem.webCameraConfirm'));
        if (confirmed) captureWebCameraPhoto(stream);
        else stream.getTracks().forEach(track => track.stop());
      }
    } catch (error: any) {
      const msg = error.name === 'NotAllowedError' ? t('addItem.cameraDenied') :
                  error.name === 'NotFoundError' ? t('addItem.cameraNotFound') :
                  t('addItem.cameraError') + ': ' + error.message;
      Alert.alert(t('common.error'), msg);
    }
  };

  const captureWebCameraPhoto = (stream: MediaStream) => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        setImageUri(canvasRef.current.toDataURL('image/jpeg', 0.8));
      }
    }
    stream.getTracks().forEach(track => track.stop());
  };

  /** Сохраняем вещь */
  const handleSave = async () => {
    if (!imageUri) return Alert.alert(t('common.error'), t('addItem.validation.errorSelectPhoto'));
    if (!name.trim()) return Alert.alert(t('common.error'), t('addItem.validation.errorEmptyName'));
    setIsLoading(true);

    try {
      let base64: string;
      if (Platform.OS === 'web') {
        const res = await fetch(imageUri);
        const blob = await res.blob();
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
      }

      const itemData = {
        name,
        category,
        color: color || 'not specified',
        material: material || customMaterial || 'not specified',
        imageBase64: `data:image/jpeg;base64,${base64}`,
        notes,
        season,
        userId: 'default',
      };

      await addItem(itemData);
      if (Platform.OS === 'web') { window.alert(t('addItem.success')); onClose(); }
      else Alert.alert(t('common.success'), t('addItem.success'), [{ text: 'OK', onPress: onClose }]);
    } catch (err) {
      console.error(err);
      Alert.alert(t('common.error'), t('addItem.validation.errorSaveItem'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {Platform.OS === 'web' && (
        <>
          <video ref={videoRef as any} style={{ display: 'none' }} width="1280" height="720" />
          <canvas ref={canvasRef as any} style={{ display: 'none' }} width="1280" height="720" />
        </>
      )}

      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('addItem.title')}</Text>

        {/* Фото */}
        <View style={styles.photoSection}>
          {imageUri ? (
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                <Text style={styles.removeImageButtonText}>{t('addItem.removePhoto')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity style={[styles.photoButton, styles.cameraButton]} onPress={handleTakePhoto}>
                <Text style={styles.photoButtonText}>{t('addItem.camera')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.photoButton, styles.galleryButton]} onPress={handlePickFromGallery}>
                <Text style={styles.photoButtonText}>{t('addItem.gallery')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Название */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.name')} *</Text>
          <TextInput style={styles.input} placeholder={t('addItem.namePlaceholder')} value={name} onChangeText={setName} placeholderTextColor="#999" />
        </View>

        {/* Категории */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.category')} *</Text>
          <View style={styles.categoryButtons}>
            {(['top', 'bottom', 'shoes'] as ClothingCategory[]).map(cat => (
              <TouchableOpacity key={cat} style={[styles.categoryButton, category === cat && styles.categoryButtonActive]} onPress={() => setCategory(cat)}>
                <Text style={[styles.categoryButtonText, category === cat && styles.categoryButtonTextActive]}>
                  {t(`wardrobe.category.${cat}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Цвет */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.color')}</Text>
          <TextInput style={styles.input} placeholder={t('addItem.colorPlaceholder')} value={color} onChangeText={setColor} placeholderTextColor="#999" />
        </View>

        {/* Материал */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('common.material')}</Text>
          <TouchableOpacity style={styles.dropdownButton} onPress={() => setMaterialDropdownOpen(!materialDropdownOpen)}>
            <Text style={styles.dropdownButtonText}>{material || customMaterial || t('addItem.selectMaterial')}</Text>
            <Text style={styles.dropdownArrow}>{materialDropdownOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {materialDropdownOpen && (
            <View style={styles.dropdown}>
              {PREDEFINED_MATERIALS.map(mat => (
                <TouchableOpacity key={mat} style={[styles.dropdownItem, material === mat && styles.dropdownItemSelected]} onPress={() => { setMaterial(mat); setCustomMaterial(''); setMaterialDropdownOpen(false); }}>
                  <Text style={[styles.dropdownItemText, material === mat && styles.dropdownItemTextSelected]}>{t(`wardrobe.material.${mat}`)}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setMaterial(''); setMaterialDropdownOpen(false); }}>
                <Text style={styles.dropdownItemText}>+ {t('addItem.other')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {!material && <TextInput style={styles.input} placeholder={t('addItem.customMaterialPlaceholder')} value={customMaterial} onChangeText={setCustomMaterial} placeholderTextColor="#999" />}
        </View>

        {/* Заметки */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.notes')}</Text>
          <TextInput style={[styles.input, styles.noteInput]} placeholder={t('addItem.notesPlaceholder')} value={notes} onChangeText={setNotes} multiline placeholderTextColor="#999" />
        </View>

        {/* Сезоны */}
        <View style={styles.section}>
          <Text style={styles.label}>{t('addItem.season')}</Text>
          <View style={styles.seasonButtons}>
            {['spring', 'summer', 'autumn', 'winter'].map(s => (
              <TouchableOpacity key={s} style={[styles.seasonButton, season.includes(s) && styles.seasonButtonActive]} onPress={() => setSeason(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s])}>
                <Text style={[styles.seasonButtonText, season.includes(s) && styles.seasonButtonTextActive]}>{t(`common.${s}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Кнопки */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.cancelButton]} onPress={onClose} disabled={isLoading}>
            <Text style={styles.cancelButtonText}>{t('addItem.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.saveButton]} onPress={handleSave} disabled={isLoading}>
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.saveButtonText}>{t('addItem.save')}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
};


const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#0f172a',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  noteInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoSection: {
    marginBottom: 24,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: 256,
    borderRadius: 14,
    marginBottom: 16,
  },
  removeImageButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removeImageButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  photoButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: '#2563eb',
  },
  galleryButton: {
    backgroundColor: '#a855f7',
  },
  photoButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  categoryButtonActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  categoryButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginTop: 4,
    overflow: 'hidden',
    maxHeight: 240,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dropdownItemSelected: {
    backgroundColor: '#eef2ff',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownItemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  seasonButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  seasonButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  seasonButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  seasonButtonText: {
    fontWeight: '600',
    color: '#374151',
    fontSize: 13,
  },
  seasonButtonTextActive: {
    color: '#ffffff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e2e8f0',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: '600',
    color: '#ffffff',
  },
});
