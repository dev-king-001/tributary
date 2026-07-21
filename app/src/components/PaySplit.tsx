import { useEffect, useState } from "react";
import {
  walletClient,
  toStroops,
  fromStroops,
  previewPayout,
  recipientLabel,
  TOKENS,
  SplitView,
} from "../lib/tributary";
import { useTranslation } from "../lib/i18n";
import TokenPicker from "./TokenPicker";
import Tooltip from "./Tooltip";

export default function PaySplit({
  wallet,
  splits,
  selectedSplitId,
  onPaid,
}: {
  wallet: string | null;
  splits: SplitView[];
  selectedSplitId?: string;
  onPaid: () => void;
}) {
  const { t } = useTranslation();
  const [splitId, setSplitId] = useState("");
  const [amount, setAmount] = useState("");
  const [token, setToken] = useState(TOKENS[0]);
  const [preview, setPreview] = useState<bigint[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const selected = splits.find((s) => String(s.id) === splitId);
  useEffect(() => {
    if (selectedSplitId !== undefined) {
      setSplitId(selectedSplitId);
    }
  }, [selectedSplitId]);

  // Preview payout amounts whenever split or amount changes
  useEffect(() => {
    let active = true;
    setAmountError(null);
    if (splitId === "" || !amount || parseFloat(amount) <= 0) {
      setPreview([]);
      return;
    }
    try {
      const stroops = toStroops(amount, token.decimals);
      previewPayout(BigInt(splitId), stroops).then((parts) => {
        if (active) setPreview(parts);
      });
    } catch (e) {
      if (active) {
        setPreview([]);
        setAmountError(e instanceof Error ? e.message : String(e));
      }
    }
    return () => {
      active = false;
    };
  }, [splitId, amount, token.decimals]);

  async function submit() {
    if (!wallet) {
      setMessage(t("connectWalletFirst"));
      return;
    }
    if (splitId === "" || !amount) {
      setMessage(t("pickSplitAndAmount"));
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const client = walletClient(wallet);
      const tx = await client.pay({
        from: wallet,
        id: BigInt(splitId),
        token: token.contract,
        amount: toStroops(amount, token.decimals),
      });
      const { result } = await tx.signAndSend();
      setMessage(
        result.isOk()
          ? t("paySuccess", { amount, token: token.code, id: splitId })
          : t("payFailed"),
      );
      onPaid();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card">
      <h2>{t("payTitle")}</h2>
      <div className="row">
        <select value={splitId} onChange={(e) => setSplitId(e.target.value)}>
          <option value="">{t("chooseSplit")}</option>
          {splits.map((s) => (
            <option key={String(s.id)} value={String(s.id)}>
              #{String(s.id)} · {t("recipientsCount", { count: s.recipients.length })}
            </option>
          ))}
        </select>
      </div>
      <div className="row">
        <input
          type="number"
          min="0"
          step={1 / 10 ** token.decimals}
          placeholder={t("amount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <TokenPicker token={token} onChange={setToken} />
      </div>
      {amountError && <p className="note">{amountError}</p>}
      {selected && preview.length === selected.recipients.length && (
        <div className="preview">
          <div className="preview-heading">
            <span>{t("payoutPreview")}</span>
            <Tooltip label="dust">{t("dustExplainer")}</Tooltip>
          </div>
          <ul>
            {selected.recipients.map((r, i) => (
              <li key={i}>
                <span>{recipientLabel(r)}</span>
                <span>
                  {fromStroops(preview[i], token.decimals)} {token.code}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button disabled={busy || !!amountError} onClick={submit}>
        {busy ? t("waitingForSignature") : t("payButton")}
      </button>
      {message && <p className="note">{message}</p>}
    </section>
  );
}