'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Pencil, Check, MapPin, Phone, Clock,
  Hourglass, CalendarDays, CalendarOff, Plus, X, AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { updateShop } from '@/services/shop.service';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// ── Constants ────────────────────────────────────────────────────────
const TIME_OPTIONS: string[] = [];
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h < 23) TIME_OPTIONS.push(`${h}:30`);
}

const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_FULL  = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
const ALL_DAYS  = [0, 1, 2, 3, 4, 5, 6];

// ── Types ─────────────────────────────────────────────────────────────
type RangeState = {
  id: string;
  fromDay: number; // 0=T2 … 6=CN
  toDay: number;
  isClosed: boolean;
  from: string;    // "8:00"
  to: string;
};

type HolidayState = { isClosed: boolean; from: string; to: string };

type StoredSchedule = {
  ranges: Omit<RangeState, 'id'>[];
  holiday: HolidayState;
};

// ── Helpers ───────────────────────────────────────────────────────────
function dayLabel(from: number, to: number) {
  return from === to ? DAY_SHORT[from] : `${DAY_SHORT[from]} – ${DAY_SHORT[to]}`;
}

/** Days used by all ranges EXCEPT the one with excludeId */
function usedDaysExcept(ranges: RangeState[], excludeId?: string): Set<number> {
  const s = new Set<number>();
  for (const r of ranges) {
    if (r.id === excludeId) continue;
    for (let d = r.fromDay; d <= r.toDay; d++) s.add(d);
  }
  return s;
}

/** Returns error message if any ranges overlap, else null */
function overlapError(ranges: RangeState[]): string | null {
  const seen = new Map<number, number>(); // day -> range index
  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    for (let d = r.fromDay; d <= r.toDay; d++) {
      if (seen.has(d)) {
        const j = seen.get(d)!;
        return `${dayLabel(ranges[i].fromDay, ranges[i].toDay)} và ${dayLabel(ranges[j].fromDay, ranges[j].toDay)} bị trùng ngày ${DAY_FULL[d]}`;
      }
      seen.set(d, i);
    }
  }
  return null;
}

/** Find the first contiguous block of uncovered days */
function firstUncoveredBlock(ranges: RangeState[]): { from: number; to: number } | null {
  const used = usedDaysExcept(ranges);
  const free = ALL_DAYS.filter(d => !used.has(d));
  if (free.length === 0) return null;
  let from = free[0], to = free[0];
  for (let i = 1; i < free.length; i++) {
    if (free[i] === to + 1) to = free[i];
    else break;
  }
  return { from, to };
}

// ── Schedule serialisation ────────────────────────────────────────────
function parseSchedule(
  scheduleJson: string | undefined,
  legacy?: { openingHours?: string; weekendHours?: string; holidayHours?: string },
  nextId?: () => string,
): { ranges: RangeState[]; holiday: HolidayState } {
  const id = nextId ?? (() => String(Math.random()));

  if (scheduleJson) {
    try {
      const s = JSON.parse(scheduleJson) as StoredSchedule;
      return {
        ranges: s.ranges.map(r => ({ ...r, id: id() })),
        holiday: s.holiday,
      };
    } catch { /* fall through */ }
  }

  // Migrate legacy fields
  if (legacy?.openingHours || legacy?.weekendHours) {
    const ranges: RangeState[] = [];
    const parsePeriod = (v: string) => {
      if (!v || v === 'Đóng cửa') return null;
      const [from, to] = v.split(' - ');
      return { from: from ?? '8:00', to: to ?? '20:00' };
    };

    const wdParsed = parsePeriod(legacy.openingHours ?? '');
    if (wdParsed) ranges.push({ id: id(), fromDay: 0, toDay: 4, isClosed: false, ...wdParsed });

    const weParsed = parsePeriod(legacy.weekendHours ?? '');
    const weClosed = legacy.weekendHours === 'Đóng cửa';
    if (weParsed || weClosed)
      ranges.push({ id: id(), fromDay: 5, toDay: 6, isClosed: weClosed, from: weParsed?.from ?? '9:00', to: weParsed?.to ?? '18:00' });

    const hlClosed = !legacy.holidayHours || legacy.holidayHours === 'Đóng cửa';
    const hlParsed = parsePeriod(legacy.holidayHours ?? '');
    return {
      ranges: ranges.length ? ranges : [{ id: id(), fromDay: 0, toDay: 4, isClosed: false, from: '8:00', to: '20:00' }],
      holiday: { isClosed: hlClosed, from: hlParsed?.from ?? '8:00', to: hlParsed?.to ?? '17:00' },
    };
  }

  return {
    ranges: [{ id: id(), fromDay: 0, toDay: 4, isClosed: false, from: '8:00', to: '20:00' }],
    holiday: { isClosed: true, from: '8:00', to: '17:00' },
  };
}

