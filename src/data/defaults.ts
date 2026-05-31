import { Account, Category } from "../types";

export const defaultCategories: Category[] = [
  { id: "cat-food", name: "餐饮", type: "expense", icon: "restaurant", sortOrder: 1 },
  { id: "cat-transport", name: "交通", type: "expense", icon: "bus", sortOrder: 2 },
  { id: "cat-shopping", name: "购物", type: "expense", icon: "bag", sortOrder: 3 },
  { id: "cat-home", name: "居家", type: "expense", icon: "home", sortOrder: 4 },
  { id: "cat-health", name: "医疗", type: "expense", icon: "medkit", sortOrder: 5 },
  { id: "cat-fun", name: "娱乐", type: "expense", icon: "game-controller", sortOrder: 6 },
  { id: "cat-other-expense", name: "其他支出", type: "expense", icon: "ellipsis-horizontal", sortOrder: 99 },
  { id: "cat-salary", name: "工资", type: "income", icon: "cash", sortOrder: 1 },
  { id: "cat-refund", name: "退款", type: "income", icon: "return-up-back", sortOrder: 2 },
  { id: "cat-other-income", name: "其他收入", type: "income", icon: "add-circle", sortOrder: 99 }
];

export const defaultAccounts: Account[] = [
  { id: "acc-cash", name: "现金", icon: "wallet", sortOrder: 1 },
  { id: "acc-wechat", name: "微信支付", icon: "chatbubble-ellipses", sortOrder: 2 },
  { id: "acc-alipay", name: "支付宝", icon: "phone-portrait", sortOrder: 3 },
  { id: "acc-card", name: "银行卡", icon: "card", sortOrder: 4 }
];
