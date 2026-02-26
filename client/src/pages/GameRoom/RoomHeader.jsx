import { useRef, useState, useEffect, useCallback } from "react";
import { Share2, LogOut, Ellipsis, CircleHelp } from "lucide-react";
import { encryptRoomId } from "../../utils/crypto";
import GameTimer from "../../components/GameTimer";
import styles from "../../room.module.scss";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function RoomHeader({ 
  roomId, 
  gameStarted, 
  playersCount, 
  roundEndsAt, 
  onShowRules, 
  onLeaveRoom,
  setToast
}) {
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const headerMenuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (!headerMenuRef.current) return;
      if (!headerMenuRef.current.contains(event.target)) {
        setShowHeaderMenu(false);
      }
    }
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  const handleShareLink = useCallback(() => {
    const hash = encryptRoomId(roomId);
    const url = `${window.location.origin}${import.meta.env.BASE_URL}share/${hash}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
      }).catch((err) => {
        console.error("Clipboard write failed", err);
        setToast({ title: "复制失败", message: "请手动复制链接: " + url });
      });
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand("copy");
      if (successful) {
        setToast({ title: "链接已复制", message: "快去邀请好友加入游戏吧！" });
      } else {
        setToast({ title: "复制失败", message: "请手动复制链接: " + url });
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
      setToast({ title: "复制失败", message: "请手动复制链接: " + url });
    }

    document.body.removeChild(textArea);
  }, [roomId, setToast]);

  return (
    <>
      <div className={styles["room-header"]}>
        <h2>
          房间：{roomId}
          {!gameStarted && <span className={styles["room-status"]}>等待开始</span>}
        </h2>
        <div className={styles["header-actions"]} ref={headerMenuRef}>
          <button
            className={cx(styles["header-menu-trigger"], showHeaderMenu && styles.active)}
            onClick={() => setShowHeaderMenu((prev) => !prev)}
            title="房间功能"
            aria-label="房间功能"
            aria-expanded={showHeaderMenu}
          >
            <Ellipsis size={18} />
          </button>
          {showHeaderMenu && (
            <div className={styles["header-menu-panel"]}>
              <button
                className={styles["header-menu-item"]}
                onClick={() => {
                  handleShareLink();
                  setShowHeaderMenu(false);
                }}
              >
                <Share2 size={16} />
                <span>分享房间</span>
              </button>
              <button
                className={styles["header-menu-item"]}
                onClick={() => {
                  onShowRules();
                  setShowHeaderMenu(false);
                }}
              >
                <CircleHelp size={16} />
                <span>游戏规则</span>
              </button>
              <button
                className={cx(styles["header-menu-item"], styles["header-menu-item-danger"])}
                onClick={() => {
                  setShowHeaderMenu(false);
                  onLeaveRoom();
                }}
              >
                <LogOut size={16} />
                <span>退出房间</span>
              </button>
            </div>
          )}
        </div>
      </div>
      <div className={styles["status-row"]}>
        <span>玩家：{playersCount}</span>
        <GameTimer roundEndsAt={roundEndsAt} />
      </div>
    </>
  );
}
