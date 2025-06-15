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
export class AssetManager {
    scene;
    loadedAssets = new Map();
    assetRegistry = new Map();
    loadQueue = [];
    isLoading = false;
    constructor(scene) {
        this.scene = scene;
    }
    /**
     * 画像アセットを登録
     */
    registerImage(key, path, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.IMAGE,
            path,
            options,
        });
        return this;
    }
    /**
     * スプライトシートを登録
     */
    registerSpritesheet(key, path, frameConfig, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.SPRITESHEET,
            path,
            frameConfig,
            options,
        });
        return this;
    }
    /**
     * テクスチャアトラスを登録
     */
    registerAtlas(key, textureURL, atlasURL, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.ATLAS,
            path: textureURL,
            atlasPath: atlasURL,
            options,
        });
        return this;
    }
    /**
     * 音声アセットを登録
     */
    registerAudio(key, path, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.AUDIO,
            path,
            options,
        });
        return this;
    }
    /**
     * JSONファイルを登録
     */
    registerJSON(key, path, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.JSON,
            path,
            options,
        });
        return this;
    }
    /**
     * XMLファイルを登録
     */
    registerXML(key, path, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.XML,
            path,
            options,
        });
        return this;
    }
    /**
     * フォントを登録
     */
    registerFont(key, path, options) {
        this.assetRegistry.set(key, {
            key,
            type: AssetType.FONT,
            path,
            options,
        });
        return this;
    }
    /**
     * 登録されたアセットを読み込み
     */
    async loadAssets(keys, onProgress) {
        if (this.isLoading) {
            console.warn("Already loading assets");
            return;
        }
        this.isLoading = true;
        try {
            const assetsToLoad = keys
                ? keys
                    .map((key) => this.assetRegistry.get(key))
                    .filter(Boolean)
                : Array.from(this.assetRegistry.values());
            if (assetsToLoad.length === 0) {
                console.warn("No assets to load");
                return;
            }
            // プログレスコールバックを設定
            if (onProgress) {
                this.scene.load.on("progress", onProgress);
            }
            // アセットを読み込みキューに追加
            for (const asset of assetsToLoad) {
                this.addToLoadQueue(asset);
            }
            // 読み込み開始
            if (!this.scene.load.isLoading()) {
                return new Promise((resolve, reject) => {
                    this.scene.load.once("complete", () => {
                        this.onLoadComplete(assetsToLoad);
                        resolve();
                    });
                    this.scene.load.once("loaderror", (file) => {
                        console.error(`Failed to load asset: ${file.key}`);
                        reject(new Error(`Failed to load asset: ${file.key}`));
                    });
                    this.scene.load.start();
                });
            }
        }
        finally {
            this.isLoading = false;
            if (onProgress) {
                this.scene.load.off("progress", onProgress);
            }
        }
    }
    /**
     * アセットを読み込みキューに追加
     */
    addToLoadQueue(asset) {
        const loader = this.scene.load;
        switch (asset.type) {
            case AssetType.IMAGE:
                loader.image(asset.key, asset.path, asset.options);
                break;
            case AssetType.SPRITESHEET:
                loader.spritesheet(asset.key, asset.path, asset.frameConfig, asset.options);
                break;
            case AssetType.ATLAS:
                loader.atlas(asset.key, asset.path, asset.atlasPath, asset.options);
                break;
            case AssetType.AUDIO:
                loader.audio(asset.key, asset.path, asset.options);
                break;
            case AssetType.JSON:
                loader.json(asset.key, asset.path, asset.options);
                break;
            case AssetType.XML:
                loader.xml(asset.key, asset.path, asset.options);
                break;
            case AssetType.FONT:
                loader.bitmapFont(asset.key, asset.path, asset.options?.fontDataURL);
                break;
        }
    }
    /**
     * 読み込み完了時の処理
     */
    onLoadComplete(loadedAssets) {
        for (const asset of loadedAssets) {
            this.loadedAssets.set(asset.key, {
                key: asset.key,
                type: asset.type,
                loadedAt: Date.now(),
            });
        }
    }
    /**
     * アセットが読み込み済みかチェック
     */
    isLoaded(key) {
        return (this.loadedAssets.has(key) &&
            (this.scene.textures.exists(key) ||
                this.scene.cache.audio.exists(key) ||
                this.scene.cache.json.exists(key) ||
                this.scene.cache.xml.exists(key)));
    }
    /**
     * 登録されているアセットかチェック
     */
    isRegistered(key) {
        return this.assetRegistry.has(key);
    }
    /**
     * 画像アセットを取得
     */
    getImage(key) {
        if (!this.isLoaded(key)) {
            console.warn(`Image asset '${key}' is not loaded`);
            return null;
        }
        return this.scene.textures.get(key);
    }
    /**
     * 音声アセットを取得
     */
    getAudio(key) {
        if (!this.isLoaded(key)) {
            console.warn(`Audio asset '${key}' is not loaded`);
            return null;
        }
        return this.scene.sound.get(key);
    }
    /**
     * JSONデータを取得
     */
    getJSON(key) {
        if (!this.isLoaded(key)) {
            console.warn(`JSON asset '${key}' is not loaded`);
            return null;
        }
        return this.scene.cache.json.get(key);
    }
    /**
     * XMLデータを取得
     */
    getXML(key) {
        if (!this.isLoaded(key)) {
            console.warn(`XML asset '${key}' is not loaded`);
            return null;
        }
        return this.scene.cache.xml.get(key);
    }
    /**
     * 読み込み済みアセット一覧を取得
     */
    getLoadedAssets() {
        return Array.from(this.loadedAssets.keys());
    }
    /**
     * 登録済みアセット一覧を取得
     */
    getRegisteredAssets() {
        return Array.from(this.assetRegistry.keys());
    }
    /**
     * アセットを削除
     */
    removeAsset(key) {
        this.assetRegistry.delete(key);
        this.loadedAssets.delete(key);
        // キャッシュからも削除
        this.scene.textures.remove(key);
        this.scene.cache.audio.remove(key);
        this.scene.cache.json.remove(key);
        this.scene.cache.xml.remove(key);
    }
    /**
     * 全アセットをクリア
     */
    clear() {
        this.assetRegistry.clear();
        this.loadedAssets.clear();
        this.loadQueue = [];
    }
    /**
     * 読み込み進捗情報を取得
     */
    getLoadProgress() {
        const total = this.assetRegistry.size;
        const loaded = this.loadedAssets.size;
        return {
            loaded,
            total,
            percentage: total > 0 ? Math.round((loaded / total) * 100) : 0,
        };
    }
    /**
     * 複数のアセットを一括登録
     */
    registerAssets(assets) {
        for (const asset of assets) {
            switch (asset.type) {
                case AssetType.IMAGE:
                    this.registerImage(asset.key, asset.path, asset.options);
                    break;
                case AssetType.SPRITESHEET:
                    this.registerSpritesheet(asset.key, asset.path, asset.frameConfig, asset.options);
                    break;
                case AssetType.ATLAS:
                    this.registerAtlas(asset.key, asset.path, asset.atlasPath, asset.options);
                    break;
                case AssetType.AUDIO:
                    this.registerAudio(asset.key, asset.path, asset.options);
                    break;
                case AssetType.JSON:
                    this.registerJSON(asset.key, asset.path, asset.options);
                    break;
                case AssetType.XML:
                    this.registerXML(asset.key, asset.path, asset.options);
                    break;
                case AssetType.FONT:
                    this.registerFont(asset.key, asset.path, asset.options);
                    break;
            }
        }
        return this;
    }
    /**
     * アセットプリローダー（ゲーム開始前の必須アセット読み込み）
     */
    async preloadEssentialAssets(essentialKeys, onProgress) {
        const essentialAssets = essentialKeys
            .map((key) => this.assetRegistry.get(key))
            .filter(Boolean);
        if (essentialAssets.length === 0) {
            throw new Error("No essential assets found");
        }
        return this.loadAssets(essentialKeys, onProgress);
    }
    /**
     * レベル別アセット読み込み
     */
    async loadLevelAssets(levelName, assetKeys, onProgress) {
        console.log(`Loading assets for level: ${levelName}`);
        return this.loadAssets(assetKeys, onProgress);
    }
    /**
     * アセットの容量チェック（概算）
     */
    getEstimatedSize() {
        let totalEstimatedSize = 0;
        const sizeByType = {
            [AssetType.IMAGE]: 0,
            [AssetType.SPRITESHEET]: 0,
            [AssetType.ATLAS]: 0,
            [AssetType.AUDIO]: 0,
            [AssetType.JSON]: 0,
            [AssetType.XML]: 0,
            [AssetType.FONT]: 0,
        };
        // 概算サイズ計算（実際のファイルサイズは取得できないため推定値）
        for (const [key, asset] of this.assetRegistry) {
            let estimatedSize = 0;
            switch (asset.type) {
                case AssetType.IMAGE:
                case AssetType.SPRITESHEET:
                    estimatedSize = 100; // KB (概算)
                    break;
                case AssetType.ATLAS:
                    estimatedSize = 200; // KB (概算)
                    break;
                case AssetType.AUDIO:
                    estimatedSize = 500; // KB (概算)
                    break;
                case AssetType.JSON:
                case AssetType.XML:
                    estimatedSize = 10; // KB (概算)
                    break;
                case AssetType.FONT:
                    estimatedSize = 50; // KB (概算)
                    break;
            }
            sizeByType[asset.type] += estimatedSize;
            totalEstimatedSize += estimatedSize;
        }
        return {
            totalSizeKB: totalEstimatedSize,
            sizeByType,
            assetCount: this.assetRegistry.size,
        };
    }
}
/**
 * アセットタイプ列挙
 */
export var AssetType;
(function (AssetType) {
    AssetType["IMAGE"] = "image";
    AssetType["SPRITESHEET"] = "spritesheet";
    AssetType["ATLAS"] = "atlas";
    AssetType["AUDIO"] = "audio";
    AssetType["JSON"] = "json";
    AssetType["XML"] = "xml";
    AssetType["FONT"] = "font";
})(AssetType || (AssetType = {}));
