import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { styles } from "../styles";
import { Category, Transaction } from "../types";
import { formatMoney } from "../utils/money";

export function TransactionRow({
  transaction,
  categories,
  onEdit,
  onCopy,
  onDelete
}: {
  transaction: Transaction;
  categories: Category[];
  onEdit: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const category = categories.find((item) => item.id === transaction.categoryId);
  const sign = transaction.type === "expense" ? "-" : "+";
  const categoryName = category?.name ?? "未分类";

  return (
    <View style={styles.transactionRow}>
      <View style={styles.transactionIcon}>
        <Ionicons name={(category?.icon ?? "ellipse") as keyof typeof Ionicons.glyphMap} size={20} color="#2f2f33" />
      </View>
      <View style={styles.flex}>
        <Text style={styles.transactionTitle}>{transaction.merchant || category?.name || "账单"}</Text>
        <Text style={styles.transactionMeta}>{categoryName}</Text>
        {transaction.note ? <Text style={styles.transactionNote}>{transaction.note}</Text> : null}
      </View>
      <View style={styles.transactionRight}>
        <Text style={[styles.transactionAmount, transaction.type === "income" && styles.income]}>
          {sign}
          {formatMoney(transaction.amount)}
        </Text>
        <View style={styles.rowActions}>
          <Pressable style={styles.iconAction} onPress={onEdit}>
            <Ionicons name="create-outline" size={15} color="#9ca3af" />
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onCopy}>
            <Ionicons name="copy-outline" size={15} color="#9ca3af" />
          </Pressable>
          <Pressable style={styles.iconAction} onPress={onDelete}>
            <Ionicons name="trash-outline" size={15} color="#9ca3af" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
