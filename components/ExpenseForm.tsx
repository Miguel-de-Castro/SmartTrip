import React, { useState } from "react";
import { User, City, Expense } from "../types";
import { CURRENCIES } from "../constants";
import { parseSmartExpense } from "../services/geminiService";
import { getHistoricalRateToBRL } from "../services/exchangeRateService";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  dateKeyFromLocalDate,
  dateKeyToIsoNoonUTC,
  extractDateKey,
} from "../utils/date";

interface ExpenseFormProps {
  users: User[];
  cities: City[];
  categories: { id: string; icon: string }[];
  onAdd: (expense: any | any[]) => void;
  onClose: () => void;
  initialData?: Expense;
}

const BULK_HEADERS = [
  "description",
  "amount",
  "currencyCode",
  "payerUserId",
  "userIds",
  "cityId",
  "category",
  "date",
  "paymentDate",
  "startTime",
  "endTime",
  "startTimeZoneCountry",
  "endTimeZoneCountry",
  "endDate",
] as const;

const BULK_HEADER_HELP: Record<(typeof BULK_HEADERS)[number], string> = {
  description: "Descrição da despesa",
  amount: "Valor numérico (ex: 100.50)",
  currencyCode: "Moeda (ex: BRL, USD, EUR)",
  payerUserId: "ID do usuário que pagou",
  userIds: "IDs participantes separados por |",
  cityId: "ID da cidade",
  category: "Categoria (usa fallback se não existir)",
  date: "Data de início do evento (YYYY-MM-DD)",
  paymentDate: "Data do pagamento (YYYY-MM-DD)",
  startTime: "Hora início (HH:mm) opcional",
  endTime: "Hora fim (HH:mm) opcional",
  startTimeZoneCountry: "País/fuso do início opcional",
  endTimeZoneCountry: "País/fuso do fim opcional",
  endDate: "Data final do período (YYYY-MM-DD) opcional",
};

