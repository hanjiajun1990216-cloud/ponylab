"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function InventoryPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>("");

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", page, category],
    queryFn: () => api.getInventory(page, category || undefined),
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage reagents, consumables, and equipment
          </p>
        </div>
        <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
          + Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Min. Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data?.map((item: any) => {
                const isLow =
                  item.minQuantity != null && item.quantity <= item.minQuantity;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {item.name}
                      </div>
                      {item.sku && (
                        <div className="text-xs text-gray-500 font-mono">
                          {item.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${isLow ? "text-red-600" : "text-gray-900"}`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.minQuantity != null ? `${item.minQuantity} ${item.unit}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isLow ? (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {item.supplier || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {item.expiryDate
                        ? new Date(item.expiryDate).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                );
              }) || (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No inventory items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
