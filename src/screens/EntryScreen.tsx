import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { ChoiceWrap, Field, PrimaryButton, Segment } from "../components/ui";
import { styles } from "../styles";
import { Category, DraftTransaction, EntryMode, ManageableCategory, TransactionType } from "../types";
import { todayIso } from "../utils/date";
import { parseAmount } from "../utils/money";

const iconOptions = ["restaurant", "bus", "bag", "home", "medkit", "game-controller", "cart", "cafe", "pricetag", "ellipsis-horizontal"];

export function EntryScreen({
  draft,
  entryMode,
  editing,
  categories,
  onDraftChange,
  onTypeChange,
  onSubmit,
  onCancelEdit,
  categoryDraft,
  onCategoryDraftChange,
  onSaveCategory,
  onDeleteCategory
}: {
  draft: DraftTransaction;
  entryMode: EntryMode;
  editing: boolean;
  categories: Category[];
  onDraftChange: (draft: DraftTransaction) => void;
  onTypeChange: (type: TransactionType) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  categoryDraft: ManageableCategory;
  onCategoryDraftChange: (draft: ManageableCategory) => void;
  onSaveCategory: () => void;
  onDeleteCategory: (category: Category) => void;
}) {
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const visibleCategories = categories.filter((item) => item.type === draft.type);
  const baseCategories = visibleCategories.filter((item) => !(draft.type === "expense" && item.id === "cat-other-expense"));
  const compactCategories = showAllCategories ? baseCategories : baseCategories.slice(0, 8);
  const selectedCategory = baseCategories.find((item) => item.id === draft.categoryId);
  const categoryChoices = selectedCategory && !compactCategories.some((item) => item.id === selectedCategory.id) ? [...compactCategories, selectedCategory] : compactCategories;
  const categoryItems = [
    ...categoryChoices.map((item) => ({ id: item.id, label: item.name, icon: item.icon, onLongPress: () => onDeleteCategory(item) })),
    { id: "__add_category__", label: "添加分类", icon: "add-circle" }
  ];
  const selectedDate = parseDateParts(draft.date);
  const dateOptions = useMemo(() => buildDateOptions(draft.date), [draft.date]);
  const amountValue = parseAmount(draft.amount);
  const canSubmit = amountValue > 0 && Boolean(draft.categoryId);
  const modeNotice = getModeNotice(entryMode, draft.source);

  return (
    <View>
      {modeNotice ? (
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>{modeNotice.title}</Text>
          <Text style={styles.mutedText}>{modeNotice.body}</Text>
        </View>
      ) : null}

      <Segment
        options={[
          { label: "支出", value: "expense" },
          { label: "收入", value: "income" }
        ]}
        value={draft.type}
        onChange={(value) => {
          setShowAllCategories(false);
          setShowCategoryForm(false);
          onTypeChange(value as TransactionType);
        }}
      />

      <TextInput
        value={draft.amount}
        onChangeText={(amount) => onDraftChange({ ...draft, amount })}
        keyboardType="decimal-pad"
        placeholder="金额，例如 28.50"
        style={styles.amountInput}
      />
      {!canSubmit ? <Text style={styles.formHint}>输入大于 0 的金额后即可保存。</Text> : null}

      <ChoiceWrap
        title="分类"
        items={categoryItems}
        value={draft.categoryId}
        onChange={(categoryId) => {
          if (categoryId === "__add_category__") {
            setShowCategoryForm((current) => !current);
            return;
          }
          setShowCategoryForm(false);
          onDraftChange({ ...draft, categoryId });
        }}
      />
      {baseCategories.length > 8 ? (
        <Text style={styles.entryCategoryToggle} onPress={() => setShowAllCategories((current) => !current)}>
          {showAllCategories ? "收起分类" : `展开全部 ${baseCategories.length} 个分类`}
        </Text>
      ) : null}
      {showCategoryForm ? (
        <View style={styles.inlineAddPanel}>
          <Text style={styles.statLabel}>新增分类</Text>
          <View style={styles.wrapRow}>
            <TextInput value={categoryDraft.name} onChangeText={(name) => onCategoryDraftChange({ ...categoryDraft, name, type: draft.type })} placeholder="新分类名" style={[styles.input, styles.smallInput]} />
            <TextInput value={categoryDraft.icon} onChangeText={(icon) => onCategoryDraftChange({ ...categoryDraft, icon, type: draft.type })} placeholder="图标名" style={[styles.input, styles.smallInput]} />
          </View>
          <ChoiceWrap
            title="选择图标"
            items={iconOptions.map((icon) => ({ id: icon, label: iconLabel(icon), icon }))}
            value={categoryDraft.icon}
            onChange={(icon) => onCategoryDraftChange({ ...categoryDraft, icon, type: draft.type })}
          />
          <PrimaryButton label="新增分类" onPress={onSaveCategory} />
        </View>
      ) : null}

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>日期</Text>
        <Pressable style={styles.dateSelectButton} onPress={() => setShowDatePicker((current) => !current)}>
          <Text style={styles.dateSelectText}>{draft.date}</Text>
          <Text style={styles.dateSelectHint}>点击选择年月日</Text>
        </Pressable>
        {showDatePicker ? (
          <View style={styles.datePickerPanel}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerQuickText} onPress={() => onDraftChange({ ...draft, date: todayIso() })}>
                今天
              </Text>
              <Text style={styles.datePickerDoneText} onPress={() => setShowDatePicker(false)}>
                完成
              </Text>
            </View>
            <DateOptionRow
              title="年份"
              options={dateOptions.years.map((year) => ({ label: `${year}年`, value: String(year), disabled: year > dateOptions.today.year }))}
              value={String(selectedDate.year)}
              onChange={(year) => onDraftChange({ ...draft, date: normalizeDate(Number(year), selectedDate.month, selectedDate.day) })}
            />
            <DateOptionRow
              title="月份"
              options={dateOptions.months.map((month) => ({
                label: `${month}月`,
                value: String(month),
                disabled: selectedDate.year === dateOptions.today.year && month > dateOptions.today.month
              }))}
              value={String(selectedDate.month)}
              onChange={(month) => onDraftChange({ ...draft, date: normalizeDate(selectedDate.year, Number(month), selectedDate.day) })}
            />
            <DateOptionRow
              title="日期"
              options={dateOptions.days.map((day) => ({
                label: `${day}`,
                value: String(day),
                disabled: selectedDate.year === dateOptions.today.year && selectedDate.month === dateOptions.today.month && day > dateOptions.today.day
              }))}
              value={String(selectedDate.day)}
              onChange={(day) => {
                onDraftChange({ ...draft, date: normalizeDate(selectedDate.year, selectedDate.month, Number(day)) });
                setShowDatePicker(false);
              }}
            />
          </View>
        ) : null}
      </View>

      <Field label="备注" value={draft.note} placeholder="可选" onChangeText={(note) => onDraftChange({ ...draft, note })} />
      <Field label="商户/对象" value={draft.merchant} placeholder="店铺、收款方或付款方" onChangeText={(merchant) => onDraftChange({ ...draft, merchant })} />
      <PrimaryButton label={editing ? "保存修改" : draft.source === "ocr" ? "确认票据入账" : "保存账单"} onPress={onSubmit} disabled={!canSubmit} />
      {editing ? <PrimaryButton label="取消编辑" onPress={onCancelEdit} /> : null}
    </View>
  );
}

