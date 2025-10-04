package com.Vali98.ChatterUI
import expo.modules.splashscreen.SplashScreenManager

import android.os.Build
import android.os.Bundle
import android.util.Log
import android.view.WindowManager

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // Set the theme to AppTheme BEFORE onCreate to support
    // coloring the background, status bar, and navigation bar.
    // This is required for expo-splash-screen.
    // setTheme(R.style.AppTheme);
    // @generated begin expo-splashscreen - expo prebuild (DO NOT MODIFY) sync-f3ff59a738c56c9a6119210cb55f0b613eb8b6af
    SplashScreenManager.registerOnActivity(this)
    // @generated end expo-splashscreen
    super.onCreate(null)

    // 强制启用最高刷新率 (144Hz优化)
    enableHighRefreshRate()
  }

  private fun enableHighRefreshRate() {
    try {
      val display = windowManager.defaultDisplay
      val modes = display?.supportedModes ?: return

      // 查找最高刷新率模式
      val maxMode = modes.maxByOrNull { it.refreshRate }
      if (maxMode == null) {
        Log.w("MainActivity", "无法找到最高刷新率模式")
        return
      }

      Log.i("MainActivity", "设备支持的最高刷新率: ${maxMode.refreshRate} Hz (Mode ID: ${maxMode.modeId})")

      // 方法1: 设置首选显示模式 (Android 11+)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        val params = window.attributes
        params.preferredDisplayModeId = maxMode.modeId
        window.attributes = params
        Log.i("MainActivity", "已设置 preferredDisplayModeId = ${maxMode.modeId}")
      }
      // 方法2: 设置首选刷新率 (Android 6+)
      else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        val params = window.attributes
        params.preferredRefreshRate = maxMode.refreshRate
        window.attributes = params
        Log.i("MainActivity", "已设置 preferredRefreshRate = ${maxMode.refreshRate}")
      }

      // 方法3: 强制保持屏幕常亮和最高性能
      window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

      Log.i("MainActivity", "144Hz 优化已启用")

    } catch (e: Exception) {
      Log.e("MainActivity", "启用高刷新率失败: ${e.message}")
      e.printStackTrace()
    }
  }

  override fun onResume() {
    super.onResume()
    // 确保每次恢复时都强制最高刷新率
    enableHighRefreshRate()
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "main"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
          this,
          com.ldl.companionai.BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
          object : DefaultReactActivityDelegate(
              this,
              mainComponentName,
              fabricEnabled
          ){})
  }

  /**
    * Align the back button behavior with Android S
    * where moving root activities to background instead of finishing activities.
    * @see <a href="https://developer.android.com/reference/android/app/Activity#onBackPressed()">onBackPressed</a>
    */
  override fun invokeDefaultOnBackPressed() {
      if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
          if (!moveTaskToBack(false)) {
              // For non-root activities, use the default implementation to finish them.
              super.invokeDefaultOnBackPressed()
          }
          return
      }

      // Use the default back button implementation on Android S
      // because it's doing more than [Activity.moveTaskToBack] in fact.
      super.invokeDefaultOnBackPressed()
  }
}
