import * as Phaser from "phaser";
import { SoundManager, AssetManager } from "../index";

/**
 * 汎用SoundManagerの使用例
 *
 * このサンプルでは、特定の音声ファイルに依存しない
 * 汎用的なサウンド管理システムの使用方法を示します。
 */
export class SoundManagerExample extends Phaser.Scene {
  private soundManager!: SoundManager;
  private assetManager!: AssetManager;

  constructor() {
    super({ key: "SoundManagerExample" });
  }

  preload() {
    // AssetManagerを初期化
    this.assetManager = new AssetManager(this);

    // SoundManagerを初期化（AssetManagerと連携）
    this.soundManager = new SoundManager(this, this.assetManager);

    this.setupSounds();
  }

  private setupSounds(): void {
    // カテゴリのカスタマイズ（必要に応じて）
    this.soundManager
      .defineCategory("click_sounds", {
        volume: 0.8,
        maxConcurrent: 3,
        interrupts: false,
      })
      .defineCategory("level_sounds", {
        volume: 0.9,
        maxConcurrent: 2,
        interrupts: true,
      })
      .defineCategory("puzzle_sounds", {
        volume: 1.0,
        maxConcurrent: 1,
        interrupts: false,
      })
      .defineCategory("background_music", {
        volume: 0.6,
        loop: true,
        maxConcurrent: 1,
        interrupts: true,
        fadeInDuration: 2000,
        fadeOutDuration: 1500,
      });

    // 音声を登録（実際のパスはゲームに合わせて設定）
    this.soundManager
      // レベルアップ系音声
      .registerSound("se_purchase_1", "level_sounds", [
        "assets/audio/se_purchase_1.mp3",
        "assets/audio/se_purchase_1.ogg",
      ])
      // クリック系音声
      .registerSound("se_crash_1", "click_sounds", [
        "assets/audio/se_crash_1.mp3",
        "assets/audio/se_crash_1.ogg",
      ])
      // パズル正解音声
      .registerSound("se_pingpong", "puzzle_sounds", [
        "assets/audio/se_pingpong.mp3",
        "assets/audio/se_pingpong.ogg",
      ])
      // BGM
      .registerSound("bgm_all_menu", "background_music", [
        "assets/audio/bgm_all_menu.mp3",
        "assets/audio/bgm_all_menu.ogg",
      ])
      .registerSound("bgm_all_stage1", "background_music", [
        "assets/audio/bgm_all_stage1.mp3",
        "assets/audio/bgm_all_stage1.ogg",
      ]);

    // 一括登録の例
    this.soundManager.registerSoundsByCategory("ui", {
      button_hover: "assets/audio/hover.mp3",
      button_press: "assets/audio/press.mp3",
      menu_open: "assets/audio/menu_open.mp3",
      menu_close: "assets/audio/menu_close.mp3",
    });

    // アセットの読み込み
    this.loadAudioAssets();
  }

  private async loadAudioAssets(): Promise<void> {
    try {
      // 登録された全ての音声アセットを読み込み
      const soundKeys = this.soundManager.getRegisteredSounds();
      await this.assetManager.loadAssets(soundKeys, (progress) => {
        console.log(`Audio loading: ${Math.round(progress * 100)}%`);
      });

      console.log("All audio assets loaded successfully");
    } catch (error) {
      console.error("Failed to load audio assets:", error);
    }
  }

  create() {
    this.setupUI();
    this.setupGameLogic();

    // BGMを開始
    this.soundManager.playBGM("bgm_all_menu");
  }

