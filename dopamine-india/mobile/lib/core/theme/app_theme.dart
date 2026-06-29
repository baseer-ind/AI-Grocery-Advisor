import 'package:flutter/material.dart';

/// Design tokens per docs/07-design-system.md. App-shell palette only —
/// per-brand accents are applied within category screens, not here.
class AppTheme {
  static const Color primary = Color(0xFF5B4FE5); // Dopamine Violet
  static const Color secondary = Color(0xFFFF8A3D); // Ember Orange
  static const Color savingsGreen = Color(0xFF1FAA59);

  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          secondary: secondary,
          brightness: Brightness.light,
        ),
      );

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: primary,
          secondary: secondary,
          brightness: Brightness.dark,
        ),
      );
}
