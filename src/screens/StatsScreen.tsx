import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { TrendChart, TrendPoint } from "../components/TrendChart";
import { EmptyState } from "../components/ui";
import { colors, styles } from "../styles";
import { Category, CategorySpend, Transaction, TransactionType } from "../types";
import { formatMoney } from "../utils/money";

type TrendRange = "week" | "month" | "year";

export function StatsScreen({
  categories,
  spendByCategory,
  month,
  transactions
}: {
  categories: Category[];
  spendByCategory: CategorySpend[];
  month: string;
  transactions: Transaction[];
}) {
  const [metric, setMetric] = useState<TransactionType>("expense");
  const [range, setRange] = useState<TrendRange>("week");
  const trendPoints = useMemo(() => buildTrendPoints(transactions, range, month), [transactions, range, month]);
  const categoryIcons = useMemo(() => new Map(categories.map((category) => [category.id, category.icon])), [categories]);
  const incomeByCategory = useMemo(() => categoryTotals(transactions, categories, month, "income"), [transactions, categories, month]);
  const rankingItems = metric === "expense" ? spendByCategory : incomeByCategory;
  const rankingTotal = rankingItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.statsPage}>
      <View style={styles.statsHero}>
        <Text style={styles.statsHeroTitle} onPress={() => setMetric(metric === "expense" ? "income" : "expense")}>
          {metric === "expense" ? "支出" : "收入"} ▼
        </Text>
        <View style={styles.statsRangeSegment}>
          {[
            { label: "周", value: "week" },
            { label: "月", value: "month" },
            { label: "年", value: "year" }
          ].map((item) => (
            <Text
              key={item.value}
              style={[styles.statsRangeItem, range === item.value && styles.statsRangeItemActive]}
              onPress={() => setRange(item.value as TrendRange)}
            >
              {item.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.statsPeriodRow}>
        {periodLabels(range).map((label, index, labels) => (
          <Text key={`${range}-${label}`} style={[styles.statsPeriodText, index === labels.length - 1 && styles.statsPeriodTextActive]}>
            {label}
          </Text>
        ))}
      </View>

      <TrendChart points={trendPoints} metric={metric} />

      <Text style={styles.statsRankingTitle}>{metric === "expense" ? "支出排行榜" : "收入排行榜"}</Text>
      {rankingItems.length === 0 ? (
        <EmptyState title="暂无排行" body={`本月有${metric === "expense" ? "支出" : "收入"}后会展示分类排行。`} />
      ) : (
        <View style={styles.statsRankingList}>
          {rankingItems.map((item, index) => {
            const percent = rankingTotal > 0 ? (item.amount / rankingTotal) * 100 : 0;
            const icon = categoryIcons.get(item.categoryId) ?? "ellipsis-horizontal";
            return (
              <View key={item.categoryId} style={styles.statsRankingRow}>
                <View style={styles.statsRankingIcon}>
                  <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={26} color={colors.text} />
                </View>
                <View style={styles.statsRankingContent}>
                  <View style={styles.statsRankingTop}>
                    <Text style={styles.statsRankingName}>
                      {item.categoryName} <Text style={styles.statsRankingPercent}>{percent.toFixed(1)}%</Text>
                    </Text>
                    <Text style={styles.statsRankingAmount}>{formatMoney(item.amount)}</Text>
                  </View>
                  <View style={styles.statsRankingTrack}>
                    <View style={[styles.statsRankingFill, { width: `${Math.min(percent, 100)}%`, opacity: index === 0 ? 1 : 0.9 }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function categoryTotals(transactions: Transaction[], categories: Category[], month: string, type: TransactionType): CategorySpend[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type === type && transaction.date.startsWith(month)) {
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
    }
  }
  return [...totals.entries()]
    .map(([categoryId, amount]) => ({
      categoryId,
      categoryName: names.get(categoryId) ?? "未分类",
      amount: Math.round(amount * 100) / 100
    }))
    .sort((left, right) => right.amount - left.amount);
}

function buildTrendPoints(transactions: Transaction[], range: TrendRange, month: string): TrendPoint[] {
  if (range === "month") {
    const year = month.slice(0, 4);
    return Array.from({ length: 12 }, (_, index) => {
      const monthValue = `${year}-${String(index + 1).padStart(2, "0")}`;
      return {
        label: `${index + 1}月`,
        ...sumForPrefix(transactions, monthValue)
      };
    });
  }

  if (range === "year") {
    const currentYear = Number(month.slice(0, 4));
    return [currentYear - 1, currentYear].map((year) => ({
      label: year === currentYear ? "今年" : "去年",
      ...sumForPrefix(transactions, String(year))
    }));
  }

  const endDate = monthEndDate(month);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (6 - index));
    const iso = toIsoDate(date);
    return {
      label: iso.slice(5),
      ...sumForPrefix(transactions, iso)
    };
  });
}

function sumForPrefix(transactions: Transaction[], prefix: string): Pick<TrendPoint, "expense" | "income"> {
  const totals = { expense: 0, income: 0 };
  for (const transaction of transactions) {
    if (transaction.date.startsWith(prefix)) {
      totals[transaction.type] += transaction.amount;
    }
  }
  return {
    expense: Math.round(totals.expense * 100) / 100,
    income: Math.round(totals.income * 100) / 100
  };
}

function monthEndDate(month: string): Date {
  const [year, monthIndex] = month.split("-").map(Number);
  const today = new Date();
  const selectedMonthStart = new Date(year, monthIndex - 1, 1);
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  if (selectedMonthStart.getTime() === currentMonthStart.getTime()) {
    return today;
  }
  return new Date(year, monthIndex, 0);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function periodLabels(range: TrendRange): string[] {
  if (range === "year") {
    return ["去年", "今年"];
  }
  if (range === "month") {
    return ["上月", "本月"];
  }
  return ["17周", "18周", "19周", "20周", "本周"];
}
