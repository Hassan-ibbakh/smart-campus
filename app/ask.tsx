import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, StyleSheet, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import BottomNav from '../components/BottomNav';
import VoiceButton from '../components/VoiceButton';
import { useSpeech } from '../hooks/useSpeech';

// ─── IP de votre PC ───────────────────────────────────────────────────────────
const API_URL = 'http://100.121.192.82:8081';

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavStep { instruction: string; distance?: number; }
interface VoiceAskResponse {
  transcription: string;
  answer: string;
  destination_node: string | null;
  service_name: string | null;
  horaires: string | null;
  navigation: { path: string[]; steps: NavStep[]; total_distance?: number } | null;
  audio_base64: string | null;
  audio_format: string;
}
interface AskResponse {
  answer: string;
  destination_node: string | null;
  service_name: string | null;
  horaires: string | null;
  navigation: { path: string[]; steps: NavStep[]; total_distance?: number } | null;
}
interface Message {
  id: string;
  type: 'user' | 'bot';
  text: string;
  isVoice?: boolean;
  response?: AskResponse;
  audioB64?: string;
}

const SUGGESTIONS = ['Relevé de notes', 'Manger sur le campus', 'Carte étudiante', 'Orientation & stage'];

// ─── Helper : upload audio via XMLHttpRequest (évite le bug fetch/FormData Expo)
function uploadAudio(uri: string, currentNode: string): Promise<VoiceAskResponse> {
  return new Promise((resolve, reject) => {
    const xhr  = new XMLHttpRequest();
    const form = new FormData();
    form.append('audio',        { uri, type: 'audio/m4a', name: 'query.m4a' } as any);
    form.append('current_node', currentNode);

    xhr.open('POST', `${API_URL}/ask/voice`);
    xhr.timeout = 30000;

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { reject(new Error('JSON invalide')); }
      } else {
        reject(new Error(`Serveur ${xhr.status} : ${xhr.responseText}`));
      }
    };
    xhr.onerror   = () => reject(new Error('Réseau inaccessible'));
    xhr.ontimeout = () => reject(new Error('Timeout — serveur trop lent'));
    xhr.send(form);
  });
}

