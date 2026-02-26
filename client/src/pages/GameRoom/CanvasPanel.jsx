import { useState, useEffect } from "react";
import { X } from "lucide-react";
import CanvasControls from "../../components/CanvasControls";
import styles from "../../room.module.scss";
import modalStyles from "../../modal.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV ? `http://${window.location.hostname}:3001` : window.location.origin);

function ReferenceImage({ url, index }) {
  const [error, setError] = useState(false);

  if (error) {
    return <div className={modalStyles["ref-error-placeholder"]}>图片加载失败</div>;
  }

  return (
    <img
      src={url}
      alt={`参考图 ${index + 1}`}
      className={modalStyles["ref-img"]}
      onClick={() => window.open(url, "_blank")}
      onError={() => setError(true)}
    />
  );
}

export default function CanvasPanel({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  penColor,
  setPenColor,
  penWidth,
  setPenWidth,
  activeTool,
  setActiveTool,
  clearByDrawer,
  isFullscreen,
  toggleFullScreen,
  canDraw,
  isDrawer,
  word,
  roundEndsAt,
  roundDuration = 75
}) {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceImages, setReferenceImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Calculate canShowReference
  let canShowReference = false;
  if (canDraw && roundEndsAt) {
    const remainingMs = roundEndsAt - Date.now();
    const elapsedSeconds = (roundDuration * 1000 - remainingMs) / 1000;
    canShowReference = elapsedSeconds >= 10;
  }

  // Fetch reference images
  useEffect(() => {
    if (isDrawer && word) {
      setReferenceImages([]);
      
      const loadReferenceImages = async () => {
        setLoadingImages(true);
        try {
          const res = await fetch(`${SERVER_URL}/api/reference-images?word=${encodeURIComponent(word)}`);
          const data = await res.json();
          if (data.images) {
            setReferenceImages(data.images);
          }
        } catch (err) {
          console.error("Failed to fetch reference images", err);
        } finally {
          setLoadingImages(false);
        }
      };

      loadReferenceImages();
    }
  }, [isDrawer, word]);

  return (
    <>
      <div className={styles["canvas-wrap"]}>
        <CanvasControls
          showToolbar={showToolbar}
          setShowToolbar={setShowToolbar}
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          penColor={penColor}
          setPenColor={setPenColor}
          penWidth={penWidth}
          setPenWidth={setPenWidth}
          canDraw={canDraw}
          clearByDrawer={clearByDrawer}
          isFullscreen={isFullscreen}
          toggleFullScreen={toggleFullScreen}
          canShowReference={canShowReference}
          setShowReferenceModal={setShowReferenceModal}
        />

        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="绘图画布"
        />
      </div>

      {showReferenceModal && (
        <div className={modalStyles["modal-overlay"]}>
          <div className={cx(modalStyles["modal-content"], modalStyles["modal-content-ref"])}>
            <div className={modalStyles["modal-header"]}>
              <h2>参考图 - {word}</h2>
              <button className={modalStyles["close-btn"]} onClick={() => setShowReferenceModal(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={modalStyles["ref-popup-content"]}>
              {loadingImages ? (
                <div className={modalStyles["ref-loading"]}>正在生成参考图...</div>
              ) : referenceImages.length > 0 ? (
                <div className={modalStyles["ref-grid"]}>
                  {referenceImages.map((url, idx) => (
                    <div key={idx} className={modalStyles["ref-item"]}>
                      <ReferenceImage url={url} index={idx} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={modalStyles["ref-empty"]}>未找到相关参考图</div>
              )}
              <p className={modalStyles["ref-hint"]}>
                *图片由 AI 实时生成，仅供参考，请勿直接照抄哦~
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
