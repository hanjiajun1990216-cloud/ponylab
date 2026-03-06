"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Badge } from "@/components/Badge";
import { Avatar } from "@/components/Avatar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Modal } from "@/components/Modal";
import { QRCodeDisplay } from "@/components/QRCodeDisplay";
import {
  ArrowLeft,
  AlertCircle,
  FlaskConical,
  MapPin,
  Barcode,
  User,
  Calendar,
  LogOut,
  LogIn,
  Beaker,
  Trash2,
  Package,
  StickyNote,
  FileText,
  ClipboardList,
  Settings,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type SampleStatus = "AVAILABLE" | "IN_USE" | "CONSUMED" | "DISPOSED" | "LOST";
type EventType =
  | "CREATED"
  | "CHECKED_OUT"
  | "CHECKED_IN"
  | "CONSUMED"
  | "DISPOSED"
  | "MOVED"
  | "SPLIT"
  | "NOTE";
type TabKey = "events" | "metadata" | "actions";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SampleStatus, string> = {
  AVAILABLE: "Available",
  IN_USE: "In Use",
  CONSUMED: "Consumed",
  DISPOSED: "Disposed",
  LOST: "Lost",
};

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  CREATED: <span className="text-base">🆕</span>,
  CHECKED_OUT: <span className="text-base">📤</span>,
  CHECKED_IN: <span className="text-base">📥</span>,
  CONSUMED: <span className="text-base">⚗️</span>,
  DISPOSED: <span className="text-base">🗑️</span>,
  MOVED: <span className="text-base">📦</span>,
  SPLIT: <span className="text-base">✂️</span>,
  NOTE: <span className="text-base">📝</span>,
};

