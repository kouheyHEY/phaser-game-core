import * as Phaser from "phaser";
/**
 * 汎用SoundManagerの使用例
 *
 * このサンプルでは、特定の音声ファイルに依存しない
 * 汎用的なサウンド管理システムの使用方法を示します。
 */
export declare class SoundManagerExample extends Phaser.Scene {
    private soundManager;
    private assetManager;
    constructor();
    preload(): void;
    private setupSounds;
    private loadAudioAssets;
    create(): void;
    private setupUI;
    private setupVolumeControls;
    private setupGameLogic;
    private setupSettingsPersistence;
}
/**
 * より高度な使用例：ゲーム状況に応じた動的音響管理
 */
export declare class AdvancedSoundExample {
    private soundManager;
    constructor(scene: Phaser.Scene);
    private setupAdvancedSounds;
    /**
     * ゲーム状況に応じたBGM自動切り替え
     */
    handleGameStateChange(newState: "menu" | "playing" | "paused" | "gameover"): void;
    /**
     * プレイヤーアクションに応じた音響効果
     */
    handlePlayerAction(action: string, data?: any): void;
    /**
     * 環境音の動的制御
     */
    updateAmbientSounds(environment: "forest" | "city" | "dungeon"): void;
}
export declare const soundManagerConfig: Phaser.Types.Core.GameConfig;
