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
export class SoundManager {
  private scene: Phaser.Scene;
  private assetManager?: AssetManager;
  private sounds: Map<string, SoundEntry> = new Map();
  private categories: Map<string, SoundCategory> = new Map();
  private currentBGM: string | null = null;
  private bgmSound: Phaser.Sound.BaseSound | null = null;
  private globalVolume: number = 1.0;
  private isMuted: boolean = false;
  private fadeTweens: Map<string, Phaser.Tweens.Tween> = new Map();

  constructor(scene: Phaser.Scene, assetManager?: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.setupDefaultCategories();
    this.setupEventListeners();
  }

  /**
   * デフォルトカテゴリの設定
   */
  private setupDefaultCategories(): void {
    this.defineCategory("ui", {
      volume: 0.8,
      maxConcurrent: 5,
      interrupts: false,
    });

    this.defineCategory("sfx", {
      volume: 1.0,
      maxConcurrent: 10,
      interrupts: false,
    });

    this.defineCategory("bgm", {
      volume: 0.7,
      loop: true,
      maxConcurrent: 1,
      interrupts: true,
      fadeInDuration: 1000,
      fadeOutDuration: 1000,
    });

    this.defineCategory("voice", {
      volume: 0.9,
      maxConcurrent: 1,
      interrupts: true,
    });

    this.defineCategory("ambient", {
      volume: 0.5,
      loop: true,
      maxConcurrent: 3,
      interrupts: false,
    });
  }

  /**
   * イベントリスナーの設定
   */
  private setupEventListeners(): void {
    this.scene.events.on("shutdown", () => {
      this.stopAll();
    });

    this.scene.events.on("destroy", () => {
      this.dispose();
    });
  }

  /**
   * サウンドカテゴリを定義
   */
  defineCategory(name: string, config: SoundCategoryConfig): SoundManager {
    this.categories.set(name, {
      name,
      volume: config.volume ?? 1.0,
      loop: config.loop ?? false,
      maxConcurrent: config.maxConcurrent ?? 5,
      interrupts: config.interrupts ?? false,
      fadeInDuration: config.fadeInDuration,
      fadeOutDuration: config.fadeOutDuration,
      playingSounds: [],
    });
    return this;
  }

  /**
   * 音声を登録
   */
  registerSound(
    key: string,
    category: string,
    path: string | string[],
    config?: SoundConfig
  ): SoundManager {
    if (!this.categories.has(category)) {
      console.warn(
        `Category '${category}' not found. Creating default category.`
      );
      this.defineCategory(category, {});
    }

    this.sounds.set(key, {
      key,
      category,
      path,
      config: config || {},
      isLoaded: false,
    });

    // AssetManagerが利用可能な場合は自動登録
    if (this.assetManager) {
      this.assetManager.registerAudio(key, path);
    }

    return this;
  }

  /**
   * 複数の音声を一括登録
   */
  registerSounds(sounds: SoundRegistration[]): SoundManager {
    sounds.forEach((sound) => {
      this.registerSound(sound.key, sound.category, sound.path, sound.config);
    });
    return this;
  }

  /**
   * 音声をカテゴリごとに一括登録
   */
  registerSoundsByCategory(
    category: string,
    sounds: { [key: string]: string | string[] }
  ): SoundManager {
    Object.entries(sounds).forEach(([key, path]) => {
      this.registerSound(key, category, path);
    });
    return this;
  }

