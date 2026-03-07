import { useState, useEffect, useReducer, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import CanvasControls from "../../components/CanvasControls";
import styles from "../../room.module.scss";
import modalStyles from "../../modal.module.scss";
import {
  initialReferenceImagesState,
  normalizeReferenceWord,
  referenceImagesReducer,
  resolveReferenceImageUrls,
  shouldFetchReferenceImages,
} from "./referenceImagesState";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ??
  (import.meta.env.DEV
    ? `http://${window.location.hostname}:3001`
    : window.location.origin);

function ReferenceImage({ url, index }) {
  const { t } = useTranslation();
  const [error, setError] = useState(false);

  if (error) {
    return <div className={modalStyles["ref-error-placeholder"]}>{t('ui.imageLoadFailed')}</div>;
  }

  return (
    <img
      src={url}
      alt={`${t('ui.reference')} ${index + 1}`}
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
  isPseudoFullscreen,
  toggleFullScreen,
  canDraw,
  isDrawer,
  word
}) {
  const { t } = useTranslation();
  const [showToolbar, setShowToolbar] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [referenceState, dispatchReferenceState] = useReducer(
    referenceImagesReducer,
    initialReferenceImagesState
  );
  const normalizedWord = normalizeReferenceWord(word);

  // Show AI reference as soon as the current player is drawing.
  const canShowReference = canDraw && Boolean(word);
  const loadingImages =
    referenceState.loading ||
    shouldFetchReferenceImages({
      isDrawer,
      showReferenceModal,
      word: normalizedWord,
      cache: referenceState.cache,
    });

  const closeReferenceModal = useCallback(() => {
    setShowReferenceModal(false);
    dispatchReferenceState({ type: "request-cancel" });
  }, []);

  useEffect(() => {
    dispatchReferenceState({ type: "sync-word", word: normalizedWord });
  }, [normalizedWord]);

  useEffect(() => {
    if (!canShowReference && showReferenceModal) {
      closeReferenceModal();
    }
  }, [canShowReference, closeReferenceModal, showReferenceModal]);

  useEffect(() => {
    if (
      !shouldFetchReferenceImages({
        isDrawer,
        showReferenceModal,
        word: normalizedWord,
        cache: referenceState.cache,
      })
    ) {
      return undefined;
    }

    const controller = new AbortController();

    dispatchReferenceState({ type: "request-start", word: normalizedWord });

    const loadReferenceImages = async () => {
      try {
        const res = await fetch(
          `${SERVER_URL}/api/reference-images?word=${encodeURIComponent(normalizedWord)}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error(`Reference request failed: ${res.status}`);
        }

        const data = await res.json();
        dispatchReferenceState({
          type: "request-success",
          word: normalizedWord,
          images: resolveReferenceImageUrls(data.images, SERVER_URL),
        });
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }

        console.error("Failed to fetch reference images", err);
        dispatchReferenceState({
          type: "request-error",
          word: normalizedWord,
          error: err.message,
        });
      }
    };

    loadReferenceImages();

    return () => {
      controller.abort();
    };
  }, [
    isDrawer,
    normalizedWord,
    referenceState.cache,
    showReferenceModal,
  ]);

  return (
    <>
      <div className={cx(styles["canvas-wrap"], isPseudoFullscreen && styles["fullscreen-pseudo"])}>
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
          aria-label={t('ui.canvas')}
        />
      </div>

      {showReferenceModal && (
        <div className={modalStyles["modal-overlay"]}>
          <div className={cx(modalStyles["modal-content"], modalStyles["modal-content-ref"])}>
            <div className={modalStyles["modal-header"]}>
              <h2>{t('ui.reference')} - {word}</h2>
              <button className={modalStyles["close-btn"]} onClick={closeReferenceModal}>
                <X size={24} />
              </button>
            </div>
            <div className={modalStyles["ref-popup-content"]}>
              {loadingImages ? (
                <div className={modalStyles["ref-loading"]}>{t('ui.generatingReference')}</div>
              ) : referenceState.images.length > 0 ? (
                <div className={modalStyles["ref-grid"]}>
                  {referenceState.images.map((url, idx) => (
                    <div key={idx} className={modalStyles["ref-item"]}>
                      <ReferenceImage url={url} index={idx} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={modalStyles["ref-empty"]}>{t('ui.noReference')}</div>
              )}
              <p className={modalStyles["ref-hint"]}>
                {t('ui.referenceHint')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
