"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Plus,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Settings,
  Trash2,
  FileIcon,
  ExternalLink,
} from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";

const COLUMN_TYPES = [
  { value: "TEXT", label: "文本" },
  { value: "NUMBER", label: "数字" },
  { value: "DATE", label: "日期" },
  { value: "DROPDOWN", label: "下拉选项" },
  { value: "FILE", label: "文件" },
  { value: "BARCODE", label: "条形码" },
  { value: "URL", label: "链接" },
];

function CustomCellValue({ column, value }: { column: any; value: any }) {
  if (value == null || value === "")
    return <span className="text-gray-400">—</span>;

  switch (column.type) {
    case "NUMBER":
      return (
        <span className="block text-right tabular-nums text-gray-900">
          {value}
        </span>
      );
    case "DATE":
      return (
        <span className="text-gray-600">
          {new Date(value).toLocaleDateString("zh-CN")}
        </span>
      );
    case "DROPDOWN": {
      const opts: string[] = column.options?.choices ?? [];
      const matched = opts.includes(value);
      return (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            matched ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
          }`}
        >
          {value}
        </span>
      );
    }
    case "URL":
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
        >
          <ExternalLink className="h-3 w-3" />
          {value}
        </a>
      );
    case "BARCODE":
      return <span className="font-mono text-xs text-gray-700">{value}</span>;
    case "FILE":
      return (
        <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
          <FileIcon className="h-3.5 w-3.5" />
          {value}
        </span>
      );
    default:
      return <span className="text-gray-700">{value}</span>;
  }
}

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>("");
  const [adjustItem, setAdjustItem] = useState<any>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustAction, setAdjustAction] = useState<"ADD" | "REMOVE">("ADD");
  const [adjustReason, setAdjustReason] = useState("");
  const [showColumnManager, setShowColumnManager] = useState(false);

  // New column form state
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("TEXT");
  const [newColRequired, setNewColRequired] = useState(false);
  const [newColChoices, setNewColChoices] = useState(""); // for DROPDOWN

  const queryClient = useQueryClient();

  // Fetch user's first team
  const { data: teams } = useQuery({
    queryKey: ["teams"],
    queryFn: () => api.getTeams(),
  });

  const teamId: string | undefined = teams?.[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", page, category],
    queryFn: () => api.getInventory(page, category || undefined),
  });

  const { data: customColumns = [] } = useQuery({
    queryKey: ["inventory-columns", teamId],
    queryFn: () => api.getInventoryColumns(teamId!),
    enabled: !!teamId,
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      api.adjustInventory(adjustItem.id, {
        action: adjustAction,
        amount: Number(adjustAmount),
        reason: adjustReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      setAdjustItem(null);
      setAdjustAmount("");
      setAdjustReason("");
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: () => {
      const options =
        newColType === "DROPDOWN"
          ? {
              choices: newColChoices
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean),
            }
          : undefined;
      return api.createInventoryColumn({
        teamId: teamId!,
        name: newColName,
        type: newColType,
        options,
        isRequired: newColRequired,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-columns"] });
      setNewColName("");
      setNewColType("TEXT");
      setNewColRequired(false);
      setNewColChoices("");
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (id: string) => api.deleteInventoryColumn(id, teamId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-columns"] });
    },
  });

  const lowStockCount =
    data?.data?.filter(
      (item: any) =>
        item.minQuantity != null && item.quantity <= item.minQuantity,
    ).length || 0;

  const totalColspan = 8 + customColumns.length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">库存管理</h1>
          <p className="mt-1 text-sm text-gray-600">管理试剂、耗材和设备库存</p>
        </div>
        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              {lowStockCount} 项低库存预警
            </div>
          )}
          {teamId && (
            <button
              onClick={() => setShowColumnManager(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4" />
              管理列
            </button>
          )}
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4" />
            添加库存
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner fullPage />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">物品</th>
                <th className="px-4 py-3">类别</th>
                <th className="px-4 py-3">当前数量</th>
                <th className="px-4 py-3">最低库存</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">供应商</th>
                <th className="px-4 py-3">到期日</th>
                {customColumns.map((col: any) => (
                  <th key={col.id} className="px-4 py-3">
                    {col.name}
                    {col.isRequired && (
                      <span className="ml-0.5 text-red-500">*</span>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map((item: any) => {
                const isLow =
                  item.minQuantity != null && item.quantity <= item.minQuantity;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${isLow ? "bg-red-50/30" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 flex items-center gap-1.5">
                        {isLow && (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                        )}
                        {item.name}
                      </div>
                      {item.sku && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {item.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.category || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${isLow ? "text-red-600" : "text-gray-900"}`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.minQuantity != null
                        ? `${item.minQuantity} ${item.unit}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          <AlertTriangle className="h-3 w-3" />
                          低库存
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          充足
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.supplier || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.expiryDate
                        ? new Date(item.expiryDate).toLocaleDateString("zh-CN")
                        : "—"}
                    </td>
                    {customColumns.map((col: any) => (
                      <td key={col.id} className="px-4 py-3">
                        <CustomCellValue
                          column={col}
                          value={item.metadata?.[col.name]}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setAdjustItem(item)}
                        className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        调整库存
                      </button>
                    </td>
                  </tr>
                );
              }) || (
                <tr>
                  <td
                    colSpan={totalColspan}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    暂无库存记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      <Modal
        open={!!adjustItem}
        onClose={() => {
          setAdjustItem(null);
          setAdjustAmount("");
          setAdjustReason("");
        }}
        title={`调整库存 — ${adjustItem?.name}`}
      >
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-500 mb-3">
              当前库存:{" "}
              <span className="font-semibold text-slate-900">
                {adjustItem?.quantity} {adjustItem?.unit}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => setAdjustAction("ADD")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  adjustAction === "ADD"
                    ? "bg-green-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                入库
              </button>
              <button
                onClick={() => setAdjustAction("REMOVE")}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                  adjustAction === "REMOVE"
                    ? "bg-red-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                出库
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              数量 ({adjustItem?.unit})
            </label>
            <input
              type="number"
              min="0.01"
              step="any"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="输入数量"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              原因（可选）
            </label>
            <input
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="填写原因..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setAdjustItem(null);
                setAdjustAmount("");
                setAdjustReason("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={() => adjustAmount && adjustMutation.mutate()}
              disabled={
                !adjustAmount ||
                Number(adjustAmount) <= 0 ||
                adjustMutation.isPending
              }
              className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50 ${
                adjustAction === "ADD"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {adjustMutation.isPending
                ? "处理中..."
                : adjustAction === "ADD"
                  ? "确认入库"
                  : "确认出库"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Column Manager Modal */}
      <Modal
        open={showColumnManager}
        onClose={() => setShowColumnManager(false)}
        title="管理自定义列"
      >
        <div className="space-y-5">
          {/* Existing columns */}
          {customColumns.length > 0 ? (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                当前自定义列
              </h3>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                {customColumns.map((col: any) => (
                  <li
                    key={col.id}
                    className="flex items-center justify-between px-3 py-2 bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 text-sm">
                        {col.name}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                        {COLUMN_TYPES.find((t) => t.value === col.type)
                          ?.label ?? col.type}
                      </span>
                      {col.isRequired && (
                        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                          必填
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteColumnMutation.mutate(col.id)}
                      disabled={deleteColumnMutation.isPending}
                      className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="删除列"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">暂无自定义列</p>
          )}

          {/* Add new column form */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">添加新列</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  列名
                </label>
                <input
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="例如：批号、存放位置..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  类型
                </label>
                <select
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  {COLUMN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              {newColType === "DROPDOWN" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    选项（逗号分隔）
                  </label>
                  <input
                    value={newColChoices}
                    onChange={(e) => setNewColChoices(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="选项A, 选项B, 选项C"
                  />
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  id="col-required"
                  type="checkbox"
                  checked={newColRequired}
                  onChange={(e) => setNewColRequired(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="col-required" className="text-sm text-gray-700">
                  必填字段
                </label>
              </div>
              <button
                onClick={() =>
                  newColName.trim() && createColumnMutation.mutate()
                }
                disabled={
                  !newColName.trim() ||
                  !teamId ||
                  createColumnMutation.isPending
                }
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createColumnMutation.isPending ? "添加中..." : "添加列"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