  /**
   * 音声を再生
   */
  playSound(
    key: string,
    config?: Phaser.Types.Sound.SoundConfig
  ): Phaser.Sound.BaseSound | null {
    if (this.isMuted) {
      return null;
    }

    const soundEntry = this.sounds.get(key);
    if (!soundEntry) {
      console.warn(`Sound '${key}' not registered`);
      return null;
    }

    const category = this.categories.get(soundEntry.category);
    if (!category) {
      console.warn(`Category '${soundEntry.category}' not found`);
      return null;
    }

    // 音声が読み込まれているかチェック
    if (!this.scene.cache.audio.exists(key)) {
      console.warn(`Sound '${key}' not loaded`);
      return null;
    }

    // 同時再生数制限のチェック
    if (category.playingSounds.length >= category.maxConcurrent) {
      if (category.interrupts) {
        // 最も古い音声を停止
        const oldestSound = category.playingSounds.shift();
        if (oldestSound) {
          oldestSound.stop();
        }
      } else {
        console.log(
          `Max concurrent sounds reached for category '${category.name}'`
        );
        return null;
      }
    }

    try {
      const sound = this.scene.sound.add(key, {
        volume: category.volume * this.globalVolume,
        loop: category.loop,
        ...soundEntry.config,
        ...config,
      });

      // カテゴリの再生中リストに追加
      category.playingSounds.push(sound);

      // 再生完了時のクリーンアップ
      sound.once("complete", () => {
        this.removeFromCategory(sound, category);
      });

      sound.once("stop", () => {
        this.removeFromCategory(sound, category);
      });

      // フェードイン効果
      if (category.fadeInDuration && category.fadeInDuration > 0) {
        sound.setVolume(0);
        sound.play();

        const fadeInTween = this.scene.tweens.add({
          targets: sound,
          volume: category.volume * this.globalVolume,
          duration: category.fadeInDuration,
          ease: "Power2",
        });

        this.fadeTweens.set(`${key}_fadein`, fadeInTween);
      } else {
        sound.play();
      }

      return sound;
    } catch (error) {
      console.warn(`Failed to play sound '${key}':`, error);
      return null;
    }
  }

  /**
   * BGMを再生
   */
  playBGM(key: string, config?: Phaser.Types.Sound.SoundConfig): void {
    // 現在のBGMを停止
    this.stopBGM();

    const sound = this.playSound(key, config);
    if (sound) {
      this.currentBGM = key;
      this.bgmSound = sound;
    }
  }

  /**
   * BGMを停止
   */
  stopBGM(): void {
    if (this.bgmSound && this.currentBGM) {
      const category = this.getCategoryBySound(this.currentBGM);

      if (category?.fadeOutDuration && category.fadeOutDuration > 0) {
        this.fadeOutSound(this.bgmSound, category.fadeOutDuration, () => {
          this.bgmSound = null;
          this.currentBGM = null;
        });
      } else {
        this.bgmSound.stop();
        this.bgmSound = null;
        this.currentBGM = null;
      }
    }
  }

  /**
   * 音声をフェードアウト
   */
  fadeOutSound(
    sound: Phaser.Sound.BaseSound,
    duration: number,
    onComplete?: () => void
  ): void {
    const fadeOutTween = this.scene.tweens.add({
      targets: sound,
      volume: 0,
      duration: duration,
      ease: "Power2",
      onComplete: () => {
        sound.stop();
        if (onComplete) {
          onComplete();
        }
      },
    });
  }

  /**
   * カテゴリ内の音声を停止
   */
  stopCategory(categoryName: string): void {
    const category = this.categories.get(categoryName);
    if (category) {
      [...category.playingSounds].forEach((sound) => {
        sound.stop();
      });
      category.playingSounds.length = 0;
    }
  }

  /**
   * 全ての音声を停止
   */
  stopAll(): void {
    this.scene.sound.stopAll();
    this.categories.forEach((category) => {
      category.playingSounds.length = 0;
    });
    this.currentBGM = null;
    this.bgmSound = null;
    this.clearFadeTweens();
  }

  /**
   * カテゴリの音量を設定
   */
  setCategoryVolume(categoryName: string, volume: number): void {
    const category = this.categories.get(categoryName);
    if (category) {
      category.volume = Phaser.Math.Clamp(volume, 0, 1);

      // 現在再生中の音声の音量も更新
      category.playingSounds.forEach((sound) => {
        if ("setVolume" in sound) {
          (sound as any).setVolume(category.volume * this.globalVolume);
        } else if ("volume" in sound) {
          (sound as any).volume = category.volume * this.globalVolume;
        }
      });
    }
  }

  /**
   * グローバル音量を設定
   */
  setGlobalVolume(volume: number): void {
    this.globalVolume = Phaser.Math.Clamp(volume, 0, 1);

    // 全ての再生中音声の音量を更新
    this.categories.forEach((category) => {
      category.playingSounds.forEach((sound) => {
        if ("setVolume" in sound) {
          (sound as any).setVolume(category.volume * this.globalVolume);
        } else if ("volume" in sound) {
          (sound as any).volume = category.volume * this.globalVolume;
        }
      });
    });
  }