const EVENT_LABELS: Record<EventType, string> = {
  CREATED: "Created",
  CHECKED_OUT: "Checked Out",
  CHECKED_IN: "Checked In",
  CONSUMED: "Consumed",
  DISPOSED: "Disposed",
  MOVED: "Moved",
  SPLIT: "Split",
  NOTE: "Note",
};

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "events",
    label: "Events",
    icon: <ClipboardList className="h-4 w-4" />,
  },
  {
    key: "metadata",
    label: "Metadata",
    icon: <FileText className="h-4 w-4" />,
  },
  { key: "actions", label: "Actions", icon: <Settings className="h-4 w-4" /> },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function EventsTab({ sampleId }: { sampleId: string }) {
  const { data: sample } = useQuery({
    queryKey: ["sample", sampleId],
    queryFn: () => api.getSample(sampleId),
  });

  const events: any[] = sample?.events || [];

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ClipboardList className="mb-3 h-10 w-10" />
        <p className="text-sm">No events recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {events.map((event: any, index: number) => (
        <div key={event.id} className="flex gap-4">
          {/* Timeline line + icon */}
          <div className="flex flex-col items-center">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm">
              {EVENT_ICONS[event.type as EventType] || (
                <FlaskConical className="h-4 w-4 text-gray-400" />
              )}
            </div>
            {index < events.length - 1 && (
              <div
                className="mt-1 w-0.5 flex-1 bg-gray-200"
                style={{ minHeight: 20 }}
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-slate-900 text-sm">
                {EVENT_LABELS[event.type as EventType] || event.type}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(event.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {event.user && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <User className="h-3 w-3" />
                  {event.user.firstName} {event.user.lastName}
                </span>
              )}
            </div>
            {event.note && (
              <p className="mt-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600 border border-gray-100">
                {event.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetadataTab({ sampleId }: { sampleId: string }) {
  const { data: sample } = useQuery({
    queryKey: ["sample", sampleId],
    queryFn: () => api.getSample(sampleId),
  });

  const metadata = sample?.metadata;

  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText className="mb-3 h-10 w-10" />
        <p className="text-sm">No metadata available</p>
      </div>
    );
  }

  const entries = Object.entries(metadata);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500 w-1/3">
              Key
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium uppercase text-gray-500">
              Value
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {entries.map(([key, value]) => (
            <tr key={key}>
              <td className="px-4 py-2.5 font-mono text-xs font-medium text-slate-700">
                {key}
              </td>
              <td className="px-4 py-2.5 font-mono text-xs text-gray-600">
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionsTab({
  sampleId,
  currentStatus,
}: {
  sampleId: string;
  currentStatus: string;
}) {
  const queryClient = useQueryClient();
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sample", sampleId] });
    queryClient.invalidateQueries({ queryKey: ["samples"] });
  };

  const eventMutation = useMutation({
    mutationFn: (data: { type: string; note?: string }) =>
      api.addSampleEvent(sampleId, data),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.updateSampleStatus(sampleId, status),
    onSuccess: invalidate,
  });

  const isBusy = eventMutation.isPending || statusMutation.isPending;
  const isTerminal =
    currentStatus === "CONSUMED" || currentStatus === "DISPOSED";

  const handleCheckOut = () => {
    eventMutation.mutate({ type: "CHECKED_OUT" });
  };

  const handleCheckIn = () => {
    eventMutation.mutate({ type: "CHECKED_IN" });
    if (currentStatus === "IN_USE") {
      statusMutation.mutate("AVAILABLE");
    }
  };

  const handleConsume = () => {
    eventMutation.mutate({ type: "CONSUMED" });
    statusMutation.mutate("CONSUMED");
  };

  const handleDispose = () => {
    eventMutation.mutate({ type: "DISPOSED" });
    statusMutation.mutate("DISPOSED");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    eventMutation.mutate(
      { type: "NOTE", note: noteText.trim() },
      {
        onSuccess: () => {
          setNoteText("");
          setShowNoteModal(false);
        },
      },
    );
  };

  return (
    <div className="space-y-3">
      {isTerminal && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          This sample has been {currentStatus.toLowerCase()} and cannot be
          modified further.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Check Out */}
        <button
          onClick={handleCheckOut}
          disabled={isBusy || isTerminal}
          className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-left text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Check Out</p>
            <p className="text-xs font-normal text-blue-500">
              Record sample removal
            </p>
          </div>
        </button>

        {/* Check In */}
        <button
          onClick={handleCheckIn}
          disabled={isBusy || isTerminal}
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-left text-sm font-medium text-green-700 hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <LogIn className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Check In</p>
            <p className="text-xs font-normal text-green-500">
              Return sample to storage
            </p>
          </div>
        </button>

        {/* Mark Consumed */}
        <button
          onClick={handleConsume}
          disabled={isBusy || isTerminal}
          className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50 px-4 py-3.5 text-left text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Beaker className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Mark Consumed</p>
            <p className="text-xs font-normal text-purple-500">
              Sample fully used
            </p>
          </div>
        </button>

        {/* Dispose */}
        <button
          onClick={handleDispose}
          disabled={isBusy || isTerminal}
          className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-left text-sm font-medium text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Dispose</p>
            <p className="text-xs font-normal text-red-500">
              Discard sample permanently
            </p>
          </div>
        </button>

        {/* Add Note — full width */}
        <button
          onClick={() => setShowNoteModal(true)}
          disabled={isBusy}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors sm:col-span-2"
        >
          <StickyNote className="h-5 w-5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Add Note</p>
            <p className="text-xs font-normal text-gray-500">
              Record an observation or comment
            </p>
          </div>
        </button>
      </div>

      {/* Mutation error */}
      {(eventMutation.isError || statusMutation.isError) && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {(eventMutation.error as any)?.message ||
            (statusMutation.error as any)?.message ||
            "Action failed. Please try again."}
        </div>
      )}

      {/* Note Modal */}
      <Modal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Add Note"
        size="md"
      >
        <div className="space-y-4">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter your note or observation..."
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNoteModal(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!noteText.trim() || eventMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {eventMutation.isPending ? "Saving..." : "Save Note"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SampleDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sampleId = params.id;

  const [activeTab, setActiveTab] = useState<TabKey>("events");

  const { data: sample, isLoading } = useQuery<any>({
    queryKey: ["sample", sampleId],
    queryFn: () => api.getSample(sampleId),
  });

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!sample) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <AlertCircle className="mb-3 h-12 w-12" />
        <p className="text-base">Sample not found or has been deleted</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-blue-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const qrValue = sample.barcode || sample.id;
  const createdBy = sample.createdBy || sample.creator;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500">
        <Link
          href="/samples"
          className="flex items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Samples
        </Link>
        <span>/</span>
        <span className="font-medium text-slate-700 truncate max-w-[240px]">
          {sample.name}
        </span>
      </nav>

      {/* ── Header Card ── */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-slate-900 truncate">
                {sample.name}
              </h1>
              <Badge
                label={
                  STATUS_LABELS[sample.status as SampleStatus] || sample.status
                }
                status={sample.status}
              />
              {sample.sampleType && (
                <Badge label={sample.sampleType} variant="teal" />
              )}
            </div>

            {/* Info rows */}
            <dl className="mt-4 grid grid-cols-1 gap-y-3 gap-x-6 sm:grid-cols-2">
              {createdBy && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <dt className="sr-only">Created by</dt>
                  <dd className="flex items-center gap-1.5">
                    <Avatar
                      firstName={createdBy.firstName}
                      lastName={createdBy.lastName}
                      userId={createdBy.id}
                      size="sm"
                    />
                    <span>
                      {createdBy.firstName} {createdBy.lastName}
                    </span>
                  </dd>
                </div>
              )}

              {sample.createdAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <dt className="sr-only">Created at</dt>
                  <dd>
                    {new Date(sample.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </dd>
                </div>
              )}

              {sample.storage && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <dt className="sr-only">Storage location</dt>
                  <dd>{sample.storage.name}</dd>
                </div>
              )}

              {sample.barcode && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Barcode className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <dt className="sr-only">Barcode</dt>
                  <dd className="font-mono text-xs">{sample.barcode}</dd>
                </div>
              )}

              {!sample.barcode && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Barcode className="h-4 w-4 flex-shrink-0 text-gray-400" />
                  <dt className="sr-only">ID</dt>
                  <dd className="font-mono text-xs text-gray-400">
                    {sample.id}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <QRCodeDisplay value={qrValue} size={128} />
            <p className="text-xs text-gray-400">
              {sample.barcode ? "Barcode QR" : "Sample ID QR"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs Panel ── */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Tab Nav */}
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-shrink-0 items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
                ${
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "events" && <EventsTab sampleId={sampleId} />}
          {activeTab === "metadata" && <MetadataTab sampleId={sampleId} />}
          {activeTab === "actions" && (
            <ActionsTab sampleId={sampleId} currentStatus={sample.status} />
          )}
        </div>
      </div>
    </div>
  );
}
