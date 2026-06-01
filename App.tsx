import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import {
  addTransaction,
  deleteCategory,
  deleteTransaction,
  ExpenseDatabase,
  exportTransactionsCsv,
  getDashboardSummary,
  getAppSettings,
  linkReceiptScan,
  listAccounts,
  listBudgets,
  listCategories,
  listTransactions,
  openExpenseDatabase,
  saveAccount,
  saveAppSettings,
  saveCategory,
  saveReceiptScan,
  updateTransaction,
  upsertBudget
} from "./src/data/database";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { EntryScreen } from "./src/screens/EntryScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { imageToText } from "./src/services/ocrText";
import { structureReceiptImageWithQwen, testQwenApiKey } from "./src/services/qwenReceipt";
import { colors, styles } from "./src/styles";
import {
  Account,
  Budget,
  Category,
  DashboardSummary,
  DraftTransaction,
  ManageableAccount,
  ManageableCategory,
  ReceiptImportCandidate,
  ReceiptImageProvider,
  Transaction,
  TransactionFilters,
  TransactionType
} from "./src/types";
import { currentMonth, formatMonthLabel, monthRange, shiftMonth, todayIso } from "./src/utils/date";
import { formatMoney, parseAmount } from "./src/utils/money";
import { parseReceiptText } from "./src/utils/ocr";
import { candidatesFromReceiptText, StructuredReceiptItem } from "./src/utils/receiptImport";
import { categorySpend } from "./src/utils/stats";

type TabKey = "records" | "stats" | "entry" | "discover" | "profile";

const tabs: Array<{ key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: "records", label: "明细", icon: "list" },
  { key: "stats", label: "图表", icon: "trending-up" },
  { key: "entry", label: "记账", icon: "add" },
  { key: "discover", label: "发现", icon: "planet" },
  { key: "profile", label: "我的", icon: "person-circle" }
];

const emptySummary: DashboardSummary = {
  monthExpense: 0,
  monthIncome: 0,
  monthBudget: 0,
  remainingBudget: null
};

const emptyFilters: TransactionFilters = {
  query: "",
  type: "all",
  categoryId: "",
  accountId: "",
  startDate: "",
  endDate: ""
};

const initialDraft: DraftTransaction = {
  amount: "",
  type: "expense",
  categoryId: "cat-food",
  accountId: "acc-wechat",
  date: todayIso(),
  note: "",
  merchant: "",
  source: "manual"
};