const DATE_KEY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (char === '"') {
      const next = line[index + 1];
      if (inQuotes && next === '"') {
        current += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const escapeCsvValue = (value: string) => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  users,
  cities,
  categories,
  onAdd,
  onClose,
  initialData,
}) => {
  const isEditing = !!initialData;
  const todayKey = dateKeyFromLocalDate(new Date());

  const [entryMode, setEntryMode] = useState<"manual" | "bulk">("manual");
  const [bulkCsv, setBulkCsv] = useState("");

  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [amount, setAmount] = useState(initialData?.amount?.toString() || "");
  const [currencyCode, setCurrencyCode] = useState(
    initialData?.currencyCode || "BRL",
  );
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    initialData?.userIds || (users.length > 0 ? [users[0].id] : []),
  );
  const [payerUserId, setPayerUserId] = useState(
    initialData?.payerUserId || initialData?.userIds?.[0] || users[0]?.id || "",
  );
  const [cityId, setCityId] = useState(
    initialData?.cityId || cities[0]?.id || "",
  );
  const [category, setCategory] = useState<string>(
    initialData?.category || categories[0]?.id || "Outros",
  );
  const [date, setDate] = useState(
    initialData?.date ? extractDateKey(initialData.date) : todayKey,
  );
  const [startTime, setStartTime] = useState(
    initialData?.startTime || initialData?.time || "",
  );
  const [endTime, setEndTime] = useState(initialData?.endTime || "");
  const [startTimeZoneCountry, setStartTimeZoneCountry] = useState(
    initialData?.startTimeZoneCountry || "",
  );
  const [endTimeZoneCountry, setEndTimeZoneCountry] = useState(
    initialData?.endTimeZoneCountry || "",
  );
  const [paymentDate, setPaymentDate] = useState(
    initialData?.paymentDate
      ? extractDateKey(initialData.paymentDate)
      : initialData?.date
        ? extractDateKey(initialData.date)
        : todayKey,
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate ? extractDateKey(initialData.endDate) : "",
  );
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [smartInput, setSmartInput] = useState("");
  const [showPeriod, setShowPeriod] = useState(!!initialData?.endDate);

  const toggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((uid) => uid !== id)
          : prev
        : [...prev, id],
    );
  };

  const handleSmartParse = async () => {
    if (!smartInput) return;
    setIsSmartLoading(true);
    const result = await parseSmartExpense(smartInput);
    if (result) {
      setDescription(result.description || "");
      setAmount(result.amount?.toString() || "");
      setCurrencyCode(result.currencyCode || "BRL");
      if (result.category) {
        const cat = categories.find((c) => c.id === result.category);
        if (cat) setCategory(cat.id);
      }
    }
    setIsSmartLoading(false);
  };

  const handleBulkFileLoad = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const content = await file.text();
    setBulkCsv(content);
  };

  const handleDownloadBulkTemplate = () => {
    const defaultPayer = users[0]?.id || "u1";
    const defaultUsers = users.slice(0, 2).map((user) => user.id);
    const participants =
      defaultUsers.length > 0 ? defaultUsers.join("|") : defaultPayer;
    const defaultCityId = cities[0]?.id || "city1";
    const defaultCategory = categories[0]?.id || "Outros";

    const sampleRow = [
      "Exemplo de gasto",
      "100.50",
      "BRL",
      defaultPayer,
      participants,
      defaultCityId,
      defaultCategory,
      todayKey,
      todayKey,
      "09:00",
      "10:00",
      "Brasil",
      "Brasil",
      "",
    ];

    const csvContent = [
      BULK_HEADERS.join(","),
      sampleRow.map(escapeCsvValue).join(","),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smarttrip-expenses-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const buildBulkExpenses = async () => {
    const lines = bulkCsv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      throw new Error(
        "CSV vazio. Inclua cabeçalho e pelo menos 1 linha de dados.",
      );
    }

    const headers = parseCsvLine(lines[0]);
    const hasValidOrder =
      headers.length === BULK_HEADERS.length &&
      BULK_HEADERS.every((header, index) => headers[index] === header);

    if (!hasValidOrder) {
      throw new Error(
        `Cabeçalho inválido. Ordem exata esperada: ${BULK_HEADERS.join(",")}`,
      );
    }

    const validUserIds = new Set(users.map((user) => user.id));
    const validCityIds = new Set(cities.map((city) => city.id));
    const validCurrencies = new Set(
      CURRENCIES.map((currency) => currency.code),
    );
    const fallbackCategory = categories[0]?.id || "Outros";

    const expensesPayload: any[] = [];

    for (let index = 1; index < lines.length; index++) {
      const lineNumber = index + 1;
      const values = parseCsvLine(lines[index]);
      if (values.length !== BULK_HEADERS.length) {
        throw new Error(
          `Linha ${lineNumber}: quantidade de colunas inválida. Esperado ${BULK_HEADERS.length}.`,
        );
      }

      const row = BULK_HEADERS.reduce<Record<string, string>>(
        (acc, header, valueIndex) => {
          acc[header] = values[valueIndex] || "";
          return acc;
        },
        {},
      );

      if (!row.description) {
        throw new Error(`Linha ${lineNumber}: description é obrigatório.`);
      }

      const numericAmount = Number(row.amount);
      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        throw new Error(`Linha ${lineNumber}: amount inválido.`);
      }

      if (!validCurrencies.has(row.currencyCode)) {
        throw new Error(
          `Linha ${lineNumber}: currencyCode inválido (${row.currencyCode}).`,
        );
      }

      if (!validUserIds.has(row.payerUserId)) {
        throw new Error(
          `Linha ${lineNumber}: payerUserId inválido (${row.payerUserId}).`,
        );
      }

      if (!validCityIds.has(row.cityId)) {
        throw new Error(
          `Linha ${lineNumber}: cityId inválido (${row.cityId}).`,
        );
      }

      if (!DATE_KEY_REGEX.test(row.date)) {
        throw new Error(`Linha ${lineNumber}: date deve estar em YYYY-MM-DD.`);
      }

      if (!DATE_KEY_REGEX.test(row.paymentDate)) {
        throw new Error(
          `Linha ${lineNumber}: paymentDate deve estar em YYYY-MM-DD.`,
        );
      }

      if (row.endDate && !DATE_KEY_REGEX.test(row.endDate)) {
        throw new Error(
          `Linha ${lineNumber}: endDate deve estar em YYYY-MM-DD.`,
        );
      }

      const participantsRaw = row.userIds
        .split("|")
        .map((id) => id.trim())
        .filter(Boolean);

      if (participantsRaw.length === 0) {
        throw new Error(
          `Linha ${lineNumber}: userIds precisa ter ao menos 1 usuário.`,
        );
      }

      const invalidParticipant = participantsRaw.find(
        (id) => !validUserIds.has(id),
      );
      if (invalidParticipant) {
        throw new Error(
          `Linha ${lineNumber}: userIds contém usuário inválido (${invalidParticipant}).`,
        );
      }

      const participants = participantsRaw.includes(row.payerUserId)
        ? participantsRaw
        : [row.payerUserId, ...participantsRaw];

      const selectedCategory = categories.some((cat) => cat.id === row.category)
        ? row.category
        : fallbackCategory;

      const { rate } = await getHistoricalRateToBRL(
        row.currencyCode,
        row.paymentDate,
      );

      expensesPayload.push({
        description: row.description,
        amount: numericAmount,
        currencyCode: row.currencyCode,
        convertedAmountBRL: numericAmount * rate,
        exchangeRateToBRL: rate,
        payerUserId: row.payerUserId,
        userIds: participants,
        settledUserIds: [],
        cityId: row.cityId,
        category: selectedCategory,
        date: dateKeyToIsoNoonUTC(row.date),
        paymentDate: dateKeyToIsoNoonUTC(row.paymentDate),
        time: row.startTime || undefined,
        startTime: row.startTime || undefined,
        endTime: row.endTime || undefined,
        startTimeZoneCountry: row.startTimeZoneCountry || undefined,
        endTimeZoneCountry: row.endTimeZoneCountry || undefined,
        endDate: row.endDate ? dateKeyToIsoNoonUTC(row.endDate) : undefined,
      });
    }

    return expensesPayload;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsSaving(true);

    try {
      if (!isEditing && entryMode === "bulk") {
        const expensesPayload = await buildBulkExpenses();
        onAdd(expensesPayload);
        onClose();
        return;
      }

      if (
        !description ||
        !amount ||
        selectedUserIds.length === 0 ||
        !cityId ||
        !payerUserId
      ) {
        setIsSaving(false);
        return;
      }

      const numericAmount = parseFloat(amount);
      const { rate } = await getHistoricalRateToBRL(currencyCode, paymentDate);
      const participants = selectedUserIds.includes(payerUserId)
        ? selectedUserIds
        : [payerUserId, ...selectedUserIds];

      onAdd({
        description,
        amount: numericAmount,
        currencyCode,
        convertedAmountBRL: numericAmount * rate,
        exchangeRateToBRL: rate,
        payerUserId,
        userIds: participants,
        settledUserIds:
          initialData?.id && initialData.payerUserId === payerUserId
            ? initialData.settledUserIds || []
            : [],
        cityId,
        category,
        date: dateKeyToIsoNoonUTC(date),
        time: startTime || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        startTimeZoneCountry: startTimeZoneCountry.trim() || undefined,
        endTimeZoneCountry: endTimeZoneCountry.trim() || undefined,
        paymentDate: dateKeyToIsoNoonUTC(paymentDate),
        endDate: endDate ? dateKeyToIsoNoonUTC(endDate) : undefined,
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Não foi possível processar os dados informados.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const bulkHeaderOrderText = BULK_HEADERS.join(",");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
          <h2 className="text-xl font-black tracking-tighter">
            {isEditing ? "Editar Gasto" : "Novo Gasto"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            icon="fa-xmark"
            className="rounded-full w-8 h-8 p-0"
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[85vh] overflow-y-auto"
        >
          {!isEditing && (
            <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700/50 p-2 rounded-2xl grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEntryMode("manual")}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  entryMode === "manual"
                    ? "bg-brand-500 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-500"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setEntryMode("bulk")}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                  entryMode === "bulk"
                    ? "bg-brand-500 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-500"
                }`}
              >
                Bulk CSV
              </button>
            </div>
          )}

          {!isEditing && entryMode === "bulk" ? (
            <div className="space-y-4">
              <div className="bg-brand-500/5 border border-brand-500/10 p-4 rounded-3xl space-y-3">
                <p className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-widest">
                  Headers exatos e ordem obrigatória
                </p>
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300 break-all">
                  {bulkHeaderOrderText}
                </p>
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    Significado dos campos (ordem)
                  </p>
                  <ol className="space-y-1.5">
                    {BULK_HEADERS.map((header, index) => (
                      <li
                        key={header}
                        className="text-[10px] text-slate-600 dark:text-slate-300"
                      >
                        <span className="font-black text-brand-500 mr-1">
                          {index + 1}.
                        </span>
                        <span className="font-black">{header}</span> —{" "}
                        {BULK_HEADER_HELP[header]}
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  date = início do período • endDate = fim do período
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  userIds deve usar IDs separados por | (ex: u1|u2|u3)
                </p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Datas em YYYY-MM-DD; colunas opcionais podem ficar vazias, mas
                  devem existir.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Arquivo CSV
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleBulkFileLoad}
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleDownloadBulkTemplate}
                    icon="fa-download"
                    className="shrink-0"
                  >
                    Baixar CSV modelo
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Conteúdo CSV
                </label>
                <textarea
                  value={bulkCsv}
                  onChange={(e) => setBulkCsv(e.target.value)}
                  placeholder="Cole aqui o CSV completo começando pelo header obrigatório acima."
                  rows={10}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-xs focus:ring-2 ring-brand-500/10 outline-none transition-all"
                />
              </div>
            </div>
          ) : (
            <>
              {!isEditing && (
                <div className="bg-brand-500/5 border border-brand-500/10 p-4 rounded-3xl space-y-3">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-brand-500 text-[10px]"></i>
                    <label className="text-[9px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">
                      IA Smart Input
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ex: Aluguel do carro 200 EUR dividido por todos"
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-2 ring-brand-500/10 outline-none transition-all"
                      value={smartInput}
                      onChange={(e) => setSmartInput(e.target.value)}
                    />
                    <Button
                      type="button"
                      size="sm"
                      isLoading={isSmartLoading}
                      onClick={handleSmartParse}
                      icon="fa-bolt"
                      className="rounded-xl px-4"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Ex: Hotel ou Almoço"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Quem pagou?
                  </label>
                  <Input
                    isSelect
                    value={payerUserId}
                    onChange={(e) => setPayerUserId(e.target.value)}
                    required
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Input>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Dividido com quem?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                          selectedUserIds.includes(u.id)
                            ? "border-brand-500 bg-brand-500/5 text-brand-600"
                            : "border-slate-100 dark:border-slate-800 text-slate-400"
                        }`}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: u.color }}
                        ></div>
                        <span className="text-[10px] font-black uppercase tracking-tight truncate">
                          {u.name}
                        </span>
                        {selectedUserIds.includes(u.id) && (
                          <i className="fa-solid fa-circle-check text-[10px] ml-auto"></i>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label="Valor Total"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <Input
                  label="Moeda"
                  isSelect
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol})
                    </option>
                  ))}
                </Input>

                <Input
                  label="Data do Pagamento"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
                <div className="flex items-end pb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Conversão BRL usa cotação da data de pagamento.
                  </p>
                </div>

                <div className="col-span-2">
                  <Input
                    label="Local da Despesa"
                    isSelect
                    value={cityId}
                    onChange={(e) => setCityId(e.target.value)}
                  >
                    {cities.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Input>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Data ou Período
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPeriod(!showPeriod)}
                      className={`text-[9px] font-black uppercase tracking-widest ${showPeriod ? "text-brand-600" : "text-slate-400"}`}
                    >
                      {showPeriod
                        ? "Usar data única"
                        : "+ Adicionar fim (período)"}
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    {showPeriod && (
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        placeholder="Até..."
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-2">
                      Horários do Evento (Opcional)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Início"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                      <Input
                        label="Fim"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      <Input
                        label="País/Fuso do Início"
                        isSelect
                        value={startTimeZoneCountry}
                        onChange={(e) =>
                          setStartTimeZoneCountry(e.target.value)
                        }
                      >
                        <option value="">Selecione...</option>
                        {cities.map((c) => (
                          <option key={`start-tz-${c.id}`} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </Input>
                      <Input
                        label="País/Fuso do Fim"
                        isSelect
                        value={endTimeZoneCountry}
                        onChange={(e) => setEndTimeZoneCountry(e.target.value)}
                      >
                        <option value="">Selecione...</option>
                        {cities.map((c) => (
                          <option key={`end-tz-${c.id}`} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </Input>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
                    Categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all ${
                          category === cat.id
                            ? "border-brand-500 bg-brand-500/10 text-brand-600"
                            : "border-slate-100 dark:border-slate-800 text-slate-400 dark:hover:border-slate-700"
                        }`}
                      >
                        <i className={`fa-solid ${cat.icon} text-[10px]`}></i>
                        <span className="text-[9px] font-black uppercase tracking-wider">
                          {cat.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={onClose}
              type="button"
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="md"
              className="flex-1"
              type="submit"
              isLoading={isSaving}
            >
              {isEditing
                ? "Salvar Alterações"
                : entryMode === "bulk"
                  ? "Importar CSV"
                  : "Confirmar"}
            </Button>
          </div>
          {submitError && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
              {submitError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