function serializeSchedule(ranges: RangeState[], holiday: HolidayState): string {
  return JSON.stringify({
    ranges: ranges.map(({ id: _id, ...r }) => r),
    holiday,
  } satisfies StoredSchedule);
}

// ── Sub-components ────────────────────────────────────────────────────
const SEL = 'h-9 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all';

function Toggle({ active, onActive, onInactive, labelOn = 'Mở', labelOff = 'Đóng' }: {
  active: boolean; onActive: () => void; onInactive: () => void;
  labelOn?: string; labelOff?: string;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 text-xs font-medium shrink-0">
      <button type="button" onClick={onActive}
        className={`px-3 py-1.5 transition-colors ${active ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-600'}`}>
        {labelOn}
      </button>
      <button type="button" onClick={onInactive}
        className={`px-3 py-1.5 border-l border-gray-200 dark:border-gray-700 transition-colors ${!active ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-600'}`}>
        {labelOff}
      </button>
    </div>
  );
}

function TimeRow({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2.5">
      <span className="text-xs text-gray-400 shrink-0">Giờ</span>
      <select value={from} onChange={e => onChange(e.target.value, to)} className={`${SEL} flex-1`}>
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <span className="text-gray-300 text-sm shrink-0">→</span>
      <select value={to} onChange={e => onChange(from, e.target.value)} className={`${SEL} flex-1`}>
        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
  );
}

