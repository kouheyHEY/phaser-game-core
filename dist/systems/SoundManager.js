import * as Phaser from "phaser";
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
    scene;
    assetManager;
    sounds = new Map();
    categories = new Map();
    currentBGM = null;
    bgmSound = null;
    globalVolume = 1.0;
    isMuted = false;
    fadeTweens = new Map();
    constructor(scene, assetManager) {
        this.scene = scene;
        this.assetManager = assetManager;
        this.setupDefaultCategories();
        this.setupEventListeners();
    }
    /**
     * デフォルトカテゴリの設定
     */
    setupDefaultCategories() {
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
    setupEventListeners() {
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
    defineCategory(name, config) {
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
    registerSound(key, category, path, config) {
        if (!this.categories.has(category)) {
            console.warn(`Category '${category}' not found. Creating default category.`);
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
    registerSounds(sounds) {
        sounds.forEach((sound) => {
            this.registerSound(sound.key, sound.category, sound.path, sound.config);
        });
        return this;
    }
    /**
     * 音声をカテゴリごとに一括登録
     */
    registerSoundsByCategory(category, sounds) {
        Object.entries(sounds).forEach(([key, path]) => {
            this.registerSound(key, category, path);
        });
        return this;
    }
    /**
     * 音声を再生
     */
    playSound(key, config) {
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
            }
            else {
                console.log(`Max concurrent sounds reached for category '${category.name}'`);
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
            }
            else {
                sound.play();
            }
            return sound;
        }
        catch (error) {
            console.warn(`Failed to play sound '${key}':`, error);
            return null;
        }
    }
    /**
     * BGMを再生
     */
    playBGM(key, config) {
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
    stopBGM() {
        if (this.bgmSound && this.currentBGM) {
            const category = this.getCategoryBySound(this.currentBGM);
            if (category?.fadeOutDuration && category.fadeOutDuration > 0) {
                this.fadeOutSound(this.bgmSound, category.fadeOutDuration, () => {
                    this.bgmSound = null;
                    this.currentBGM = null;
                });
            }
            else {
                this.bgmSound.stop();
                this.bgmSound = null;
                this.currentBGM = null;
            }
        }
    }
    /**
     * 音声をフェードアウト
     */
    fadeOutSound(sound, duration, onComplete) {
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
    stopCategory(categoryName) {
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
    stopAll() {
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
    setCategoryVolume(categoryName, volume) {
        const category = this.categories.get(categoryName);
        if (category) {
            category.volume = Phaser.Math.Clamp(volume, 0, 1);
            // 現在再生中の音声の音量も更新
            category.playingSounds.forEach((sound) => {
                if ("setVolume" in sound) {
                    sound.setVolume(category.volume * this.globalVolume);
                }
                else if ("volume" in sound) {
                    sound.volume = category.volume * this.globalVolume;
                }
            });
        }
    }
    /**
     * グローバル音量を設定
     */
    setGlobalVolume(volume) {
        this.globalVolume = Phaser.Math.Clamp(volume, 0, 1);
        // 全ての再生中音声の音量を更新
        this.categories.forEach((category) => {
            category.playingSounds.forEach((sound) => {
                if ("setVolume" in sound) {
                    sound.setVolume(category.volume * this.globalVolume);
                }
                else if ("volume" in sound) {
                    sound.volume = category.volume * this.globalVolume;
                }
            });
        });
    }
    /**
     * ミュート設定
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (muted) {
            this.scene.sound.pauseAll();
        }
        else {
            this.scene.sound.resumeAll();
        }
    }
    /**
     * ミュート切り替え
     */
    toggleMute() {
        this.setMuted(!this.isMuted);
    }
    /**
     * カテゴリから音声を削除
     */
    removeFromCategory(sound, category) {
        const index = category.playingSounds.indexOf(sound);
        if (index > -1) {
            category.playingSounds.splice(index, 1);
        }
    }
    /**
     * 音声が属するカテゴリを取得
     */
    getCategoryBySound(soundKey) {
        const soundEntry = this.sounds.get(soundKey);
        if (soundEntry) {
            return this.categories.get(soundEntry.category) || null;
        }
        return null;
    }
    /**
     * フェードトゥイーンをクリア
     */
    clearFadeTweens() {
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
    getCurrentBGM() {
        return this.currentBGM;
    }
    /**
     * BGMが再生中かチェック
     */
    isBGMPlaying() {
        return this.bgmSound?.isPlaying || false;
    }
    /**
     * ミュート状態を取得
     */
    isMutedState() {
        return this.isMuted;
    }
    /**
     * カテゴリ情報を取得
     */
    getCategory(name) {
        return this.categories.get(name) || null;
    }
    /**
     * 全カテゴリを取得
     */
    getAllCategories() {
        return Array.from(this.categories.values());
    }
    /**
     * 登録済み音声一覧を取得
     */
    getRegisteredSounds() {
        return Array.from(this.sounds.keys());
    }
    /**
     * カテゴリ別音声一覧を取得
     */
    getSoundsByCategory(categoryName) {
        return Array.from(this.sounds.entries())
            .filter(([_, sound]) => sound.category === categoryName)
            .map(([key, _]) => key);
    }
    /**
     * 音声設定を保存
     */
    saveSettings() {
        const categoryVolumes = {};
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
    loadSettings(settings) {
        this.setGlobalVolume(settings.globalVolume);
        this.setMuted(settings.isMuted);
        Object.entries(settings.categoryVolumes).forEach(([category, volume]) => {
            this.setCategoryVolume(category, volume);
        });
    }
    /**
     * デバッグ情報を取得
     */
    getDebugInfo() {
        const categoryInfo = {};
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
    dispose() {
        this.stopAll();
        this.clearFadeTweens();
        this.sounds.clear();
        this.categories.clear();
        this.scene.events.off("shutdown");
        this.scene.events.off("destroy");
    }
}
/**
 * サウンドマネージャーのファクトリー関数
 */
export function createSoundManager(scene, assetManager) {
    return new SoundManager(scene, assetManager);
}
