import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { createCard } from '@/data/store';
import { importImage } from '@/lib/vision-files';
import { radius, useColors } from '@/theme';
import { tap } from '@/ui/button';
import { Field } from '@/ui/field';
import { FormBody } from '@/ui/screen';
import { SheetHeader } from '@/ui/sheet-header';
import { T } from '@/ui/text';

export default function NewCard() {
  const c = useColors();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<string | null>(null);

  const pick = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!res.canceled && res.assets[0]) setPicked(res.assets[0].uri);
    } catch {
      Alert.alert('Couldn’t open your photos', 'Check that Synchros has photo access in Settings.');
    }
  };

  const save = () => {
    if (!title.trim()) return;
    let imageName: string | null = null;
    if (picked) {
      try {
        imageName = importImage(picked);
      } catch {
        Alert.alert('Couldn’t save that photo', 'The card was added without it. Try adding the photo again.');
      }
    }
    createCard(title.trim(), imageName);
    tap('success');
    router.back();
  };

  return (
    <>
      <SheetHeader title="New card" onCancel={() => router.back()} onSave={save} saveLabel="Add" canSave={!!title.trim()} />
      <FormBody>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={picked ? 'Change photo' : 'Choose a photo'}
          onPress={pick}
          style={[styles.picker, { backgroundColor: c.surface, borderColor: c.line }]}>
          {picked ? (
            <Image source={{ uri: picked }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Feather name="image" size={28} color={c.inner} />
              <T variant="bodyStrong">Choose a photo</T>
              <T variant="small" color="inkSoft">
                Optional. Words alone work too.
              </T>
            </View>
          )}
        </Pressable>
        <Field
          label="Caption"
          placeholder="Morning light in my own studio"
          value={title}
          onChangeText={setTitle}
          maxLength={80}
        />
      </FormBody>
    </>
  );
}

const styles = StyleSheet.create({
  picker: {
    aspectRatio: 1,
    width: '70%',
    alignSelf: 'center',
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
