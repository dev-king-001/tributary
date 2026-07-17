type T = (key: string, args?: Record<string, unknown>) => string;

const en: Record<string, string | ((args: Record<string, unknown>) => string)> = {
  manageTitle: "Manage your splits",
  chooseSplitControl: "Choose split you control",
  recipientsCount: (args: Record<string, unknown>) =>
    `${args.count} recipient${args.count === 1 ? "" : "s"}`,
  updateSuccess: "Split updated.",
  updateFailed: "Update rejected.",
  controllerFormatError: "Controller must be a G… account key.",
  transferSuccess: "Control transferred.",
  transferFailed: "Transfer rejected.",
  lockConfirmPrompt: "Locking is permanent. Press again to confirm.",
  lockSuccess: "Split locked forever.",
  lockFailed: "Lock rejected.",
  updateButton: "Update split",
  placeholderController: "G… new controller",
  transferButton: "Transfer",
  confirmLockButton: "Confirm lock",
  lockButton: "Lock forever",
  shareTotalError: "Shares must add up to 100%.",
  emptyRecipientError: "Every recipient needs an address or split id.",
  invalidAddressError: "Recipient addresses must be G… account keys.",
};

export function useTranslation(): { t: T } {
  return {
    t: (key, args) => {
      const value = en[key];
      if (typeof value === "function") return value(args ?? {}) as string;
      return (value as string) ?? key;
    },
  };
}
