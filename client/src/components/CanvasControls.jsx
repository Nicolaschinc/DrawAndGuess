import { memo } from "react";
import { useTranslation } from "react-i18next";
import styles from "../toolbar.module.scss";
import { Palette, Brush, Trash2, X, Settings, Image as ImageIcon, Maximize, Minimize } from "lucide-react";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

const CanvasControls = memo(function CanvasControls({
  showToolbar,
  setShowToolbar,
  activeTool,
  setActiveTool,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  canDraw,
  clearByDrawer,
  isFullscreen,
  toggleFullScreen,
  canShowReference,
  setShowReferenceModal
}) {
  const { t } = useTranslation();
  return (
    <>
      <button 
        className={cx(styles["toolbar-trigger"], showToolbar && styles.active)}
        onClick={() => setShowToolbar(!showToolbar)}
        title={t('ui.toolbar')}
      >
        <Settings size={20} />
      </button>

      {canShowReference && (
        <button
          className={cx(styles["toolbar-trigger"], styles["toolbar-trigger-ai"])}
          onClick={() => setShowReferenceModal(true)}
          disabled={!canDraw}
          title={t('ui.aiReference')}
          aria-label={t('ui.aiReference')}
        >
          <ImageIcon size={20} />
        </button>
      )}

      {showToolbar && (
        <div className={cx(styles["floating-toolbar"])}>
          <div className={styles["tool-group"]}>
            <button
              className={cx(styles["tool-btn"], activeTool === "color" && styles.active)}
              onClick={() => setActiveTool(activeTool === "color" ? null : "color")}
              disabled={!canDraw}
              title={t('ui.color')}
              aria-label={t('ui.chooseColor')}
              aria-expanded={activeTool === "color"}
            >
              <Palette size={20} />
              <span className={styles["color-indicator"]} style={{ backgroundColor: penColor }} />
            </button>
            {activeTool === "color" && (
              <div className={styles["tool-popup"]}>
                <div className={styles["popup-header"]}>
                  <span>{t('ui.chooseColor')}</span>
                  <button className={styles["popup-close"]} onClick={() => setActiveTool(null)}>
                    <X size={14} />
                  </button>
                </div>
                <div className={styles["popup-content"]}>
                  <input
                    type="color"
                    className={styles["color-picker-input"]}
                    value={penColor}
                    onChange={(e) => setPenColor(e.target.value)}
                  />
                  <div className={styles["color-presets"]}>
                    {["#111111", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffffff"].map(c => (
                      <button
                        key={c}
                        className={styles["color-preset-btn"]}
                        style={{ backgroundColor: c }}
                        onClick={() => setPenColor(c)}
                        aria-label={`${t('ui.chooseColor')} ${c}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles["tool-group"]}>
            <button
              className={cx(styles["tool-btn"], activeTool === "width" && styles.active)}
              onClick={() => setActiveTool(activeTool === "width" ? null : "width")}
              disabled={!canDraw}
              title={t('ui.brushSize')}
              aria-label={t('ui.adjustBrushSize')}
              aria-expanded={activeTool === "width"}
            >
              <Brush size={20} />
              <span className={styles["width-indicator"]}>{penWidth}</span>
            </button>
            {activeTool === "width" && (
              <div className={styles["tool-popup"]}>
                <div className={styles["popup-header"]}>
                  <span>{t('ui.brushSize')}</span>
                  <button className={styles["popup-close"]} onClick={() => setActiveTool(null)}>
                    <X size={14} />
                  </button>
                </div>
                <div className={styles["popup-content"]}>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={penWidth}
                    onChange={(e) => setPenWidth(Number(e.target.value))}
                    className={styles["width-slider"]}
                  />
                  <div className={styles["width-preview-box"]}>
                    <div
                      className={styles["width-preview-dot"]}
                      style={{
                        width: penWidth,
                        height: penWidth,
                        backgroundColor: penColor
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles["tool-divider"]} />

          <button
            className={cx(styles["tool-btn"], styles.danger)}
            onClick={clearByDrawer}
            disabled={!canDraw}
            title={t('ui.clearCanvas')}
            aria-label={t('ui.clearCanvas')}
          >
            <Trash2 size={20} />
          </button>
        </div>
      )}
      
      <button
        className={styles["fullscreen-trigger"]}
        onClick={toggleFullScreen}
        title={isFullscreen ? t('ui.exitFullscreen') : t('ui.enterFullscreen')}
        aria-label={isFullscreen ? t('ui.exitFullscreen') : t('ui.enterFullscreen')}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
    </>
  );
});

export default CanvasControls;
