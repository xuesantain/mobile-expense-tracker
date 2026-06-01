# Android APK 打包说明

本项目使用 Expo managed workflow。推荐优先使用 GitHub Actions 云端构建 APK；如果你已经配置 Expo/EAS，也可以使用 EAS 云构建。

## 方式一：GitHub Actions 生成 APK

仓库内置了 `.github/workflows/android-apk.yml`。推送到 `main` 或在 GitHub Actions 页面手动运行后，会执行：

```bash
npm ci
npm run typecheck
npm test -- --runInBand
CI=1 npx expo prebuild --platform android --no-install
cd android
./gradlew assembleRelease
```

构建成功后可以在 Actions 的 Artifacts 中下载 `mobile-expense-tracker-apk`，其中包含可直接安装的 release APK。

不要下载 debug APK。debug APK 不内置 JS bundle，手机脱离 Metro 后会出现 `Unable to load script` 错误。

这个流程不需要配置 `EXPO_TOKEN`，适合当前项目先快速产出测试版 APK。

如果 Actions 失败，会额外上传 `android-build-logs` artifact。里面包含：

- `prebuild.log`：Expo 生成 Android 工程日志
- `gradle-build.log`：Gradle 构建 APK 日志

排查时优先打开失败 job 的红色步骤日志；如果页面日志太长，就下载 `android-build-logs` 查看最后 100 行。

`--non-interactive` 在当前 Expo CLI 中不适用于 `prebuild`，因此通过 `CI=1` 进入非交互模式。

## 方式二：EAS 云构建

### 1. 登录 Expo

```bash
npx eas-cli login
```

如果本机已经全局安装 EAS CLI，也可以使用：

```bash
eas login
```

### 2. 构建 APK

```bash
npm run build:android:apk
```

等构建完成后，EAS 会返回 APK 下载链接。下载该 APK 后即可发送到 Android 手机安装。

## 3. 构建配置

APK 构建配置位于 `eas.json`：

```json
{
  "build": {
    "apk": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

Android 应用包名和版本号位于 `app.json`：

- 应用名：手机记账
- 包名：`com.xuesantain.mobileexpensetracker`
- versionCode：`1`

## 4. 本地环境说明

如果本机没有 Android SDK、Gradle 和原生 `android/` 工程，不能直接在本地生成 APK。此时应使用 EAS 云构建。

如需在本机先生成 Android 工程，可运行：

```bash
npm run prebuild:android
```

然后在配置好 Android SDK 和 JDK 17 后运行：

```bash
cd android
./gradlew assembleRelease
```
