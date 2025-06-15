import * as Phaser from "phaser";
/**
 * アセット管理クラス
 * 画像、音声、スプライトシート、フォントなどのアセットの登録・管理を行う
 *
 * 使用例:
 * ```typescript
 * const assetManager = new AssetManager(this); // this = Phaser.Scene
 *
 * // アセットを登録
 * assetManager
 *   .registerImage('player', 'assets/player.png')
 *   .registerSpritesheet('explosion', 'assets/explosion.png', { frameWidth: 32, frameHeight: 32 })
 *   .registerAudio('bgm', ['assets/bgm.mp3', 'assets/bgm.ogg'])
 *   .registerJSON('gameData', 'assets/gameData.json');
 *
 * // アセットを読み込み
 * await assetManager.loadAssets(undefined, (progress) => {
 *   console.log(`Loading... ${Math.round(progress * 100)}%`);
 * });
 *
 * // アセットを使用
 * const playerTexture = assetManager.getImage('player');
 * const bgmSound = assetManager.getAudio('bgm');
 * const gameData = assetManager.getJSON('gameData');
 * ```
 */
export declare class AssetManager {
    private scene;
    private loadedAssets;
    private assetRegistry;
    private loadQueue;
    private isLoading;
    constructor(scene: Phaser.Scene);
    /**
     * 画像アセットを登録
     */
    registerImage(key: string, path: string, options?: ImageAssetOptions): AssetManager;
    /**
     * スプライトシートを登録
     */
    registerSpritesheet(key: string, path: string, frameConfig: Phaser.Types.Loader.FileTypes.ImageFrameConfig, options?: ImageAssetOptions): AssetManager;
    /**
     * テクスチャアトラスを登録
     */
    registerAtlas(key: string, textureURL: string, atlasURL: string, options?: ImageAssetOptions): AssetManager;
    /**
     * 音声アセットを登録
     */
    registerAudio(key: string, path: string | string[], options?: AudioAssetOptions): AssetManager;
    /**
     * JSONファイルを登録
     */
    registerJSON(key: string, path: string, options?: JsonAssetOptions): AssetManager;
    /**
     * XMLファイルを登録
     */
    registerXML(key: string, path: string, options?: XmlAssetOptions): AssetManager;
    /**
     * フォントを登録
     */
    registerFont(key: string, path: string, options?: FontAssetOptions): AssetManager;
    /**
     * 登録されたアセットを読み込み
     */
    loadAssets(keys?: string[], onProgress?: (progress: number) => void): Promise<void>;
    /**
     * アセットを読み込みキューに追加
     */
    private addToLoadQueue;
    /**
     * 読み込み完了時の処理
     */
    private onLoadComplete;
    /**
     * アセットが読み込み済みかチェック
     */
    isLoaded(key: string): boolean;
    /**
     * 登録されているアセットかチェック
     */
    isRegistered(key: string): boolean;
    /**
     * 画像アセットを取得
     */
    getImage(key: string): Phaser.Textures.Texture | null;
    /**
     * 音声アセットを取得
     */
    getAudio(key: string): Phaser.Sound.BaseSound | null;
    /**
     * JSONデータを取得
     */
    getJSON(key: string): any;
    /**
     * XMLデータを取得
     */
    getXML(key: string): any;
    /**
     * 読み込み済みアセット一覧を取得
     */
    getLoadedAssets(): string[];
    /**
     * 登録済みアセット一覧を取得
     */
    getRegisteredAssets(): string[];
    /**
     * アセットを削除
     */
    removeAsset(key: string): void;
    /**
     * 全アセットをクリア
     */
    clear(): void;
    /**
     * 読み込み進捗情報を取得
     */
    getLoadProgress(): LoadProgress;
    /**
     * 複数のアセットを一括登録
     */
    registerAssets(assets: AssetRegistration[]): AssetManager;
    /**
     * アセットプリローダー（ゲーム開始前の必須アセット読み込み）
     */
    preloadEssentialAssets(essentialKeys: string[], onProgress?: (progress: number) => void): Promise<void>;
    /**
     * レベル別アセット読み込み
     */
    loadLevelAssets(levelName: string, assetKeys: string[], onProgress?: (progress: number) => void): Promise<void>;
    /**
     * アセットの容量チェック（概算）
     */
    getEstimatedSize(): AssetSizeInfo;
}
/**
 * アセットタイプ列挙
 */
export declare enum AssetType {
    IMAGE = "image",
    SPRITESHEET = "spritesheet",
    ATLAS = "atlas",
    AUDIO = "audio",
    JSON = "json",
    XML = "xml",
    FONT = "font"
}
/**
 * アセット設定インターface
 */
export interface AssetConfig {
    key: string;
    type: AssetType;
    path: string | string[];
    frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
    atlasPath?: string;
    options?: any;
}
/**
 * 画像アセットオプション
 */
export interface ImageAssetOptions {
    normalMap?: string;
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}
/**
 * 音声アセットオプション
 */
export interface AudioAssetOptions {
    instances?: number;
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}
/**
 * JSONアセットオプション
 */
export interface JsonAssetOptions {
    dataKey?: string;
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}
/**
 * XMLアセットオプション
 */
export interface XmlAssetOptions {
    xhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}
/**
 * フォントアセットオプション
 */
export interface FontAssetOptions {
    fontDataURL?: string;
    textureXhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
    fontDataXhrSettings?: Phaser.Types.Loader.XHRSettingsObject;
}
/**
 * 読み込み進捗情報
 */
export interface LoadProgress {
    loaded: number;
    total: number;
    percentage: number;
}
/**
 * アセット登録情報
 */
export interface AssetRegistration {
    key: string;
    type: AssetType;
    path: string | string[];
    frameConfig?: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
    atlasPath?: string;
    options?: any;
}
/**
 * アセットサイズ情報
 */
export interface AssetSizeInfo {
    totalSizeKB: number;
    sizeByType: Record<AssetType, number>;
    assetCount: number;
}
