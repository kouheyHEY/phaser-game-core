// Color definitions as const object
export const ColorDef = {
  // Primary colors
  RED: "#FF0000",
  GREEN: "#00FF00",
  BLUE: "#0000FF",
  YELLOW: "#FFFF00",
  CYAN: "#00FFFF",
  MAGENTA: "#FF00FF",
  BLACK: "#000000",
  WHITE: "#FFFFFF",

  // Reds
  LIGHT_RED: "#FF7F7F",
  DARK_RED: "#8B0000",
  MAROON: "#800000",

  // Greens
  LIGHT_GREEN: "#90EE90",
  DARK_GREEN: "#006400",
  LIME: "#00FF00",

  // Blues
  LIGHT_CYAN: "#E0FFFF",
  DARK_CYAN: "#008B8B",
  SKY_BLUE: "#87CEEB",
  DEEP_SKY_BLUE: "#00BFFF",
} as const;

// Type for color keys
export type ColorKey = keyof typeof ColorDef;

// Color utility functions
export class ColorUtils {
  /**
   * Convert hex color string to numeric value
   * @param hexColor - Hex color string (e.g., "#FF0000")
   * @returns Numeric color value
   */
  static hexToNumber(hexColor: string): number {
    // Remove # if present
    const hex = hexColor.replace("#", "");
    return parseInt(hex, 16);
  }

  /**
   * Get numeric value for a predefined color
   * @param colorKey - Color key from ColorDef
   * @returns Numeric color value
   */
  static getColorNumber(colorKey: ColorKey): number {
    return this.hexToNumber(ColorDef[colorKey]);
  }

  /**
   * Convert numeric color to hex string
   * @param colorNumber - Numeric color value
   * @returns Hex color string with # prefix
   */
  static numberToHex(colorNumber: number): string {
    return `#${colorNumber.toString(16).toUpperCase().padStart(6, "0")}`;
  }

  /**
   * Get all available color names
   * @returns Array of color names
   */
  static getColorNames(): ColorKey[] {
    return Object.keys(ColorDef) as ColorKey[];
  }

  /**
   * Check if a color name exists
   * @param colorName - Color name to check
   * @returns True if color exists
   */
  static hasColor(colorName: string): colorName is ColorKey {
    return colorName in ColorDef;
  }
}