function DateOptionRow({
  title,
  options,
  value,
  onChange
}: {
  title: string;
  options: Array<{ label: string; value: string; disabled?: boolean }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.datePickerSection}>
      <Text style={styles.datePickerTitle}>{title}</Text>
      <View style={styles.datePickerGrid}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            style={[styles.datePickerItem, value === option.value && styles.datePickerItemActive, option.disabled && styles.datePickerItemDisabled]}
            onPress={() => {
              if (!option.disabled) {
                onChange(option.value);
              }
            }}
          >
            <Text style={[styles.datePickerItemText, value === option.value && styles.datePickerItemTextActive, option.disabled && styles.datePickerItemTextDisabled]}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function buildDateOptions(date: string) {
  const selected = parseDateParts(date);
  const today = parseDateParts(todayIso());
  const years = Array.from({ length: 6 }, (_, index) => today.year - 5 + index);
  const months = Array.from({ length: 12 }, (_, index) => index + 1);
  const daysInMonth = new Date(selected.year, selected.month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  return { years, months, days, today };
}

function parseDateParts(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split("-").map(Number);
  const today = new Date();
  return {
    year: Number.isFinite(year) ? year : today.getFullYear(),
    month: Number.isFinite(month) ? month : today.getMonth() + 1,
    day: Number.isFinite(day) ? day : today.getDate()
  };
}

function normalizeDate(year: number, month: number, day: number): string {
  const daysInMonth = new Date(year, month, 0).getDate();
  const normalizedDay = Math.min(day, daysInMonth);
  const date = `${year}-${String(month).padStart(2, "0")}-${String(normalizedDay).padStart(2, "0")}`;
  const today = todayIso();
  return date > today ? today : date;
}

function getModeNotice(entryMode: EntryMode, source: DraftTransaction["source"]) {
  if (entryMode === "edit") {
    return {
      title: "正在编辑账单",
      body: "保存后会覆盖原记录，取消编辑可回到新增模式。"
    };
  }
  if (entryMode === "copy") {
    return {
      title: "已复制为新账单",
      body: "金额、分类、备注和商户已带入，日期默认改为今天，保存后会新增一条记录。"
    };
  }
  if (entryMode === "ocr" || source === "ocr") {
    return {
      title: "票据候选入账",
      body: "请确认金额、分类、日期和商户信息无误后再入账。"
    };
  }
  return null;
}

function iconLabel(icon: string): string {
  const labels: Record<string, string> = {
    restaurant: "餐饮",
    bus: "交通",
    bag: "购物",
    home: "居家",
    medkit: "医疗",
    "game-controller": "娱乐",
    cart: "超市",
    cafe: "咖啡",
    pricetag: "标签",
    "ellipsis-horizontal": "其他"
  };
  return labels[icon] ?? icon;
}