  private setupUI(): void {
    // レベルアップボタン
    const levelUpButton = this.add
      .rectangle(200, 150, 150, 50, 0x00ff00)
      .setInteractive();

    this.add
      .text(200, 150, "Level Up!", {
        fontSize: "16px",
        color: "#000000",
      })
      .setOrigin(0.5);

    levelUpButton.on("pointerdown", () => {
      this.soundManager.playSound("se_purchase_1");
    });

    // クリックボタン
    const clickButton = this.add
      .rectangle(400, 150, 150, 50, 0x0000ff)
      .setInteractive();

    this.add
      .text(400, 150, "Click Me!", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    clickButton.on("pointerdown", () => {
      this.soundManager.playSound("se_crash_1");
    });

    // パズル正解ボタン
    const puzzleButton = this.add
      .rectangle(600, 150, 150, 50, 0xff0000)
      .setInteractive();

    this.add
      .text(600, 150, "Puzzle!", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    puzzleButton.on("pointerdown", () => {
      this.soundManager.playSound("se_pingpong");
    });

    // BGM切り替えボタン
    const bgmButton = this.add
      .rectangle(200, 250, 150, 50, 0xffff00)
      .setInteractive();

    this.add
      .text(200, 250, "BGM Stage", {
        fontSize: "16px",
        color: "#000000",
      })
      .setOrigin(0.5);

    bgmButton.on("pointerdown", () => {
      this.soundManager.playBGM("bgm_all_stage1");
    });

    // 音量コントロール
    this.setupVolumeControls();

    // ミュートボタン
    const muteButton = this.add
      .rectangle(600, 250, 100, 50, 0x888888)
      .setInteractive();

    const muteText = this.add
      .text(600, 250, "Mute", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    muteButton.on("pointerdown", () => {
      this.soundManager.toggleMute();
      muteText.setText(this.soundManager.isMutedState() ? "Unmute" : "Mute");
    });
  }

  private setupVolumeControls(): void {
    // カテゴリ別音量調整の例
    const categories = ["ui", "sfx", "bgm"];
    const colors = [0x666666, 0x999999, 0xcccccc];

    categories.forEach((category, categoryIndex) => {
      this.add.text(
        100,
        350 + categoryIndex * 50,
        `${category.toUpperCase()}:`,
        {
          fontSize: "14px",
          color: "#ffffff",
        }
      );

      [0.0, 0.3, 0.7, 1.0].forEach((volume, volumeIndex) => {
        const button = this.add
          .rectangle(
            200 + volumeIndex * 40,
            350 + categoryIndex * 50,
            30,
            30,
            colors[categoryIndex]
          )
          .setInteractive();

        this.add
          .text(
            200 + volumeIndex * 40,
            350 + categoryIndex * 50,
            `${Math.round(volume * 10)}`,
            {
              fontSize: "12px",
              color: "#ffffff",
            }
          )
          .setOrigin(0.5);

        button.on("pointerdown", () => {
          this.soundManager.setCategoryVolume(category, volume);
          // UIのフィードバック音
          this.soundManager.playSound("button_press");
        });
      });
    });

    // グローバル音量調整
    this.add.text(400, 350, "GLOBAL:", {
      fontSize: "14px",
      color: "#ffffff",
    });

    [0.0, 0.3, 0.7, 1.0].forEach((volume, index) => {
      const button = this.add
        .rectangle(500 + index * 40, 350, 30, 30, 0xff6666)
        .setInteractive();

      this.add
        .text(500 + index * 40, 350, `${Math.round(volume * 10)}`, {
          fontSize: "12px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      button.on("pointerdown", () => {
        this.soundManager.setGlobalVolume(volume);
      });
    });
  }

  private setupGameLogic(): void {
    // デバッグ情報表示
    const debugText = this.add.text(50, 500, "", {
      fontSize: "10px",
      color: "#ffffff",
    });

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        const debug = this.soundManager.getDebugInfo();
        debugText.setText(
          [
            "Sound Manager Debug:",
            `Global Volume: ${debug.globalVolume.toFixed(2)}`,
            `Muted: ${debug.isMuted}`,
            `Current BGM: ${debug.currentBGM || "None"}`,
            `BGM Playing: ${debug.isBGMPlaying}`,
            `Registered Sounds: ${debug.totalRegisteredSounds}`,
            `Categories: ${Object.keys(debug.categories).join(", ")}`,
          ].join("\n")
        );
      },
      loop: true,
    });

    // 設定の保存・読み込み例
    this.setupSettingsPersistence();
  }

