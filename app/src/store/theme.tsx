import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { EMBEDDED_FONTS } from '../lib/embeddedFonts';

const ThemeContext = createContext<any>(null);

/** Inject only the text faces; Ionicons comes from the full bundled font. */
function injectEmbeddedFaces() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const id = 'joy-embedded-faces';
  if (document.getElementById(id)) return;

  const faces = Object.entries(EMBEDDED_FONTS).map(
    ([family, b64]) =>
      `@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${b64}) format('truetype');font-weight:normal;font-style:normal;font-display:block;}`
  );

  const style = document.createElement('style');
  style.id = id;
  style.textContent = faces.join('\n');
  document.head.appendChild(style);
}

// Runs before the first React render on web.
injectEmbeddedFaces();

const TEXT_FONTS = {
  'Plus Jakarta Sans': PlusJakartaSans_400Regular,
  'Plus Jakarta Sans Medium': PlusJakartaSans_500Medium,
  'Plus Jakarta Sans SemiBold': PlusJakartaSans_600SemiBold,
  'Plus Jakarta Sans Bold': PlusJakartaSans_700Bold,
  'Plus Jakarta Sans ExtraBold': PlusJakartaSans_800ExtraBold,
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadWithRetry(fonts: Record<string, any>, attempts: number) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      await Font.loadAsync(fonts);
      return true;
    } catch {
      if (i < attempts - 1) await sleep(700 * (i + 1));
    }
  }
  return false;
}

/**
 * Native loads the same faces through expo-font with retries: the icon font
 * first (without it every glyph renders blank), then the text faces. If a face
 * lands after first paint we bump a counter so the tree re-renders with it.
 *
 * Web needs none of this — the faces are embedded above and paint instantly.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(Platform.OS === 'web');
  const [, setRevision] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let alive = true;
    const bump = () => {
      if (alive) setRevision((r) => r + 1);
    };

    (async () => {
      await loadWithRetry(Ionicons.font, 5);
      if (alive) setReady(true);
      bump();

      await loadWithRetry(TEXT_FONTS, 4);
      bump();
    })();

    // Absolute worst case: never hold the first paint beyond 8s on native.
    const timer = setTimeout(() => {
      if (alive) setReady(true);
    }, 8000);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);

  if (!ready) return null;

  return <ThemeContext.Provider value={true}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