export default function App() {
  const [db, setDb] = useState<ExpenseDatabase | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("records");
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [previousSummary, setPreviousSummary] = useState<DashboardSummary>(emptySummary);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [filters, setFilters] = useState<TransactionFilters>(emptyFilters);
  const [ocrText, setOcrText] = useState("");
  const [ocrImageUri, setOcrImageUri] = useState<string | null>(null);
  const [ocrImageUris, setOcrImageUris] = useState<string[]>([]);
  const [qwenApiKey, setQwenApiKey] = useState("");
  const [receiptImageProvider, setReceiptImageProvider] = useState<ReceiptImageProvider>("qwen");
  const [receiptCandidates, setReceiptCandidates] = useState<ReceiptImportCandidate[]>([]);
  const [extractingText, setExtractingText] = useState(false);
  const [pendingScanId, setPendingScanId] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState("");
  const [draft, setDraft] = useState<DraftTransaction>(initialDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState<ManageableCategory>({ name: "", type: "expense", icon: "pricetag" });
  const [accountDraft, setAccountDraft] = useState<ManageableAccount>({ name: "", icon: "wallet" });

  const month = selectedMonth;
  const thisMonth = currentMonth();
  const expenseCategories = useMemo(() => categories.filter((item) => item.type === "expense"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((item) => item.type === "income"), [categories]);
  const spendByCategory = useMemo(() => categorySpend(transactions, categories, month), [transactions, categories, month]);

  useEffect(() => {
    openExpenseDatabase()
      .then(async (database) => {
        setDb(database);
        const settings = await getAppSettings(database);
        setQwenApiKey(settings.qwenApiKey);
        setReceiptImageProvider(settings.receiptImageProvider);
        await refresh(database, emptyFilters, selectedMonth);
      })
      .catch((error) => Alert.alert("数据库初始化失败", String(error)))
      .finally(() => setLoading(false));
  }, []);

  async function refresh(database = db, nextFilters = filters, nextMonth = month) {
    if (!database) {
      return;
    }
    const range = monthRange(nextMonth);
    const transactionFilters = {
      ...nextFilters,
      startDate: nextFilters.startDate || range.start,
      endDate: nextFilters.endDate || range.end
    };
    const previousMonth = shiftMonth(nextMonth, -1);

    const [nextCategories, nextAccounts, nextBudgets, nextTransactions, nextSummary, nextPreviousSummary] = await Promise.all([
      listCategories(database),
      listAccounts(database),
      listBudgets(database, nextMonth),
      listTransactions(database, transactionFilters),
      getDashboardSummary(database, nextMonth),
      getDashboardSummary(database, previousMonth)
    ]);

    setCategories(nextCategories);
    setAccounts(nextAccounts);
    setBudgets(nextBudgets);
    setTransactions(nextTransactions);
    setSummary(nextSummary);
    setPreviousSummary(nextPreviousSummary);
    setBudgetAmount(String(nextBudgets.find((item) => item.categoryId === null)?.amount ?? ""));
    normalizeDraftOptions(nextCategories, nextAccounts);
  }

  async function changeMonth(offset: number) {
    const nextMonth = shiftMonth(month, offset);
    const nextFilters = { ...filters, startDate: "", endDate: "" };
    setSelectedMonth(nextMonth);
    setFilters(nextFilters);
    await refresh(db, nextFilters, nextMonth);
  }

  async function selectMonth(nextMonth: string) {
    const nextFilters = { ...filters, startDate: "", endDate: "" };
    setSelectedMonth(nextMonth);
    setFilters(nextFilters);
    await refresh(db, nextFilters, nextMonth);
  }

  function normalizeDraftOptions(nextCategories = categories, nextAccounts = accounts) {
    setDraft((current) => {
      const categoriesByType = nextCategories.filter((item) => item.type === current.type);
      return {
        ...current,
        categoryId: categoriesByType.some((item) => item.id === current.categoryId) ? current.categoryId : categoriesByType[0]?.id ?? current.categoryId,
        accountId: nextAccounts.some((item) => item.id === current.accountId) ? current.accountId : nextAccounts[0]?.id ?? current.accountId
      };
    });
  }

  async function submitTransaction() {
    if (!db) {
      return;
    }

    const amount = parseAmount(draft.amount);
    if (amount <= 0) {
      Alert.alert("金额无效", "请输入大于 0 的金额。");
      return;
    }

    const input = {
      amount,
      type: draft.type,
      categoryId: draft.categoryId,
      accountId: draft.accountId,
      date: draft.date || todayIso(),
      note: draft.note.trim(),
      merchant: draft.merchant.trim(),
      source: draft.source
    };

    if (editingId) {
      await updateTransaction(db, editingId, input);
      setEditingId(null);
    } else {
      const transaction = await addTransaction(db, input);
      if (pendingScanId) {
        await linkReceiptScan(db, pendingScanId, transaction.id);
        setPendingScanId(null);
      }
    }

    resetDraft(draft.accountId);
    setOcrText("");
    setOcrImageUri(null);
    await refresh(db, filters, month);
    setActiveTab("records");
  }

  function resetDraft(accountId = draft.accountId) {
    setDraft({ ...initialDraft, accountId, date: todayIso() });
  }

  function editTransaction(transaction: Transaction) {
    setEditingId(transaction.id);
    setDraft({
      amount: String(transaction.amount),
      type: transaction.type,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      date: transaction.date,
      note: transaction.note,
      merchant: transaction.merchant,
      source: transaction.source
    });
    setActiveTab("entry");
  }

  function copyTransaction(transaction: Transaction) {
    setEditingId(null);
    setDraft({
      amount: String(transaction.amount),
      type: transaction.type,
      categoryId: transaction.categoryId,
      accountId: transaction.accountId,
      date: todayIso(),
      note: transaction.note,
      merchant: transaction.merchant,
      source: "manual"
    });
    setActiveTab("entry");
  }

  async function removeTransaction(id: string) {
    if (!db) {
      return;
    }
    const transaction = transactions.find((item) => item.id === id);
    const title = transaction?.merchant || transaction?.note || "这条账单";
    Alert.alert("确认删除账单", `删除后无法恢复：${title}`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          await deleteTransaction(db, id);
          await refresh(db, filters, month);
        }
      }
    ]);
  }

  async function saveBudget() {
    if (!db) {
      return;
    }

    const amount = parseAmount(budgetAmount);
    await upsertBudget(db, { month, categoryId: null, amount });
    await refresh(db, filters, month);
    Alert.alert("预算已保存", `${formatMonthLabel(month)} 预算：${formatMoney(amount)}`);
  }

  async function saveCategoryDraft() {
    if (!db || !categoryDraft.name.trim()) {
      Alert.alert("分类名称必填", "请输入分类名称。");
      return;
    }
    await saveCategory(db, categoryDraft);
    setCategoryDraft({ name: "", type: categoryDraft.type, icon: "pricetag" });
    await refresh(db, filters, month);
  }

  async function removeCategory(category: Category) {
    if (!db) {
      return;
    }
    if (category.id.startsWith("cat-other")) {
      Alert.alert("不能删除默认分类", "默认兜底分类需要保留。");
      return;
    }
    Alert.alert("确认删除分类", `长按删除会移除「${category.name}」。已有账单使用时会自动阻止删除。`, [
      { text: "取消", style: "cancel" },
      {
        text: "删除",
        style: "destructive",
        onPress: async () => {
          const deleted = await deleteCategory(db, category.id);
          if (!deleted) {
            Alert.alert("分类正在使用", "已有账单使用该分类，不能直接删除。");
            return;
          }
          await refresh(db, filters, month);
        }
      }
    ]);
  }

  async function saveAccountDraft() {
    if (!db || !accountDraft.name.trim()) {
      Alert.alert("账户名称必填", "请输入账户名称。");
      return;
    }
    await saveAccount(db, accountDraft);
    setAccountDraft({ name: "", icon: "wallet" });
    await refresh(db, filters, month);
  }

  async function exportCsv() {
    if (!db) {
      return;
    }

    try {
      const csv = await exportTransactionsCsv(db);
      if (csv.split("\n").length <= 1) {
        Alert.alert("暂无账单", "先记录账单后再导出。");
        return;
      }
      const uri = `${FileSystem.documentDirectory}transactions-${todayIso()}.csv`;
      await FileSystem.writeAsStringAsync(uri, csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: "text/csv", dialogTitle: "导出 CSV" });
      } else {
        Alert.alert("CSV 已生成", uri);
      }
    } catch (error) {
      Alert.alert("导出失败", String(error));
    }
  }

  async function pickReceiptImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("需要相册权限", "请允许访问相册以选择票据截图。");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsMultipleSelection: true
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setOcrImageUris(uris);
      setOcrImageUri(uris[0] ?? null);
    }
  }

  async function extractTextFromImage() {
    const uris = ocrImageUris.length ? ocrImageUris : ocrImageUri ? [ocrImageUri] : [];
    if (!uris.length) {
      Alert.alert("未选择图片", "请先选择票据或账单截图。");
      return;
    }
    if (receiptImageProvider === "qwen" && qwenApiKey.trim()) {
      await parseOcrCandidate();
      return;
    }
    setExtractingText(true);
    try {
      const results = await Promise.all(uris.map((uri) => imageToText(uri)));
      const text = results.map((result) => result.text.trim()).filter(Boolean).join("\n\n---\n\n");
      if (text.trim()) {
        setOcrText(text);
      } else {
        Alert.alert("暂未接入图片识别", "图片转文字接口已封装，当前默认实现为空。请先粘贴 OCR 文本，后续可替换为原生或远程识别。");
      }
    } finally {
      setExtractingText(false);
    }
  }

  async function parseOcrCandidate() {
    if (!db) {
      return;
    }
    const imageUris = ocrImageUris.length ? ocrImageUris : ocrImageUri ? [ocrImageUri] : [];
    const canUseQwenImage = receiptImageProvider === "qwen" && qwenApiKey.trim() && imageUris.length;
    if (!canUseQwenImage && !ocrText.trim()) {
      Alert.alert("缺少 OCR 文本", "请先粘贴或提取票据文字。");
      return;
    }

    let structuredItems: StructuredReceiptItem[] = [];
    if (canUseQwenImage) {
      setExtractingText(true);
      try {
        const batches = await Promise.all(
          imageUris.map((uri) =>
            structureReceiptImageWithQwen({
              apiKey: qwenApiKey,
              imageUri: uri,
              categories,
              accounts
            })
          )
        );
        structuredItems = batches.flat();
      } catch (error) {
        Alert.alert("Qwen 图片识别失败", `没有写入任何账单。你可以检查 Key、网络和图片清晰度，或粘贴 OCR 文本后再解析。\n\n${String(error)}`);
      } finally {
        setExtractingText(false);
      }
    }
    const candidates = candidatesFromReceiptText({
      rawText: ocrText,
      imageUri: ocrImageUri,
      categories,
      accounts,
      existingTransactions: transactions,
      structuredItems
    });

    setReceiptCandidates(candidates);
    const firstSelected = candidates.find((item) => item.selected && item.amount && item.date && !item.duplicateOfTransactionId);
    if (!firstSelected) {
      const duplicateCount = candidates.filter((item) => item.duplicateOfTransactionId).length;
      const incompleteCount = candidates.filter((item) => !item.amount || !item.date).length;
      Alert.alert("未找到可直接导入账单", `没有识别到完整的金额和日期，或候选项都疑似重复。\n疑似重复：${duplicateCount} 条\n信息不完整：${incompleteCount} 条`);
    }
  }

  function toggleReceiptCandidate(id: string) {
    setReceiptCandidates((current) => current.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)));
  }

  async function importReceiptCandidates() {
    if (!db) {
      return;
    }
    const selected = receiptCandidates.filter((item) => item.selected && item.amount && item.date && !item.duplicateOfTransactionId);
    if (!selected.length) {
      Alert.alert("没有可导入账单", "请选择至少一条非重复且信息完整的候选账单。");
      return;
    }

    for (const item of selected) {
      const scan = await saveReceiptScan(db, {
        imageUri: item.imageUri,
        rawText: item.rawText,
        parsedAmount: item.amount,
        parsedDate: item.date,
        parsedMerchant: item.merchant,
        parsedCategoryId: item.categoryId,
        transactionId: null
      });
      const transaction = await addTransaction(db, {
        amount: item.amount!,
        type: item.type,
        categoryId: item.categoryId ?? "cat-other-expense",
        accountId: item.accountId ?? draft.accountId,
        date: item.date!,
        note: item.note,
        merchant: item.merchant ?? "",
        source: "ocr"
      });
      await linkReceiptScan(db, scan.id, transaction.id);
    }

    setReceiptCandidates([]);
    setOcrText("");
    setOcrImageUri(null);
    setOcrImageUris([]);
    await refresh(db, filters, month);
    setActiveTab("records");
  }

  function updateDraftType(type: TransactionType) {
    const nextCategory = (type === "expense" ? expenseCategories : incomeCategories)[0]?.id ?? draft.categoryId;
    setDraft((current) => ({ ...current, type, categoryId: nextCategory }));
  }

  async function updateFilters(nextFilters: TransactionFilters) {
    setFilters(nextFilters);
    await refresh(db, nextFilters, month);
  }

  async function verifyQwenKey(value: string) {
    try {
      await testQwenApiKey(value);
      Alert.alert("Qwen Key 可用", "已经成功连通 Qwen3-VL-Flash。");
    } catch (error) {
      Alert.alert("Qwen Key 不可用", String(error));
    }
  }

  async function updateQwenApiKey(value: string) {
    const nextKey = value.trim();
    setQwenApiKey(nextKey);
    if (db) {
      await saveAppSettings(db, { qwenApiKey: nextKey, receiptImageProvider });
    }
  }

  async function updateReceiptImageProvider(value: ReceiptImageProvider) {
    setReceiptImageProvider(value);
    if (db) {
      await saveAppSettings(db, { qwenApiKey, receiptImageProvider: value });
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.mutedText}>正在准备本地账本...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" backgroundColor={activeTab === "records" || activeTab === "stats" ? colors.primary : colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentBody} keyboardShouldPersistTaps="handled">
          {activeTab === "records" ? (
            <HomeScreen
              month={month}
              summary={summary}
              previousSummary={previousSummary}
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              onPreviousMonth={() => changeMonth(-1)}
              onNextMonth={() => changeMonth(1)}
              onSelectMonth={selectMonth}
              onAdd={() => setActiveTab("entry")}
              onEdit={editTransaction}
              onCopy={copyTransaction}
              onDelete={removeTransaction}
            />
          ) : null}
          {activeTab === "entry" ? (
            <EntryScreen
              draft={draft}
              editing={Boolean(editingId)}
              categories={categories}
              onDraftChange={setDraft}
              onTypeChange={updateDraftType}
              onSubmit={submitTransaction}
              onCancelEdit={() => {
                setEditingId(null);
                resetDraft();
              }}
              categoryDraft={categoryDraft}
              onCategoryDraftChange={setCategoryDraft}
              onSaveCategory={saveCategoryDraft}
              onDeleteCategory={removeCategory}
            />
          ) : null}
          {activeTab === "stats" ? <StatsScreen categories={categories} month={month} transactions={transactions} /> : null}
          {activeTab === "discover" ? (
            <DiscoverScreen
              month={month}
              budgetAmount={budgetAmount}
              budgets={budgets}
              summary={summary}
              ocrText={ocrText}
              ocrImageUri={ocrImageUri}
              extractingText={extractingText}
              candidates={receiptCandidates}
              onBudgetAmountChange={setBudgetAmount}
              onSaveBudget={saveBudget}
              onOcrTextChange={setOcrText}
              onPickImage={pickReceiptImage}
              onExtractText={extractTextFromImage}
              onParseOcr={parseOcrCandidate}
              onToggleCandidate={toggleReceiptCandidate}
              onImportCandidates={importReceiptCandidates}
            />
          ) : null}
          {activeTab === "profile" ? (
            <ProfileScreen
              categories={categories}
              accounts={accounts}
              transactions={transactions}
              qwenApiKey={qwenApiKey}
              receiptImageProvider={receiptImageProvider}
              onQwenApiKeyChange={updateQwenApiKey}
              onReceiptImageProviderChange={updateReceiptImageProvider}
              onTestQwenKey={verifyQwenKey}
              onExportData={exportCsv}
            />
          ) : null}
        </ScrollView>

        {activeTab === "records" && month !== thisMonth ? (
          <Text style={styles.floatingCurrentMonthButton} onPress={() => selectMonth(thisMonth)}>
            回到本月
          </Text>
        ) : null}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <Pressable key={tab.key} style={[styles.tabItem, tab.key === "entry" && styles.centerTabItem]} onPress={() => setActiveTab(tab.key)}>
              {tab.key === "entry" ? (
                <View style={styles.centerTabButton}>
                  <Ionicons name={tab.icon} size={34} color={colors.text} />
                </View>
              ) : (
                <Ionicons name={tab.icon} size={24} color={activeTab === tab.key ? colors.text : colors.muted} />
              )}
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