  /**
   * ミュート設定
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (muted) {
      this.scene.sound.pauseAll();
    } else {
      this.scene.sound.resumeAll();
    }
  }

  /**
   * ミュート切り替え
   */
  toggleMute(): void {
    this.setMuted(!this.isMuted);
  }

  /**
   * カテゴリから音声を削除
   */
  private removeFromCategory(
    sound: Phaser.Sound.BaseSound,
    category: SoundCategory
  ): void {
    const index = category.playingSounds.indexOf(sound);
    if (index > -1) {
      category.playingSounds.splice(index, 1);
    }
  }

  /**
   * 音声が属するカテゴリを取得
   */
  private getCategoryBySound(soundKey: string): SoundCategory | null {
    const soundEntry = this.sounds.get(soundKey);
    if (soundEntry) {
      return this.categories.get(soundEntry.category) || null;
    }
    return null;
  }

  /**
   * フェードトゥイーンをクリア
   */
  private clearFadeTweens(): void {
    this.fadeTweens.forEach((tween) => {
      if (tween.isPlaying()) {
        tween.stop();
      }
    });
    this.fadeTweens.clear();
  }

  /**
   * 現在のBGMキーを取得
   */
  getCurrentBGM(): string | null {
    return this.currentBGM;
  }

  /**
   * BGMが再生中かチェック
   */
  isBGMPlaying(): boolean {
    return this.bgmSound?.isPlaying || false;
  }

  /**
   * ミュート状態を取得
   */
  isMutedState(): boolean {
    return this.isMuted;
  }

  /**
   * カテゴリ情報を取得
   */
  getCategory(name: string): SoundCategory | null {
    return this.categories.get(name) || null;
  }

  /**
   * 全カテゴリを取得
   */
  getAllCategories(): SoundCategory[] {
    return Array.from(this.categories.values());
  }

  /**
   * 登録済み音声一覧を取得
   */
  getRegisteredSounds(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * カテゴリ別音声一覧を取得
   */
  getSoundsByCategory(categoryName: string): string[] {
    return Array.from(this.sounds.entries())
      .filter(([_, sound]) => sound.category === categoryName)
      .map(([key, _]) => key);
  }

  /**
   * 音声設定を保存
   */
  saveSettings(): SoundManagerSettings {
    const categoryVolumes: { [key: string]: number } = {};
    this.categories.forEach((category, name) => {
      categoryVolumes[name] = category.volume;
    });

    return {
      globalVolume: this.globalVolume,
      isMuted: this.isMuted,
      categoryVolumes,
    };
  }

  /**
   * 音声設定を読み込み
   */
  loadSettings(settings: SoundManagerSettings): void {
    this.setGlobalVolume(settings.globalVolume);
    this.setMuted(settings.isMuted);

    Object.entries(settings.categoryVolumes).forEach(([category, volume]) => {
      this.setCategoryVolume(category, volume);
    });
  }

  /**
   * デバッグ情報を取得
   */
  getDebugInfo(): SoundManagerDebugInfo {
    const categoryInfo: { [key: string]: any } = {};
    this.categories.forEach((category, name) => {
      categoryInfo[name] = {
        volume: category.volume,
        playingSounds: category.playingSounds.length,
        maxConcurrent: category.maxConcurrent,
      };
    });

    return {
      globalVolume: this.globalVolume,
      isMuted: this.isMuted,
      currentBGM: this.currentBGM,
      isBGMPlaying: this.isBGMPlaying(),
      totalRegisteredSounds: this.sounds.size,
      categories: categoryInfo,
    };
  }

  /**
   * リソースを解放
   */
  dispose(): void {
    this.stopAll();
    this.clearFadeTweens();
    this.sounds.clear();
    this.categories.clear();
    this.scene.events.off("shutdown");
    this.scene.events.off("destroy");
  }
}

/**
 * 音声エントリー
 */
interface SoundEntry {
  key: string;
  category: string;
  path: string | string[];
  config: SoundConfig;
  isLoaded: boolean;
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
  categoryVolumes: { [key: string]: number };
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
  categories: { [key: string]: any };
}

/**
 * サウンドマネージャーのファクトリー関数
 */
export function createSoundManager(
  scene: Phaser.Scene,
  assetManager?: AssetManager
): SoundManager {
  return new SoundManager(scene, assetManager);
}