function RangePicker({ range, ranges, onChange, onRemove, isConflict }: {
  range: RangeState; ranges: RangeState[];
  onChange: (r: RangeState) => void; onRemove: () => void; isConflict: boolean;
}) {
  const others = usedDaysExcept(ranges, range.id);

  const setFromDay = (fromDay: number) => {
    const toDay = fromDay > range.toDay ? fromDay : range.toDay;
    onChange({ ...range, fromDay, toDay });
  };
  const setToDay = (toDay: number) => onChange({ ...range, toDay });

  return (
    <div className={`rounded-xl border overflow-hidden transition-colors ${isConflict ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-800'}`}>
      {/* Header: day range + toggle + remove */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800/60">
        <span className="text-xs text-gray-500 shrink-0">Từ</span>
        <select value={range.fromDay} onChange={e => setFromDay(Number(e.target.value))} className={`${SEL} flex-1`}>
          {DAY_FULL.map((label, i) => (
            <option key={i} value={i} disabled={others.has(i)}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 shrink-0">đến</span>
        <select value={range.toDay} onChange={e => setToDay(Number(e.target.value))} className={`${SEL} flex-1`}>
          {DAY_FULL.map((label, i) => (
            <option key={i} value={i} disabled={i < range.fromDay}>{label}</option>
          ))}
        </select>
        <Toggle
          active={!range.isClosed}
          onActive={() => onChange({ ...range, isClosed: false })}
          onInactive={() => onChange({ ...range, isClosed: true })}
        />
        <button type="button" onClick={onRemove}
          className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0 ml-0.5">
          <X size={14} />
        </button>
      </div>
      {/* Time row — chỉ hiện khi mở */}
      {!range.isClosed && (
        <TimeRow from={range.from} to={range.to} onChange={(f, t) => onChange({ ...range, from: f, to: t })} />
      )}
    </div>
  );
}

function HolidayPicker({ value, onChange }: { value: HolidayState; onChange: (v: HolidayState) => void }) {
  return (
    <div className="rounded-xl border border-orange-100 dark:border-orange-900/40 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-orange-50/60 dark:bg-orange-900/20">
        <CalendarOff size={14} className="text-orange-400 shrink-0" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">Ngày lễ</span>
        <Toggle
          active={!value.isClosed}
          onActive={() => onChange({ ...value, isClosed: false })}
          onInactive={() => onChange({ ...value, isClosed: true })}
        />
      </div>
      {!value.isClosed && (
        <TimeRow from={value.from} to={value.to} onChange={(f, t) => onChange({ ...value, from: f, to: t })} />
      )}
    </div>
  );
}

// ── View-mode schedule display ────────────────────────────────────────
function ScheduleView({ scheduleJson, legacy }: {
  scheduleJson?: string;
  legacy?: { openingHours?: string; weekendHours?: string; holidayHours?: string };
}) {
  let parsed: StoredSchedule | null = null;

  if (scheduleJson) {
    try { parsed = JSON.parse(scheduleJson); } catch { /* ignore */ }
  }

  // Fallback: show legacy fields as plain text
  if (!parsed) {
    const hasLegacy = legacy?.openingHours || legacy?.weekendHours || legacy?.holidayHours;
    if (!hasLegacy) return <p className="text-xs text-gray-400 italic">Chưa cập nhật</p>;
    return (
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        {legacy?.openingHours && <LegacyRow label="T2 – T6" value={legacy.openingHours} icon={<CalendarDays size={11} />} />}
        {legacy?.weekendHours && <LegacyRow label="T7 – CN" value={legacy.weekendHours} icon={<CalendarDays size={11} />} />}
        {legacy?.holidayHours && <LegacyRow label="Ngày lễ" value={legacy.holidayHours} icon={<CalendarOff size={11} />} />}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
      {parsed.ranges.map((r, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2.5">
          <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <CalendarDays size={11} /> {dayLabel(r.fromDay, r.toDay)}
          </span>
          {r.isClosed
            ? <ClosedBadge />
            : <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r.from} – {r.to}</span>
          }
        </div>
      ))}
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <CalendarOff size={11} /> Ngày lễ
        </span>
        {parsed.holiday.isClosed
          ? <ClosedBadge />
          : <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{parsed.holiday.from} – {parsed.holiday.to}</span>
        }
      </div>
    </div>
  );
}

function LegacyRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">{icon} {label}</span>
      {value === 'Đóng cửa' ? <ClosedBadge /> : <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</span>}
    </div>
  );
}

function ClosedBadge() {
  return <span className="text-xs font-medium text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">Đóng cửa</span>;
}

// ── Form schema ───────────────────────────────────────────────────────
const schema = z.object({
  name: z.string().min(2, 'Tên tiệm ít nhất 2 ký tự').max(50),
  address: z.string().optional(),
  phone: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

// ── Page ──────────────────────────────────────────────────────────────
export default function OwnerShopPage() {
  const { user, shop, refreshUser } = useAuth();
  const hasShop = !!user?.shopId && !!shop;

  const [editing, setEditing]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ranges, setRanges]       = useState<RangeState[]>([]);
  const [holiday, setHoliday]     = useState<HolidayState>({ isClosed: true, from: '8:00', to: '17:00' });
  const [conflictMsg, setConflict] = useState<string | null>(null);

  const counter = useRef(0);
  const nextId  = () => String(++counter.current);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: shop?.name || '', address: shop?.address || '', phone: shop?.phone || '' },
  });

  const startEditing = () => {
    reset({ name: shop?.name || '', address: shop?.address || '', phone: shop?.phone || '' });
    const parsed = parseSchedule(shop?.scheduleJson, shop, nextId);
    setRanges(parsed.ranges);
    setHoliday(parsed.holiday);
    setConflict(null);
    setEditing(true);
  };

  const updateRanges = (next: RangeState[]) => {
    setRanges(next);
    setConflict(overlapError(next));
  };

  const handleRangeChange = (id: string, updated: RangeState) =>
    updateRanges(ranges.map(r => r.id === id ? updated : r));

  const removeRange = (id: string) => updateRanges(ranges.filter(r => r.id !== id));

  const addRange = () => {
    const block = firstUncoveredBlock(ranges);
    if (!block) { toast.error('Tất cả các ngày đã được thiết lập'); return; }
    const newRange: RangeState = { id: nextId(), fromDay: block.from, toDay: block.to, isClosed: false, from: '8:00', to: '20:00' };
    updateRanges([...ranges, newRange]);
  };

  const onSubmit = async (data: FormData) => {
    const err = overlapError(ranges);
    if (err) { setConflict(err); toast.error('Lịch bị trùng: ' + err); return; }
    if (!shop) return;
    setSubmitting(true);
    try {
      await updateShop(shop.id, {
        name: data.name,
        address: data.address || '',
        phone: data.phone || '',
        scheduleJson: serializeSchedule(ranges, holiday),
      });
      toast.success('Đã cập nhật thông tin tiệm!');
      setEditing(false);
      await refreshUser();
    } catch {
      toast.error('Không thể lưu. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  // Which ranges conflict
  const conflictingIds = new Set<string>();
  if (conflictMsg) {
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        for (let d = ranges[i].fromDay; d <= ranges[i].toDay; d++) {
          if (d >= ranges[j].fromDay && d <= ranges[j].toDay) {
            conflictingIds.add(ranges[i].id);
            conflictingIds.add(ranges[j].id);
          }
        }
      }
    }
  }

  return (
    <div>
      <Header title="Tiệm của tôi" />

      <div className="p-4 md:p-6 space-y-5 max-w-5xl">
        {!hasShop ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shadow-sm mb-4">
              <Hourglass size={36} className="text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chưa có tiệm</h2>
            <p className="text-sm text-gray-400 max-w-xs">
              Tài khoản chưa được phân bổ tiệm. Liên hệ Super Admin để được gán tiệm.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Banner */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-gradient-primary p-6 text-white shadow-glass-lg"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Store size={28} />
                </div>
                <p className="text-lg font-bold truncate">{shop.name}</p>
              </div>
            </motion.div>

            {/* Info card */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Thông tin tiệm</h3>
                  {!editing && (
                    <button onClick={startEditing}
                      className="flex items-center gap-1.5 text-xs text-primary-600 dark:text-primary-400 font-medium"
                    >
                      <Pencil size={13} /> Chỉnh sửa
                    </button>
                  )}
                </div>

                {editing ? (
                  /* ── Edit mode ── */
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input label="Tên tiệm" error={errors.name?.message} {...register('name')} />
                    <Input label="Địa chỉ" placeholder="123 Đường ABC, Quận 1, TP.HCM" {...register('address')} />
                    <Input label="Điện thoại" placeholder="0901234567" type="tel" {...register('phone')} />

                    {/* Schedule builder */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                          <Clock size={14} className="text-primary-400" /> Lịch làm việc
                        </p>
                        <button type="button" onClick={addRange}
                          className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 font-medium hover:opacity-80 transition-opacity"
                        >
                          <Plus size={13} /> Thêm khoảng
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {ranges.map(range => (
                          <motion.div key={range.id}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.18 }}
                          >
                            <RangePicker
                              range={range}
                              ranges={ranges}
                              onChange={updated => handleRangeChange(range.id, updated)}
                              onRemove={() => removeRange(range.id)}
                              isConflict={conflictingIds.has(range.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {ranges.length === 0 && (
                        <p className="text-xs text-center text-gray-400 py-3">
                          Chưa có khoảng nào — nhấn <strong>+ Thêm khoảng</strong> để bắt đầu
                        </p>
                      )}

                      {/* Conflict error banner */}
                      {conflictMsg && (
                        <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                          <AlertCircle size={13} className="shrink-0" />
                          <span>{conflictMsg}</span>
                        </div>
                      )}

                      {/* Holiday — always visible */}
                      <HolidayPicker value={holiday} onChange={setHoliday} />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button variant="outline" fullWidth type="button" onClick={() => setEditing(false)}>Hủy</Button>
                      <Button fullWidth type="submit" loading={submitting} disabled={!!conflictMsg}>
                        <Check size={16} /> Lưu
                      </Button>
                    </div>
                  </form>
                ) : (
                  /* ── View mode ── */
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Store size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Tên tiệm</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{shop.name}</span>
                    </div>
                    <div className="flex items-start gap-3 text-gray-600 dark:text-gray-400">
                      <MapPin size={15} className="text-primary-400 flex-shrink-0 mt-0.5" />
                      <span className="flex-1">Địa chỉ</span>
                      {shop.address
                        ? <span className="font-medium text-gray-900 dark:text-gray-100 text-right max-w-[55%]">{shop.address}</span>
                        : <span className="text-gray-400 italic">Chưa cập nhật</span>}
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                      <Phone size={15} className="text-primary-400 flex-shrink-0" />
                      <span className="flex-1">Điện thoại</span>
                      {shop.phone
                        ? <span className="font-medium text-gray-900 dark:text-gray-100">{shop.phone}</span>
                        : <span className="text-gray-400 italic">Chưa cập nhật</span>}
                    </div>

                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-2.5">
                        <Clock size={15} className="text-primary-400" />
                        <span className="font-medium text-gray-600 dark:text-gray-400">Giờ mở cửa</span>
                      </div>
                      <div className="ml-5">
                        <ScheduleView scheduleJson={shop.scheduleJson} legacy={shop} />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
