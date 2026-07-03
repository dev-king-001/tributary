import { useEffect, useState } from "react";
import { readClient, walletClient, toStroops, XLM_SAC, SplitView } from "../lib/tributary";

export default function EscrowCard({
  wallet,
  splits,
}: {
  wallet: string | null;
  splits: SplitView[];
}) {
  const [splitId, setSplitId] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState<bigint | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function loadPending(id: string) {
    if (id === "") {
      setPending(null);
      return;
    }
    try {
      const { result } = await readClient().balance({
        id: BigInt(id),
        token: XLM_SAC,
      });
      setPending(result);
    } catch {
      setPending(null);
    }
  }

  useEffect(() => {
    loadPending(splitId);
  }, [splitId]);

  async function distribute() {
    if (!wallet) {
      setMessage("Connect your wallet first.");
      return;
    }
    if (splitId === "") {
      setMessage("Pick a split.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const client = walletClient(wallet);
      const tx = await client.distribute({
        id: BigInt(splitId),
        token: XLM_SAC,
      });
      const { result } = await tx.signAndSend();
      setMessage(
        result.isOk()
          ? `Distributed ${(Number(result.unwrap()) / 10_000_000).toLocaleString()} XLM to all recipients.`
          : "Nothing to distribute.",
      );
      await loadPending(splitId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function deposit() {
    if (!wallet) {
      setMessage("Connect your wallet first.");
      return;
    }
    if (splitId === "" || !amount) {
      setMessage("Pick a split and an amount.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const client = walletClient(wallet);
      const tx = await client.deposit({
        from: wallet,
        id: BigInt(splitId),
        token: XLM_SAC,
        amount: toStroops(amount),
      });
      const { result } = await tx.signAndSend();
      setMessage(result.isOk() ? `Deposited ${amount} XLM.` : "Deposit failed.");
      await loadPending(splitId);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Escrow</h2>
      <p className="hint">
        Park funds in a split now, pay everyone out later.
      </p>
      <div className="row">
        <select value={splitId} onChange={(e) => setSplitId(e.target.value)}>
          <option value="">Choose split</option>
          {splits.map((s) => (
            <option key={String(s.id)} value={String(s.id)}>
              #{String(s.id)} · {s.recipients.length} recipients
            </option>
          ))}
        </select>
      </div>
      {pending !== null && (
        <p className="hint">
          Pending: {(Number(pending) / 10_000_000).toLocaleString()} XLM
        </p>
      )}
      <div className="row">
        <input
          type="number"
          min="0"
          step="0.0000001"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <span className="unit">XLM</span>
      </div>
      <div className="row">
        <button disabled={busy} onClick={deposit}>
          {busy ? "Working…" : "Deposit"}
        </button>
        <button
          className="ghost"
          disabled={busy || !pending}
          onClick={distribute}
        >
          Distribute
        </button>
      </div>
      {message && <p className="note">{message}</p>}
    </section>
  );
}