  private setupSettingsPersistence(): void {
    // 設定保存ボタン
    const saveButton = this.add
      .rectangle(100, 450, 100, 30, 0x00aa00)
      .setInteractive();

    this.add
      .text(100, 450, "Save Settings", {
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    saveButton.on("pointerdown", () => {
      const settings = this.soundManager.saveSettings();
      localStorage.setItem("soundSettings", JSON.stringify(settings));
      console.log("Settings saved:", settings);
    });

    // 設定読み込みボタン
    const loadButton = this.add
      .rectangle(220, 450, 100, 30, 0x0000aa)
      .setInteractive();

    this.add
      .text(220, 450, "Load Settings", {
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    loadButton.on("pointerdown", () => {
      const savedSettings = localStorage.getItem("soundSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.soundManager.loadSettings(settings);
        console.log("Settings loaded:", settings);
      }
    });
  }
}

/**
 * より高度な使用例：ゲーム状況に応じた動的音響管理
 */
export class AdvancedSoundExample {
  private soundManager: SoundManager;

  constructor(scene: Phaser.Scene) {
    this.soundManager = new SoundManager(scene);
    this.setupAdvancedSounds();
  }

  private setupAdvancedSounds(): void {
    // ゲーム状況別のカテゴリ定義
    this.soundManager
      .defineCategory("gameplay", {
        volume: 0.8,
        maxConcurrent: 8,
        interrupts: false,
      })
      .defineCategory("combat", {
        volume: 0.9,
        maxConcurrent: 5,
        interrupts: true,
      })
      .defineCategory("environment", {
        volume: 0.4,
        loop: true,
        maxConcurrent: 3,
        interrupts: false,
        fadeInDuration: 3000,
        fadeOutDuration: 2000,
      });
  }

  /**
   * ゲーム状況に応じたBGM自動切り替え
   */
  handleGameStateChange(
    newState: "menu" | "playing" | "paused" | "gameover"
  ): void {
    switch (newState) {
      case "menu":
        this.soundManager.playBGM("bgm_all_menu");
        break;
      case "playing":
        this.soundManager.playBGM("bgm_all_stage1");
        break;
      case "paused":
        // BGMの音量を下げる
        this.soundManager.setCategoryVolume("background_music", 0.2);
        break;
      case "gameover":
        this.soundManager.stopCategory("background_music");
        this.soundManager.playSound("game_over_sound");
        break;
    }
  }

  /**
   * プレイヤーアクションに応じた音響効果
   */
  handlePlayerAction(action: string, data?: any): void {
    switch (action) {
      case "levelup":
        this.soundManager.playSound("se_purchase_1");
        break;
      case "click":
      case "tap":
        this.soundManager.playSound("se_crash_1");
        break;
      case "puzzle_correct":
        this.soundManager.playSound("se_pingpong");
        break;
      case "combo":
        // コンボ数に応じた音程変更
        this.soundManager.playSound("combo_sound", {
          detune: (data?.comboCount || 1) * 100,
        });
        break;
    }
  }

  /**
   * 環境音の動的制御
   */
  updateAmbientSounds(environment: "forest" | "city" | "dungeon"): void {
    // 現在の環境音を停止
    this.soundManager.stopCategory("environment");

    // 新しい環境音を開始
    switch (environment) {
      case "forest":
        this.soundManager.playSound("forest_ambient");
        break;
      case "city":
        this.soundManager.playSound("city_ambient");
        break;
      case "dungeon":
        this.soundManager.playSound("dungeon_ambient");
        break;
    }
  }
}

// 設定例
export const soundManagerConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#2c3e50",
  scene: SoundManagerExample,
};
