#!/bin/bash

# Android Build Environment Validation Script
# This script checks if all required tools are installed and properly configured

set -e

echo "========================================"
echo "Android Build Environment Check"
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $2 found"
        return 0
    else
        echo -e "${RED}✗${NC} $2 not found"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

# Function to check version
check_version() {
    echo -e "${YELLOW}→${NC} $1"
}

echo "1. Checking Node.js..."
if check_command "node" "Node.js"; then
    check_version "$(node --version)"
fi
echo ""

echo "2. Checking npm..."
if check_command "npm" "npm"; then
    check_version "$(npm --version)"
fi
echo ""

echo "3. Checking Java..."
if check_command "java" "Java JDK"; then
    check_version "$(java -version 2>&1 | head -n 1)"
    # Extract major version - works for Java 8 (1.8.x) and Java 9+ (9.x, 11.x, 17.x)
    JAVA_VERSION_STRING=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
    JAVA_MAJOR_VERSION=$(echo $JAVA_VERSION_STRING | cut -d'.' -f1)
    # For Java 8 and earlier (1.x.x format), get second part
    if [ "$JAVA_MAJOR_VERSION" = "1" ]; then
        JAVA_MAJOR_VERSION=$(echo $JAVA_VERSION_STRING | cut -d'.' -f2)
    fi
    if [ "$JAVA_MAJOR_VERSION" -ge 17 ] 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Java version is 17 or higher"
    else
        echo -e "${YELLOW}⚠${NC} Java version should be 17 or higher (current: $JAVA_VERSION_STRING)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi
echo ""

echo "4. Checking Android SDK..."
if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    SDK_PATH="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
    echo -e "${GREEN}✓${NC} Android SDK environment variable set"
    echo -e "${YELLOW}→${NC} SDK Location: $SDK_PATH"
    
    if [ -d "$SDK_PATH" ]; then
        echo -e "${GREEN}✓${NC} Android SDK directory exists"
        
        # Check for platforms
        if [ -d "$SDK_PATH/platforms" ]; then
            PLATFORMS=$(ls -1 "$SDK_PATH/platforms" 2>/dev/null | wc -l)
            echo -e "${GREEN}✓${NC} Found $PLATFORMS Android platform(s)"
            ls -1 "$SDK_PATH/platforms" 2>/dev/null | head -3 | while read line; do
                echo -e "  ${YELLOW}→${NC} $line"
            done
        else
            echo -e "${RED}✗${NC} No Android platforms found"
            ERRORS=$((ERRORS + 1))
        fi
        
        # Check for build-tools
        if [ -d "$SDK_PATH/build-tools" ]; then
            BUILD_TOOLS=$(ls -1 "$SDK_PATH/build-tools" 2>/dev/null | wc -l)
            echo -e "${GREEN}✓${NC} Found $BUILD_TOOLS build-tools version(s)"
            ls -1 "$SDK_PATH/build-tools" 2>/dev/null | head -3 | while read line; do
                echo -e "  ${YELLOW}→${NC} $line"
            done
        else
            echo -e "${RED}✗${NC} No build-tools found"
            ERRORS=$((ERRORS + 1))
        fi
    else
        echo -e "${RED}✗${NC} Android SDK directory does not exist"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}✗${NC} ANDROID_HOME or ANDROID_SDK_ROOT not set"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo "5. Checking Gradle..."
if [ -f "android/gradlew" ]; then
    echo -e "${GREEN}✓${NC} Gradle wrapper found"
    check_version "$(cd android && ./gradlew --version 2>/dev/null | grep Gradle | head -n 1)"
else
    if check_command "gradle" "Gradle"; then
        check_version "$(gradle --version 2>&1 | grep Gradle | head -n 1)"
    fi
fi
echo ""

echo "6. Checking project setup..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json found"
else
    echo -e "${RED}✗${NC} package.json not found"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "android" ]; then
    echo -e "${GREEN}✓${NC} Android platform folder exists"
else
    echo -e "${YELLOW}⚠${NC} Android platform not added yet"
    echo -e "${YELLOW}→${NC} Run: npx cap add android"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not installed"
    echo -e "${YELLOW}→${NC} Run: npm install"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -d "dist" ]; then
    echo -e "${GREEN}✓${NC} Web build folder exists"
else
    echo -e "${YELLOW}⚠${NC} Web build not found"
    echo -e "${YELLOW}→${NC} Run: npm run build"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Check ADB (optional)
echo "7. Checking ADB (optional)..."
if command -v adb &> /dev/null; then
    echo -e "${GREEN}✓${NC} Android Debug Bridge (ADB) found"
    check_version "$(adb --version 2>&1 | head -n 1)"
else
    echo -e "${YELLOW}⚠${NC} Android Debug Bridge (ADB) not found (optional for device testing)"
fi
echo ""

echo "========================================"
echo "Summary"
echo "========================================"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "You're ready to build Android APKs!"
    echo "Run: npm run android:build:debug"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo ""
    echo "You may need to complete some setup steps."
    echo "See warnings above for details."
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Please fix the errors before building APKs."
    echo "See the ANDROID_BUILD.md guide for setup instructions."
    exit 1
fi
