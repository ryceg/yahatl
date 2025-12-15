# Set JAVA_HOME for Android builds
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# Set ANDROID_HOME
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

# Verify Java is available
Write-Host "Java version:" -ForegroundColor Green
java -version

Write-Host "`nAndroid SDK location: $env:ANDROID_HOME" -ForegroundColor Green

# Run the Android build
Write-Host "`nBuilding Android app..." -ForegroundColor Green
npx expo run:android

