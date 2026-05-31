import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { ChoiceWrap, Field, PrimaryButton, Segment } from "../components/ui";
import { styles } from "../styles";
import { Account, Category, DraftTransaction, ManageableCategory, TransactionType } from "../types";

export function EntryScreen({
  draft,
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
  const visibleCategories = categories.filter((item) => item.type === draft.type);
  const iconOptions = ["restaurant", "bus", "bag", "home", "medkit", "game-controller", "cart", "cafe", "pricetag", "ellipsis-horizontal"];
  const categoryItems = [
    ...visibleCategories
      .filter((item) => !(draft.type === "expense" && item.id === "cat-other-expense"))
      .map((item) => ({ id: item.id, label: item.name, icon: item.icon, onLongPress: () => onDeleteCategory(item) })),
    { id: "__add_category__", label: "添加分类", icon: "add-circle" }
  ];

  return (
    <View>
      <Segment
        options={[
          { label: "支出", value: "expense" },
          { label: "收入", value: "income" }
        ]}
        value={draft.type}
        onChange={(value) => onTypeChange(value as TransactionType)}
      />
      <TextInput
        value={draft.amount}
        onChangeText={(amount) => onDraftChange({ ...draft, amount })}
        keyboardType="decimal-pad"
        placeholder="金额，例如 28.50"
        style={styles.amountInput}
      />
      <Field label="备注" value={draft.note} placeholder="可选" onChangeText={(note) => onDraftChange({ ...draft, note })} />
      <PrimaryButton label={editing ? "保存修改" : draft.source === "ocr" ? "确认票据入账" : "保存账单"} onPress={onSubmit} />
      {editing ? <PrimaryButton label="取消编辑" onPress={onCancelEdit} /> : null}
      <ChoiceWrap
        title="分类"
        items={categoryItems}
        value={draft.categoryId}
        onChange={(categoryId) => {
          if (categoryId === "__add_category__") {
            setShowCategoryForm((current) => !current);
            return;
          }
          onDraftChange({ ...draft, categoryId });
        }}
      />
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
          <PrimaryButton label="添加分类" onPress={onSaveCategory} />
        </View>
      ) : null}
      <Field label="日期" value={draft.date} onChangeText={(date) => onDraftChange({ ...draft, date })} />
      <Field label="商户/对象" value={draft.merchant} placeholder="店铺、收款方或付款方" onChangeText={(merchant) => onDraftChange({ ...draft, merchant })} />
    </View>
  );
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
