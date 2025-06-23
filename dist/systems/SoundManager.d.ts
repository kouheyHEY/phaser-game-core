import * as Phaser from "phaser";
import { AssetManager } from "./AssetsManager";
/**
 * 汎用サウンドマネージャークラス
 * どのようなゲームでも使用できる音響管理システム
 *
 * 使用例:
 * ```typescript
 * const soundManager = new SoundManager(this); // this = Phaser.Scene
 *
 * // 音声カテゴリを定義
 * soundManager.defineSoundCategory('ui', { volume: 0.8 });
 * soundManager.defineSoundCategory('bgm', { volume: 0.6, loop: true });
 * soundManager.defineSoundCategory('sfx', { volume: 1.0 });
 *
 * // 音声を登録
 * soundManager.registerSound('click', 'ui', 'assets/click.mp3');
 * soundManager.registerSound('bgm_stage1', 'bgm', 'assets/bgm1.mp3');
 *
 * // 音声を再生
 * soundManager.playSound('click');
 * soundManager.playBGM('bgm_stage1');
 * ```
 */
export declare class SoundManager {
    private scene;
    private assetManager?;
    private sounds;
    private categories;
    private currentBGM;
    private bgmSound;
    private globalVolume;
    private isMuted;
    private fadeTweens;
    constructor(scene: Phaser.Scene, assetManager?: AssetManager);
    /**
     * デフォルトカテゴリの設定
     */
    private setupDefaultCategories;
    /**
     * イベントリスナーの設定
     */
    private setupEventListeners;
    /**
     * サウンドカテゴリを定義
     */
    defineCategory(name: string, config: SoundCategoryConfig): SoundManager;
    /**
     * 音声を登録
     */
    registerSound(key: string, category: string, path: string | string[], config?: SoundConfig): SoundManager;
    /**
     * 複数の音声を一括登録
     */
    registerSounds(sounds: SoundRegistration[]): SoundManager;
    /**
     * 音声をカテゴリごとに一括登録
     */
    registerSoundsByCategory(category: string, sounds: {
        [key: string]: string | string[];
    }): SoundManager;
    /**
     * 音声を再生
     */
    playSound(key: string, config?: Phaser.Types.Sound.SoundConfig): Phaser.Sound.BaseSound | null;
    /**
     * BGMを再生
     */
    playBGM(key: string, config?: Phaser.Types.Sound.SoundConfig): void;
    /**
     * BGMを停止
     */
    stopBGM(): void;
    /**
     * 音声をフェードアウト
     */
    fadeOutSound(sound: Phaser.Sound.BaseSound, duration: number, onComplete?: () => void): void;
    /**
     * カテゴリ内の音声を停止
     */
    stopCategory(categoryName: string): void;
    /**
     * 全ての音声を停止
     */
    stopAll(): void;
    /**
     * カテゴリの音量を設定
     */
    setCategoryVolume(categoryName: string, volume: number): void;
    /**
     * グローバル音量を設定
     */
    setGlobalVolume(volume: number): void;
    /**
     * ミュート設定
     */
    setMuted(muted: boolean): void;
    /**
     * ミュート切り替え
     */
    toggleMute(): void;
    /**
     * カテゴリから音声を削除
     */
    private removeFromCategory;
    /**
     * 音声が属するカテゴリを取得
     */
    private getCategoryBySound;
    /**
     * フェードトゥイーンをクリア
     */
    private clearFadeTweens;
    /**
     * 現在のBGMキーを取得
     */
    getCurrentBGM(): string | null;
    /**
     * BGMが再生中かチェック
     */
    isBGMPlaying(): boolean;
    /**
     * ミュート状態を取得
     */
    isMutedState(): boolean;
    /**
     * カテゴリ情報を取得
     */
    getCategory(name: string): SoundCategory | null;
    /**
     * 全カテゴリを取得
     */
    getAllCategories(): SoundCategory[];
    /**
     * 登録済み音声一覧を取得
     */
    getRegisteredSounds(): string[];
    /**
     * カテゴリ別音声一覧を取得
     */
    getSoundsByCategory(categoryName: string): string[];
    /**
     * 音声設定を保存
     */
    saveSettings(): SoundManagerSettings;
    /**
     * 音声設定を読み込み
     */
    loadSettings(settings: SoundManagerSettings): void;
    /**
     * デバッグ情報を取得
     */
    getDebugInfo(): SoundManagerDebugInfo;
    /**
     * リソースを解放
     */
    dispose(): void;
}
/**
 * 音声カテゴリー
 */
interface SoundCategory {
    name: string;
    volume: number;
    loop: boolean;
    maxConcurrent: number;
    interrupts: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
    playingSounds: Phaser.Sound.BaseSound[];
}
/**
 * 音声カテゴリー設定
 */
export interface SoundCategoryConfig {
    volume?: number;
    loop?: boolean;
    maxConcurrent?: number;
    interrupts?: boolean;
    fadeInDuration?: number;
    fadeOutDuration?: number;
}
/**
 * 音声設定
 */
export interface SoundConfig {
    volume?: number;
    rate?: number;
    detune?: number;
    seek?: number;
    loop?: boolean;
    delay?: number;
}
/**
 * 音声登録情報
 */
export interface SoundRegistration {
    key: string;
    category: string;
    path: string | string[];
    config?: SoundConfig;
}
/**
 * サウンドマネージャー設定
 */
export interface SoundManagerSettings {
    globalVolume: number;
    isMuted: boolean;
    categoryVolumes: {
        [key: string]: number;
    };
}
/**
 * デバッグ情報
 */
export interface SoundManagerDebugInfo {
    globalVolume: number;
    isMuted: boolean;
    currentBGM: string | null;
    isBGMPlaying: boolean;
    totalRegisteredSounds: number;
    categories: {
        [key: string]: any;
    };
}
/**
 * サウンドマネージャーのファクトリー関数
 */
export declare function createSoundManager(scene: Phaser.Scene, assetManager?: AssetManager): SoundManager;
export {};
