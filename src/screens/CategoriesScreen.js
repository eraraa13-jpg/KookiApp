import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/colors';
import { getCategories, addCategory, updateCategory, deleteCategory } from '../database/Database';

const ICONS = ['🍕', '🚗', '🛍️', '💊', '🎮', '📄', '📚', '👔', '🏠', '🎁', '📱', '✈️', '💰', '💻', '📈', '💵', '📌'];

export default function CategoriesScreen({ navigation }) {
  const [cats, setCats] = useState([]);
  const [tab, setTab] = useState('expense');
  const [modal, setModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#e94560');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() { setCats(await getCategories()); }

  function openAdd() { setEditCat(null); setName(''); setIcon('📌'); setColor(COLORS.categories[0]); setModal(true); }
  function openEdit(c) { setEditCat(c); setName(c.name); setIcon(c.icon); setColor(c.color); setModal(true); }

  async function save() {
    if (!name.trim()) return Alert.alert('خطا', 'نام دسته لازمه');
    const d = { name: name.trim(), type: tab, icon, color };
    if (editCat) await updateCategory(editCat.id, { ...d, type: editCat.type }); else await addCategory(d);
    setModal(false); load();
  }

  function del(c) {
    Alert.alert('حذف', 'حذف "' + c.name + '"؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => { await deleteCategory(c.id); load(); } }
    ]);
  }

  const filtered = cats.filter((c) => c.type === tab);

  return (
    <View style={styles.bg}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="arrow-forward" size={24} color={COLORS.text} /></TouchableOpacity>
        <Text style={styles.title}>دسته‌بندی‌ها</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'expense' && { backgroundColor: COLORS.expenseBg }]} onPress={() => setTab('expense')}>
          <Text style={[styles.tabText, tab === 'expense' && { color: COLORS.expense }]}>هزینه‌ها</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'income' && { backgroundColor: COLORS.incomeBg }]} onPress={() => setTab('income')}>
          <Text style={[styles.tabText, tab === 'income' && { color: COLORS.income }]}>درآمدها</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.map((c) => (
          <TouchableOpacity key={c.id} style={styles.item} onPress={() => openEdit(c)} onLongPress={() => del(c)}>
            <View style={[styles.iconBox, { backgroundColor: c.color + '25' }]}><Text style={{ fontSize: 24 }}>{c.icon}</Text></View>
            <Text style={styles.itemName}>{c.name}</Text>
            <View style={[styles.dot, { backgroundColor: c.color }]} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{editCat ? 'ویرایش دسته' : 'دسته جدید'}</Text>
            <TextInput style={styles.input} placeholder="نام دسته‌بندی" placeholderTextColor={COLORS.textMuted} value={name} onChangeText={setName} textAlign="right" />
            <Text style={styles.lbl}>آیکون</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                {ICONS.map((i) => <TouchableOpacity key={i} style={[styles.iconOpt, icon === i && styles.iconSel]} onPress={() => setIcon(i)}><Text style={{ fontSize: 22 }}>{i}</Text></TouchableOpacity>)}
              </View>
            </ScrollView>
            <Text style={styles.lbl}>رنگ</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 }}>
              {COLORS.categories.map((c) => <TouchableOpacity key={c} style={[styles.clrOpt, { backgroundColor: c }, color === c && styles.clrSel]} onPress={() => setColor(c)} />)}
            </View>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}><Text style={styles.cancelText}>انصراف</Text></TouchableOpacity>
              <TouchableOpacity style={styles.okBtn} onPress={save}><Text style={styles.okText}>ذخیره</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 14 },
  title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center' },
  addBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 14, backgroundColor: COLORS.surface, borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginHorizontal: 16, marginVertical: 4 },
  iconBox: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  itemName: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text, textAlign: 'right' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  modalBg: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, maxHeight: '80%' },
  modalTitle: { fontSize: 19, fontWeight: 'bold', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: COLORS.surfaceLight, borderRadius: 14, padding: 12, fontSize: 15, color: COLORS.text, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  lbl: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, textAlign: 'right' },
  iconOpt: { padding: 8, borderRadius: 10, margin: 3, backgroundColor: COLORS.surfaceLight },
  iconSel: { backgroundColor: COLORS.primary + '30', borderWidth: 2, borderColor: COLORS.primary },
  clrOpt: { width: 32, height: 32, borderRadius: 16, margin: 4 },
  clrSel: { borderWidth: 3, borderColor: '#fff' },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.surfaceLight, marginLeft: 6, alignItems: 'center' },
  cancelText: { fontSize: 15, color: COLORS.textSecondary, fontWeight: '600' },
  okBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: COLORS.primary, marginRight: 6, alignItems: 'center' },
  okText: { fontSize: 15, color: '#fff', fontWeight: 'bold' },
});