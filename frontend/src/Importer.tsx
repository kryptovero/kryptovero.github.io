import React from "react";
import { Action } from "./reducer";
import "./Importer.scss";
import { useState } from "react";
import { useCallback } from "react";
import { readCsv } from "@fifo/csv-reader";
import { useHistory } from "react-router-dom";

const Importer: React.FC<{ dispatch: React.Dispatch<Action> }> = ({
  dispatch,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const history = useHistory();
  const onHover = useCallback(() => setIsHovering(true), [setIsHovering]);
  const onBlur = useCallback(() => setIsHovering(false), [setIsHovering]);
  const handleUpload = useCallback(
    async (file: FileList | null) => {
      if (!file || file.length === 0) return;
      const text = await file[0].text();
      for (const item of readCsv(text)) {
        dispatch({ action: "create", item });
      }
      history.push("/");
    },
    [dispatch, history]
  );

  return (
    <form
      className={`fileinput ${isHovering ? "hovering" : ""}`}
      onDragOver={onHover}
      onDrag={onHover}
      onDragEnter={onHover}
      onDragLeave={onBlur}
      onDragEnd={onBlur}
      onDrop={onBlur}
    >
      <input type="file" onChange={(e) => handleUpload(e.target.files)} />
    </form>
  );
};

export default Importer;
