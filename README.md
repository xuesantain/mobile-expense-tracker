# Daily Ledger

A local-first mobile expense tracker MVP built with Expo, React Native, TypeScript, and SQLite.

## Implemented

- Local SQLite schema, migration, and default seed data.
- Default expense and income categories.
- Default accounts for cash, WeChat Pay, Alipay, and bank card.
- Manual transaction entry with amount, type, category, account, date, merchant, and note.
- Home dashboard with monthly expense, income, budget, and recent records.
- Records screen with search, delete, and CSV export.
- Statistics screen with category spend and account flow.
- Monthly total budget screen.
- Receipt screenshot intake plus OCR text parsing and user confirmation before saving.

## Run

```bash
npm install
npm run start
```

Use Expo Go, an Android emulator, or an iOS simulator to open the project.

## Verify

```bash
npm run typecheck
npm test
```

## OCR

The MVP implements the confirmation flow now: choose an image, paste OCR text, parse candidate amount/date/merchant/category, then confirm the entry before saving it.

Native image-to-text can be added later by replacing only the image-to-text adapter. Keep the confirmation step so bad OCR does not write directly to the ledger.
