import { useCallback, useRef } from "react";
import { AppStateItem } from "./app-state";

export type SaveData = {
  version: 0;
  items: AppStateItem[];
};

export function useSave() {
  const handle = useRef<FileSystemFileHandle>();

  const onAutosave = useCallback(async (appState: AppStateItem[]) => {
    if (!handle.current) return;
    const data = { version: 0, items: appState };
    const writableStream = await handle.current.createWritable();
    await writableStream.write(JSON.stringify(data));
    await writableStream.close();
  }, []);

  const onSave = useCallback(
    async (appState: AppStateItem[]) => {
      if (!handle.current) handle.current = await getFileHandle();
      if (handle.current) {
        await onAutosave(appState);
      } else {
        fallbackDownload(appState);
      }
    },
    [onAutosave]
  );

  return [onSave, onAutosave];
}

async function getFileHandle() {
  if (!("showSaveFilePicker" in window)) return null; // Only supported at Chrome, Opera at the moment

  try {
    return await showSaveFilePicker({
      types: [
        {
          description: "kryprovero.fi save file",
          accept: { "application/kryptovero.fi": [".vero"] },
        },
      ],
    });
  } catch (e) {
    return null;
  }
}

function fallbackDownload(appState: AppStateItem[]) {
  const data: SaveData = { version: 0, items: appState };
  const file = new Blob([JSON.stringify(data)], {
    type: "application/kryptovero.fi",
  });
  const a = document.createElement("a");
  const url = URL.createObjectURL(file);
  a.href = url;
  a.download = "krypto.vero";
  a.click();
  URL.revokeObjectURL(url);
}
