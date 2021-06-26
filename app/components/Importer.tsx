import s from "../styles/Importer.module.scss";
import { useRef, useState } from "react";
import { useCallback } from "react";

const Importer: React.FC<{ onRead?: (ledger: string) => void }> = ({
  children,
  onRead,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const inputRef = useRef<HTMLInputElement>();
  const onHover = useCallback(() => setIsHovering(true), [setIsHovering]);
  const onBlur = useCallback(() => setIsHovering(false), [setIsHovering]);
  const handleUpload = useCallback(
    async (file: FileList | null) => {
      if (!file || file.length === 0) return;
      const text = await file[0].text();
      onRead?.(text);
      inputRef.current.value = null;
    },
    [onRead]
  );

  return (
    <form
      className={`${s.importer} ${isHovering ? s.isHovering : ""}`}
      onDragOver={onHover}
      onDrag={onHover}
      onDragEnter={onHover}
      onDragLeave={onBlur}
      onDragEnd={onBlur}
      onDrop={onBlur}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => handleUpload(e.target.files)}
      />
      {children}
    </form>
  );
};

export default Importer;
