import { Ionicons } from "@expo/vector-icons";
import { Pressable, TextInput, View } from "react-native";
import { ChoiceWrap, EmptyState, Field, Segment } from "../components/ui";
import { TransactionRow } from "../components/TransactionRow";
import { styles } from "../styles";
import { Account, Category, Transaction, TransactionFilters, TransactionType } from "../types";

export function RecordsScreen({
  filters,
  transactions,
  categories,
  accounts,
  onFiltersChange,
  onExport,
  onEdit,
  onCopy,
  onDelete
}: {
  filters: TransactionFilters;
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  onFiltersChange: (filters: TransactionFilters) => void;
  onExport: () => void;
  onEdit: (transaction: Transaction) => void;
  onCopy: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const visibleCategories = filters.type === "all" ? categories : categories.filter((item) => item.type === filters.type);

  function updateType(value: string) {
    onFiltersChange({
      ...filters,
      type: value as "all" | TransactionType,
      categoryId: ""
    });
  }

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          value={filters.query}
          onChangeText={(query) => onFiltersChange({ ...filters, query })}
          placeholder="搜索商户或备注"
          style={[styles.input, styles.flex]}
        />
        <Pressable style={styles.iconButton} onPress={onExport}>
          <Ionicons name="download" size={20} color="#111827" />
        </Pressable>
      </View>
      <Segment
        options={[
          { label: "全部", value: "all" },
          { label: "支出", value: "expense" },
          { label: "收入", value: "income" }
        ]}
        value={filters.type}
        onChange={updateType}
      />
      <ChoiceWrap
        title="分类筛选"
        items={[{ id: "", label: "全部分类", icon: "apps" }, ...visibleCategories.map((item) => ({ id: item.id, label: item.name, icon: item.icon }))]}
        value={filters.categoryId}
        onChange={(categoryId) => onFiltersChange({ ...filters, categoryId })}
      />
      <ChoiceWrap
        title="账户筛选"
        items={[{ id: "", label: "全部账户", icon: "wallet" }, ...accounts.map((item) => ({ id: item.id, label: item.name, icon: item.icon }))]}
        value={filters.accountId}
        onChange={(accountId) => onFiltersChange({ ...filters, accountId })}
      />
      <View style={styles.wrapRow}>
        <View style={styles.smallInput}>
          <Field label="开始日期" value={filters.startDate} placeholder="YYYY-MM-DD" onChangeText={(startDate) => onFiltersChange({ ...filters, startDate })} />
        </View>
        <View style={styles.smallInput}>
          <Field label="结束日期" value={filters.endDate} placeholder="YYYY-MM-DD" onChangeText={(endDate) => onFiltersChange({ ...filters, endDate })} />
        </View>
      </View>
      {transactions.length === 0 ? (
        <EmptyState title="没有匹配账单" body="调整筛选条件，或先新增一笔账单。" />
      ) : (
        transactions.map((item) => (
          <TransactionRow
            key={item.id}
            transaction={item}
            categories={categories}
            onEdit={() => onEdit(item)}
            onCopy={() => onCopy(item)}
            onDelete={() => onDelete(item.id)}
          />
        ))
      )}
    </View>
  );
}
