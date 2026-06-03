import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { TrendChart, TrendPoint } from "../components/TrendChart";
import { EmptyState } from "../components/ui";
import { colors, styles } from "../styles";
import { Category, CategorySpend, Transaction, TransactionType } from "../types";
import { formatMoney } from "../utils/money";

type TrendRange = "week" | "month" | "year";
type PeriodOption = {
  label: string;
  start: string;
  end: string;
};

export function StatsScreen({
  categories,
  month,
  transactions
}: {
  categories: Category[];
  month: string;
  transactions: Transaction[];
}) {
  const [metric, setMetric] = useState<TransactionType>("expense");
  const [range, setRange] = useState<TrendRange>("week");
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(-1);
  const periodOptions = useMemo(() => buildPeriodOptions(range, month), [range, month]);
  const activePeriodIndex = selectedPeriodIndex >= 0 && selectedPeriodIndex < periodOptions.length ? selectedPeriodIndex : periodOptions.length - 1;
  const activePeriod = periodOptions[activePeriodIndex];
  const filteredTransactions = useMemo(() => filterTransactionsByPeriod(transactions, activePeriod), [transactions, activePeriod]);
  const trendPoints = useMemo(() => buildTrendPoints(transactions, filteredTransactions, range, activePeriod), [activePeriod, filteredTransactions, range, transactions]);
  const categoryIcons = useMemo(() => new Map(categories.map((category) => [category.id, category.icon])), [categories]);
  const expenseByCategory = useMemo(() => categoryTotals(filteredTransactions, categories, "expense"), [filteredTransactions, categories]);
  const incomeByCategory = useMemo(() => categoryTotals(filteredTransactions, categories, "income"), [filteredTransactions, categories]);
  const rankingItems = metric === "expense" ? expenseByCategory : incomeByCategory;
  const rankingTotal = rankingItems.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    setSelectedPeriodIndex(-1);
  }, [range, month]);

  return (
    <View style={styles.statsPage}>
      <View style={styles.statsHero}>
        <Pressable style={styles.statsHeroToggle} onPress={() => setMetric(metric === "expense" ? "income" : "expense")}>
          <Text style={styles.statsHeroTitle}>{metric === "expense" ? "支出" : "收入"}</Text>
          <Ionicons name="swap-horizontal" size={28} color={colors.text} />
        </Pressable>
        <View style={styles.statsRangeSegment}>
          {[
            { label: "周", value: "week" },
            { label: "月", value: "month" },
            { label: "年", value: "year" }
          ].map((item) => (
            <Text
              key={item.value}
              style={[styles.statsRangeItem, range === item.value && styles.statsRangeItemActive]}
              onPress={() => {
                setRange(item.value as TrendRange);
                setSelectedPeriodIndex(-1);
              }}
            >
              {item.label}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.statsPeriodRow}>
        {periodOptions.map((period, index) => (
          <Pressable key={`${range}-${period.label}-${period.start}`} onPress={() => setSelectedPeriodIndex(index)}>
            <Text style={[styles.statsPeriodText, index === activePeriodIndex && styles.statsPeriodTextActive]}>{period.label}</Text>
          </Pressable>
        ))}
      </View>

      <TrendChart points={trendPoints} metric={metric} />

      <Text style={styles.statsRankingTitle}>{metric === "expense" ? "支出排行榜" : "收入排行榜"}</Text>
      {rankingItems.length === 0 ? (
        <EmptyState title="暂无排行" body={`${activePeriod?.label ?? "当前区间"}没有${metric === "expense" ? "支出" : "收入"}记录。`} />
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

function categoryTotals(transactions: Transaction[], categories: Category[], type: TransactionType): CategorySpend[] {
  const names = new Map(categories.map((category) => [category.id, category.name]));
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type === type) {
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

function buildTrendPoints(allTransactions: Transaction[], periodTransactions: Transaction[], range: TrendRange, period: PeriodOption | undefined): TrendPoint[] {
  if (!period) {
    return [];
  }

  if (range === "year") {
    const year = Number(period.start.slice(0, 4));
    return Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return {
        label: `${index + 1}月`,
        ...sumForPrefix(allTransactions, `${year}-${month}`)
      };
    });
  }

  if (range === "month") {
    const firstDay = Number(period.start.slice(8, 10));
    const lastDay = Number(period.end.slice(8, 10));
    return Array.from({ length: lastDay - firstDay + 1 }, (_, index) => {
      const day = String(firstDay + index).padStart(2, "0");
      const date = `${period.start.slice(0, 8)}${day}`;
      return {
        label: date.slice(5),
        ...sumForPrefix(periodTransactions, date)
      };
    });
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = fromIsoDate(period.start);
    date.setDate(date.getDate() + index);
    const iso = toIsoDate(date);
    return {
      label: iso.slice(5),
      ...sumForPrefix(periodTransactions, iso)
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

function filterTransactionsByPeriod(transactions: Transaction[], period: PeriodOption | undefined): Transaction[] {
  if (!period) {
    return [];
  }
  return transactions.filter((transaction) => transaction.date >= period.start && transaction.date <= period.end);
}

function buildPeriodOptions(range: TrendRange, month: string): PeriodOption[] {
  const monthEnd = monthEndDate(month);
  if (range === "week") {
    return Array.from({ length: 5 }, (_, index) => {
      const end = new Date(monthEnd);
      end.setDate(monthEnd.getDate() - (4 - index) * 7);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return {
        label: index === 4 ? "本周" : `${weekNumber(end)}周`,
        start: toIsoDate(start),
        end: toIsoDate(end)
      };
    });
  }

  if (range === "month") {
    const year = Number(month.slice(0, 4));
    const selectedMonthNumber = Number(month.slice(5, 7));
    return Array.from({ length: selectedMonthNumber }, (_, index) => {
      const monthNumber = index + 1;
      const start = new Date(year, index, 1);
      const end = new Date(year, monthNumber, 0);
      return {
        label: monthNumber === selectedMonthNumber ? "本月" : `${monthNumber}月`,
        start: toIsoDate(start),
        end: toIsoDate(end)
      };
    });
  }

  const currentYear = Number(month.slice(0, 4));
  return [currentYear - 1, currentYear].map((year) => ({
    label: year === currentYear ? "今年" : "去年",
    start: `${year}-01-01`,
    end: `${year}-12-31`
  }));
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

function fromIsoDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weekNumber(date: Date): number {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const dayOffset = Math.floor((date.getTime() - firstDay.getTime()) / 86400000);
  return Math.ceil((dayOffset + firstDay.getDay() + 1) / 7);
}
