import s from "../styles/Importer.module.scss";
import { useState } from "react";
import { useCallback } from "react";
import { readCsv } from "@fifo/csv-reader";
import { Ledger } from "@fifo/ledger";

const Importer: React.FC<{ onImport?: (ledger: Ledger) => void }> = ({
  children,
  onImport,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const onHover = useCallback(() => setIsHovering(true), [setIsHovering]);
  const onBlur = useCallback(() => setIsHovering(false), [setIsHovering]);
  const handleUpload = useCallback(
    async (file: FileList | null) => {
      if (!file || file.length === 0) return;
      const text = await file[0].text();
      const result = readCsv(text);
      onImport?.(result);
    },
    [onImport]
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
      <input type="file" onChange={(e) => handleUpload(e.target.files)} />
      {children}
    </form>
  );
};

export default Importer;