export default function AskScreen() {
  const router    = useRouter();
  const { speak } = useSpeech();
  const scrollRef = useRef<ScrollView>(null);
  const soundRef  = useRef<Audio.Sound | null>(null);

  const [query,     setQuery]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [messages,  setMessages]  = useState<Message[]>([
    { id: 'welcome', type: 'bot', text: "Bonjour ! Tapez ou parlez pour trouver un service du campus." },
  ]);

  const scrollToBottom = () =>
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);

  // ─── Lecture audio base64 (expo-av) ───────────────────────────────────────
  const playAudio = async (msgId: string, b64: string) => {
    try {
      // Arrêter l'audio précédent
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingId(msgId);

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${b64}` },
        { shouldPlay: true },
      );
      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (e) {
      console.error('[Audio]', e);
      setPlayingId(null);
      // Fallback synthèse vocale native
      const msg = messages.find(m => m.id === msgId);
      if (msg) speak(msg.text, 'normal');
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setPlayingId(null);
  };

  // ─── Envoi texte → /ask ────────────────────────────────────────────────────
  const handleSend = async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), type: 'user', text: trimmed }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, current_node: 'entrance' }),
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: AskResponse = await res.json();
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'bot', text: data.answer, response: data },
      ]);
      speak(data.answer, 'normal');
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'bot', text: "❌ Serveur inaccessible. Vérifiez l'IP." },
      ]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // ─── Envoi audio → /ask/voice ─────────────────────────────────────────────
  const handleSpeechEnd = async (audioUri: string) => {
    if (loading) return;
    setLoading(true);
    speak("Analyse en cours...", "normal");

    try {
      const data = await uploadAudio(audioUri, 'entrance');

      // Bulle utilisateur : transcription
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'user',
        text: data.transcription,
        isVoice: true,
      }]);
      scrollToBottom();

      // Bulle bot : réponse
      const botId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: botId,
        type: 'bot',
        text: data.answer,
        audioB64: data.audio_base64 ?? undefined,
        response: {
          answer: data.answer,
          destination_node: data.destination_node,
          service_name: data.service_name,
          horaires: data.horaires,
          navigation: data.navigation,
        },
      }]);

      // Jouer l'audio automatiquement
      if (data.audio_base64) {
        await playAudio(botId, data.audio_base64);
      } else {
        speak(data.answer, 'normal');
      }

    } catch (e: any) {
      console.error('[VoiceRAG]', e.message);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        text: `❌ ${e.message ?? 'Erreur vocale. Réessayez.'}`,
      }]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  };

  // ─── Navigation ────────────────────────────────────────────────────────────
  const handleNavigate = (r: AskResponse) => {
    if (!r.navigation) return;
    speak(`Je vous guide vers ${r.service_name}`, 'high');
    router.push({
      pathname: '/navigate',
      params: {
        destination: r.destination_node ?? '',
        steps: JSON.stringify(r.navigation.steps),
        enhancedAccessibility: 'false',
      },
    });
  };

  // ─── Rendu message ─────────────────────────────────────────────────────────
  const renderMessage = (msg: Message) => {
    const isUser    = msg.type === 'user';
    const r         = msg.response;
    const isPlaying = playingId === msg.id;

    return (
      <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowBot]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Ionicons name="school" size={14} color="#fff" />
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          {/* Badge vocal */}
          {msg.isVoice && (
            <View style={styles.voiceTag}>
              <Ionicons name="mic" size={11} color="#fff" />
              <Text style={styles.voiceTagText}>vocal</Text>
            </View>
          )}

          <Text style={isUser ? styles.textUser : styles.textBot}>{msg.text}</Text>

          {/* Bouton écouter / arrêter */}
          {!isUser && msg.audioB64 && (
            <TouchableOpacity
              style={[styles.audioBtn, isPlaying && styles.audioBtnActive]}
              onPress={() => isPlaying ? stopAudio() : playAudio(msg.id, msg.audioB64!)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? "pause-circle" : "volume-high-outline"}
                size={15}
                color={isPlaying ? "#fff" : "#2563EB"}
              />
              <Text style={[styles.audioBtnText, isPlaying && { color: '#fff' }]}>
                {isPlaying ? "Arrêter" : "Écouter"}
              </Text>
              {isPlaying && (
                <ActivityIndicator size="small" color="#fff" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          )}

          {/* Infos service */}
          {r?.service_name && (
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={13} color="#2563EB" />
                <Text style={styles.infoText}>{r.service_name}</Text>
              </View>
              {r.horaires && (
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={13} color="#2563EB" />
                  <Text style={styles.infoText}>{r.horaires}</Text>
                </View>
              )}
              {r.navigation?.total_distance !== undefined && (
                <View style={styles.infoRow}>
                  <Ionicons name="walk-outline" size={13} color="#2563EB" />
                  <Text style={styles.infoText}>{r.navigation.total_distance} m environ</Text>
                </View>
              )}
            </View>
          )}

          {r?.navigation && (
            <TouchableOpacity
              style={styles.navBtn}
              onPress={() => handleNavigate(r)}
              activeOpacity={0.8}
            >
              <Ionicons name="navigate" size={14} color="#fff" />
              <Text style={styles.navBtnText}>INITIALIZE ROUTE</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ─── UI ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSub}>SERVICE FINDER</Text>
          <Text style={styles.headerTitle}>ASSISTANT CAMPUS</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>RAG ONLINE</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}
          {loading && (
            <View style={[styles.msgRow, styles.msgRowBot]}>
              <View style={styles.avatar}>
                <Ionicons name="school" size={14} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleBot, styles.loadingBubble]}>
                <ActivityIndicator size="small" color="#2563EB" />
                <Text style={styles.loadingText}>RAG SCANNING...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestions}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          >
            {SUGGESTIONS.map(s => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => setQuery(s)} activeOpacity={0.7}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Barre d'input */}
        <View style={styles.inputBar}>
          {/* Toggle texte / voix */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, inputMode === 'text' && styles.modeBtnActive]}
              onPress={() => setInputMode('text')}
            >
              <Ionicons name="chatbubble-outline" size={15} color={inputMode === 'text' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, inputMode === 'voice' && styles.modeBtnActive]}
              onPress={() => setInputMode('voice')}
            >
              <Ionicons name="mic-outline" size={15} color={inputMode === 'voice' ? '#fff' : '#94A3B8'} />
            </TouchableOpacity>
          </View>

          {inputMode === 'text' ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Ex : Où obtenir mon relevé de notes ?"
                placeholderTextColor="#94A3B8"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!query.trim() || loading) && styles.sendBtnOff]}
                onPress={handleSend}
                disabled={!query.trim() || loading}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.voiceZone}>
              <View>
                <Text style={styles.voiceHint}>Appuyez et parlez</Text>
                <Text style={styles.voiceSubHint}>Vous recevrez une réponse audio 🔊</Text>
              </View>
              <View style={styles.voiceButtonWrap}>
                <VoiceButton onSpeechEnd={handleSpeechEnd} />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <BottomNav />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F8FAFC' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  backBtn:      { padding: 4 },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerSub:    { color: '#2563EB', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  headerTitle:  { color: '#1E293B', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(37,99,235,0.08)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(37,99,235,0.25)' },
  statusDot:    { width: 5, height: 5, borderRadius: 3, backgroundColor: '#00E676', marginRight: 5 },
  statusText:   { color: '#2563EB', fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  messages:   { flex: 1 },
  msgRow:     { flexDirection: 'row', marginBottom: 14, alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot:  { justifyContent: 'flex-start' },
  avatar:     { width: 26, height: 26, borderRadius: 13, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center' },
  bubble:     { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  bubbleBot:  { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  textUser:   { color: '#fff',    fontSize: 14, lineHeight: 20 },
  textBot:    { color: '#1E293B', fontSize: 14, lineHeight: 20 },

  voiceTag:     { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  voiceTagText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  audioBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(37,99,235,0.3)', backgroundColor: 'rgba(37,99,235,0.06)' },
  audioBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  audioBtnText:   { color: '#2563EB', fontSize: 12, fontWeight: '700' },

  infoBox: { marginTop: 10, backgroundColor: 'rgba(37,99,235,0.05)', borderRadius: 10, padding: 10, gap: 6, borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText:{ fontSize: 12, color: '#334155', fontWeight: '600' },

  navBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#2563EB', borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  navBtnText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },

  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  loadingText:   { color: '#64748B', fontSize: 10, fontWeight: '900', letterSpacing: 1 },

  suggestions: { maxHeight: 44, marginBottom: 8 },
  chip:        { backgroundColor: 'rgba(37,99,235,0.07)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(37,99,235,0.2)' },
  chipText:    { color: '#2563EB', fontSize: 12, fontWeight: '700' },

  inputBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 100, backgroundColor: '#F8FAFC' },
  modeToggle:  { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 20, padding: 2, gap: 2 },
  modeBtn:     { width: 30, height: 30, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modeBtnActive: { backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },

  input:      { flex: 1, backgroundColor: '#fff', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: '#1E293B', borderWidth: 1, borderColor: 'rgba(0,0,0,0.07)' },
  sendBtn:    { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  sendBtnOff: { backgroundColor: '#BFDBFE', shadowOpacity: 0, elevation: 0 },

  voiceZone:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(37,99,235,0.05)', borderRadius: 22, paddingHorizontal: 16, borderWidth: 1, borderColor: 'rgba(37,99,235,0.15)', height: 56 },
  voiceHint:       { color: '#1E293B', fontSize: 13, fontWeight: '700' },
  voiceSubHint:    { color: '#64748B', fontSize: 11, marginTop: 1 },
  voiceButtonWrap: { width: 44, height: 44 },
});