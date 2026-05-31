import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { Field, PrimaryButton, SectionTitle, Segment } from "../components/ui";
import { styles } from "../styles";
import { Account, Category, ManageableAccount, ManageableCategory, TransactionType } from "../types";

export function ManageScreen({
  categories,
  accounts,
  categoryDraft,
  accountDraft,
  onCategoryDraftChange,
  onAccountDraftChange,
  onSaveCategory,
  onSaveAccount,
  onEditCategory,
  onEditAccount
}: {
  categories: Category[];
  accounts: Account[];
  categoryDraft: ManageableCategory;
  accountDraft: ManageableAccount;
  onCategoryDraftChange: (draft: ManageableCategory) => void;
  onAccountDraftChange: (draft: ManageableAccount) => void;
  onSaveCategory: () => void;
  onSaveAccount: () => void;
  onEditCategory: (category: Category) => void;
  onEditAccount: (account: Account) => void;
}) {
  return (
    <View>
      <SectionTitle title="分类管理" />
      <Segment
        options={[
          { label: "支出", value: "expense" },
          { label: "收入", value: "income" }
        ]}
        value={categoryDraft.type}
        onChange={(type) => onCategoryDraftChange({ ...categoryDraft, type: type as TransactionType })}
      />
      <View style={styles.wrapRow}>
        <TextInput value={categoryDraft.name} onChangeText={(name) => onCategoryDraftChange({ ...categoryDraft, name })} placeholder="分类名称" style={[styles.input, styles.smallInput]} />
        <TextInput value={categoryDraft.icon} onChangeText={(icon) => onCategoryDraftChange({ ...categoryDraft, icon })} placeholder="Ionicons 图标" style={[styles.input, styles.smallInput]} />
      </View>
      <PrimaryButton label={categoryDraft.id ? "保存分类修改" : "新增分类"} onPress={onSaveCategory} />
      {categories.map((item) => (
        <Pressable key={item.id} style={styles.statLine} onPress={() => onEditCategory(item)}>
          <Text style={styles.statLabel}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} /> {item.name}
          </Text>
          <Text style={styles.statValue}>{item.type === "expense" ? "支出" : "收入"}</Text>
        </Pressable>
      ))}

      <SectionTitle title="账户管理" />
      <View style={styles.wrapRow}>
        <TextInput value={accountDraft.name} onChangeText={(name) => onAccountDraftChange({ ...accountDraft, name })} placeholder="账户名称" style={[styles.input, styles.smallInput]} />
        <TextInput value={accountDraft.icon} onChangeText={(icon) => onAccountDraftChange({ ...accountDraft, icon })} placeholder="Ionicons 图标" style={[styles.input, styles.smallInput]} />
      </View>
      <PrimaryButton label={accountDraft.id ? "保存账户修改" : "新增账户"} onPress={onSaveAccount} />
      {accounts.map((item) => (
        <Pressable key={item.id} style={styles.statLine} onPress={() => onEditAccount(item)}>
          <Text style={styles.statLabel}>
            <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={14} /> {item.name}
          </Text>
          <Text style={styles.statValue}>编辑</Text>
        </Pressable>
      ))}
      <Field label="图标说明" value="使用 Ionicons 图标名，例如 restaurant、wallet、card。" onChangeText={() => undefined} />
    </View>
  );
}
