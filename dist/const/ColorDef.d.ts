export declare const ColorDef: {
    readonly RED: "#FF0000";
    readonly GREEN: "#00FF00";
    readonly BLUE: "#0000FF";
    readonly YELLOW: "#FFFF00";
    readonly CYAN: "#00FFFF";
    readonly MAGENTA: "#FF00FF";
    readonly BLACK: "#000000";
    readonly WHITE: "#FFFFFF";
    readonly LIGHT_RED: "#FF7F7F";
    readonly DARK_RED: "#8B0000";
    readonly MAROON: "#800000";
    readonly LIGHT_GREEN: "#90EE90";
    readonly DARK_GREEN: "#006400";
    readonly LIME: "#00FF00";
    readonly LIGHT_CYAN: "#E0FFFF";
    readonly DARK_CYAN: "#008B8B";
    readonly SKY_BLUE: "#87CEEB";
    readonly DEEP_SKY_BLUE: "#00BFFF";
};
export type ColorKey = keyof typeof ColorDef;
export declare class ColorUtils {
    /**
     * Convert hex color string to numeric value
     * @param hexColor - Hex color string (e.g., "#FF0000")
     * @returns Numeric color value
     */
    static hexToNumber(hexColor: string): number;
    /**
     * Get numeric value for a predefined color
     * @param colorKey - Color key from ColorDef
     * @returns Numeric color value
     */
    static getColorNumber(colorKey: ColorKey): number;
    /**
     * Convert numeric color to hex string
     * @param colorNumber - Numeric color value
     * @returns Hex color string with # prefix
     */
    static numberToHex(colorNumber: number): string;
    /**
     * Get all available color names
     * @returns Array of color names
     */
    static getColorNames(): ColorKey[];
    /**
     * Check if a color name exists
     * @param colorName - Color name to check
     * @returns True if color exists
     */
    static hasColor(colorName: string): colorName is ColorKey;
}
