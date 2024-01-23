import { ComputedLedger, ComputedLedgerItem } from "@fifo/ledger";
import { TaxComputedLedgerItem } from "@fifo/ledger/build/to-computed-ledger";
import getYear from "date-fns/getYear";

export async function printYearTappiolliset(
  year: number,
  ledger: ComputedLedgerItem[],
  consumed: ComputedLedger["consumed"]
) {
  const handle = await showSaveFilePicker({
    suggestedName: `tappiolliset-${year}.txt`,
    types: [
      { description: "HTML file", accept: { "text/html": [".txt", ".txt"] } },
    ],
  });
  const filestream = await handle.createWritable();
  const writer = await filestream.getWriter();

  await writer.write(`Ohje:
Taulukossa on yhdessä solussa yksi ostotapahtuma.
Mikäli ostotapahtumaan liittyy aiempia ostotapahtumia, on aiemmat tapahtumat merkitty samaan soluun └─ etuliitteellä.
Voitolliset ja tappiolliset tapahtumat on eroteltu omiin tiedostoihinsa.\n\n\n`);
  await writer.write("# Tappiolliset:\n\n");
  await writer.write(
    table(
      ledger.filter(
        (item) => getYear(item.timestamp) === year && item.taxableGain < 0
      ),
      consumed
    )
  );

  await writer.close();
}

export async function printYearVoitolliset(
  year: number,
  ledger: ComputedLedgerItem[],
  consumed: ComputedLedger["consumed"]
) {
  const handle = await showSaveFilePicker({
    suggestedName: `voitolliset-${year}.txt`,

    types: [
      { description: "HTML file", accept: { "text/html": [".txt", ".txt"] } },
    ],
  });
  const filestream = await handle.createWritable();
  const writer = await filestream.getWriter();

  await writer.write(`Ohje:
Taulukossa on yhdessä solussa yksi ostotapahtuma.
Mikäli ostotapahtumaan liittyy aiempia ostotapahtumia, on aiemmat tapahtumat merkitty samaan soluun └─ etuliitteellä.
Voitolliset ja tappiolliset tapahtumat on eroteltu omiin tiedostoihinsa.\n\n\n`);
  await writer.write(`# Voitolliset:\n\n`);
  await writer.write(
    table(
      ledger.filter(
        (item) => getYear(item.timestamp) === year && item.taxableGain >= 0
      ),
      consumed
    )
  );
  await writer.write("\n\n");
  await writer.close();
}

const rowLengths = [30, 30, 30, 14, 16];

function row(...items: string[]) {
  let result = "│ ";
  for (let i = 0; i < rowLengths.length; i++) {
    result += (items[i] ?? "").padEnd(rowLengths[i], " ");
    if (i < items.length - 1) {
      result += " │ ";
    }
  }
  result += " │\n";
  return result;
}

function headerRow(...items: string[]) {
  return row(...items) + emptyRow();
}

function emptyRow() {
  return (
    "├─" + rowLengths.map((length) => "─".repeat(length)).join("─┼─") + "─┤\n"
  );
}

function table(
  items: ComputedLedgerItem[],
  consumed: ComputedLedger["consumed"]
) {
  return (
    headerRow(
      "Milloin",
      "Mistä",
      "Mihin",
      "Välityspalkkio",
      "Verotettava tulo"
    ) +
    items
      .map((item) => itemRow(item, consumed[item.id] ?? []) + emptyRow())
      .join("")
  );
}

function itemRow(
  item: TaxComputedLedgerItem,
  consumed: TaxComputedLedgerItem[],
  prefix: string = ""
): string {
  const cols = row(
    prefix + new Date(item.timestamp).toLocaleString("fi"),

    `${item.from.amount.toLocaleString("fi")} ${item.from.symbol}${
      item.from.symbol !== "EUR" && item.from.unitPriceEur !== undefined
        ? ` (${item.from.unitPriceEur.toLocaleString("fi")} EUR/kpl)`
        : ""
    }`,
    `${item.to.amount.toLocaleString("fi")} ${item.to.symbol}${
      item.to.symbol !== "EUR" && item.to.unitPriceEur !== undefined
        ? ` (${item.to.unitPriceEur.toLocaleString("fi")} EUR/kpl)`
        : ""
    }`,
    `${item.fee?.amount.toLocaleString("fi") ?? 0} ${
      item.fee?.symbol ?? "EUR"
    }`,
    `${item.taxableGain.toLocaleString("fi", {
      maximumFractionDigits: 2,
    })} EUR`
  );

  const extraRows =
    consumed.length === 0
      ? ""
      : consumed
          .map((item, i, { length }) =>
            itemRow(item, [], i === length - 1 ? " └─ " : " ├─ ")
          )
          .join("");

  return cols + extraRows;
}
