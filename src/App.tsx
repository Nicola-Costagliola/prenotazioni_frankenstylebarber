import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Clock, MessageSquareQuote, X } from 'lucide-react';
import type { Service, TimeSlot, ToastState } from './models/Model';
import { API_BASE_URL, GOOGLE_REVIEW_URL } from './env';

const SERVICES: Service[] = [
  { id: 1, name: 'Taglio', price: '15€' },
  { id: 5, name: 'Taglio con Barba', price: '22€' },
  { id: 2, name: 'Barba', price: '7€' },
];

// Review data is intentionally kept minimal and only used for the external review CTA.
// const localeReviews: Review[] = [
//   {
//     name: 'Marta',
//     rating: 5,
//     title: 'Atmosfera fantastica',
//     text: 'Locale accogliente, servizio impeccabile e piatti davvero speciali. Torneremo presto!',
//     date: '2 giorni fa',
//   },
//   {
//     name: 'Luca',
//     rating: 5,
//     title: 'Perfetto per una serata speciale',
//     text: 'Ambiente curato, personale molto gentile e attenzione ai dettagli. Consigliatissimo.',
//     date: '1 settimana fa',
//   },
//   {
//     name: 'Sofia',
//     rating: 4,
//     title: 'Ottima esperienza',
//     text: 'Abbiamo trovato un posto elegante e rilassante, ideale per pranzi e cene conviviali.',
//     date: '2 settimane fa',
//   },
// ];

function App() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [appointmentHint, setAppointmentHint] = useState('Seleziona un giorno libero.');
  const slotsSectionRef = useRef<HTMLDivElement | null>(null);
  const formSectionRef = useRef<HTMLFormElement | null>(null);

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedDate || isLoadingSlots || availableSlots.length === 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      slotsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 140);

    return () => window.clearTimeout(timer);
  }, [selectedDate, isLoadingSlots, availableSlots.length]);

  useEffect(() => {
    if (!selectedSlot) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [selectedSlot]);

  const monthLabel = currentMonth.toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const padTime = (value: number) => String(value).padStart(2, '0');

  const fetchFreeSlotsForDate = async (dateKey: string, serviceId: number): Promise<TimeSlot[]> => {
    const response = await fetch(`${API_BASE_URL}/free-slot?data=${dateKey}&idServizio=${serviceId}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Unable to load free slots');
    }

    const data = (await response.json()) as Array<{ oraInizio: number; minutiInizio: number; oraFine: number; minutiFine: number }>;

    return data.map((slot, index) => {
      const startTime = `${padTime(slot.oraInizio)}:${padTime(slot.minutiInizio)}`;
      const endTime = `${padTime(slot.oraFine)}:${padTime(slot.minutiFine)}`;

      return {
        id: `${dateKey}-${index}`,
        label: `${startTime} - ${endTime}`,
        start: `${dateKey}T${padTime(slot.oraInizio)}:${padTime(slot.minutiInizio)}:00`,
        end: `${dateKey}T${padTime(slot.oraFine)}:${padTime(slot.minutiFine)}:00`,
      };
    });
  };

  const loadFreeSlotsForDate = async (dateKey: string, serviceId: number) => {
    setIsLoadingSlots(true);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setToast(null);

    try {
      const slots = await fetchFreeSlotsForDate(dateKey, serviceId);
      setAvailableSlots(slots);
      setSelectedDate(dateKey);
      setCurrentMonth(new Date(`${dateKey}T12:00:00`));

      if (slots.length > 0) {
        setAppointmentHint(`Orari disponibili per ${new Date(`${dateKey}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}.`);
      } else {
        setAppointmentHint('Nessun orario disponibile per questa data.');
        setToast({ type: 'error', message: 'Nessun orario disponibile per la data selezionata.' });
      }
    } catch (error) {
      console.error('Unable to fetch free slots', error);
      setAppointmentHint('Impossibile caricare gli orari. Riprova più tardi.');
      setToast({ type: 'error', message: 'Impossibile contattare il servizio di prenotazione. Verifica che il backend sia disponibile.' });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedDate(null);
    setAvailableSlots([]);
    setSelectedSlot(null);
    setAppointmentHint('Seleziona un giorno libero.');
    setToast(null);
  };

  const handleFindNearestAppointment = async () => {
    if (!selectedService) {
      setToast({ type: 'error', message: 'Seleziona prima un servizio.' });
      return;
    }

    setToast(null);
    setIsLoadingSlots(true);

    const candidate = new Date(today);

    for (let step = 0; step < 14; step += 1) {
      const nextDate = new Date(candidate);
      nextDate.setDate(candidate.getDate() + step);
      const isClosedDay = nextDate.getDay() === 0;
      const isPast = nextDate < startOfToday;

      if (isPast || isClosedDay) {
        continue;
      }

      const dateKey = formatDateKey(nextDate);

      try {
        const slots = await fetchFreeSlotsForDate(dateKey, selectedService.id);
        if (slots.length > 0) {
          setSelectedDate(dateKey);
          setAvailableSlots(slots);
          setSelectedSlot(null);
          setCurrentMonth(new Date(`${dateKey}T12:00:00`));
          setAppointmentHint(`Appuntamento più vicino: ${nextDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`);
          setIsLoadingSlots(false);
          return;
        }
      } catch {
        // Continue looking for another day
      }
    }

    setAppointmentHint('Non ci sono orari disponibili nei prossimi giorni.');
    setAvailableSlots([]);
    setSelectedSlot(null);
    setIsLoadingSlots(false);
    setToast({ type: 'error', message: 'Non ci sono orari disponibili nei prossimi giorni.' });
  };

  const handleDateSelect = (date: Date) => {
    if (!selectedService) {
      setToast({ type: 'error', message: 'Seleziona prima un servizio.' });
      return;
    }

    if (date < startOfToday) {
      return;
    }

    const nextDateKey = formatDateKey(date);
    void loadFreeSlotsForDate(nextDateKey, selectedService.id);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayIndex = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7;
  const paddedDays = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNumber);

    return {
      index,
      date,
      dateKey: formatDateKey(date),
      isCurrentMonth: dayNumber > 0 && dayNumber <= daysInMonth,
      isPast: date < startOfToday,
      isClosedDay: date.getDay() === 0,
      isSelected: selectedDate === formatDateKey(date),
    };
  });

  const toIsoDateTime = (value: string) => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return parsed.toISOString();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedDate || !selectedSlot || !firstName.trim() || !lastName.trim() || !email.trim()) {
      setToast({ type: 'error', message: 'Completa tutti i campi prima di confermare.' });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const response = await fetch(`${API_BASE_URL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `${firstName.trim()} ${lastName.trim()}`,
          email: email.trim(),
          description: 'Prenotazione tramite sito',
          start: toIsoDateTime(selectedSlot.start),
          end: toIsoDateTime(selectedSlot.end),
        }),
      });

      if (response.ok || response.status === 201) {
        setIsBookingOpen(false);
        setSelectedDate(null);
        setAvailableSlots([]);
        setSelectedSlot(null);
        setFirstName('');
        setLastName('');
        setEmail('');
        setCurrentMonth(new Date());
        setAppointmentHint('Seleziona un giorno libero.');
        setToast({ type: 'success', message: 'Prenotazione presa con successo!' });
      } else if (response.status === 406) {
        setToast({ type: 'error', message: 'L’orario scelto non è più disponibile.' });
      } else {
        setToast({ type: 'error', message: 'Errore durante la prenotazione. Riprova più tardi.' });
      }
    } catch {
      setToast({ type: 'error', message: 'Errore di connessione. Controlla la disponibilità del servizio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen font-sans text-white bg-black selection:bg-brand selection:text-white">
      <div className="fixed inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="object-cover w-full h-full"
        >
          <source src="/video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      <main className="relative z-10 px-4 py-4 sm:py-20">
        <div className="flex min-h-screen items-center justify-center text-center">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-6 sm:mb-8 flex justify-center"
            >
              <div className="rounded-[1.5rem] border border-white/15 px-5 shadow-[0_0_30px_rgba(255,77,77,0.18)] backdrop-blur-sm">
                <img src="/logo.png" alt="Logo attività" className="h-56 w-auto object-contain md:h-72" />
              </div>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mb-4 text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl"
            >
              Facc bell pur e Mostr!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mx-auto mb-10 max-w-2xl text-lg text-gray-200 md:text-2xl"
            >
              Un'avventura indimenticabile ti aspetta. Riserva ora il tuo posto esclusivo.
            </motion.p>

            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsBookingOpen(true)}
              className="rounded-full bg-brand px-10 py-5 text-xl font-bold text-white shadow-[0_0_40px_rgba(255,77,77,0.4)] transition-all hover:bg-red-500 hover:shadow-[0_0_60px_rgba(255,77,77,0.6)]"
            >
              PRENOTA ORA
            </motion.button>
          </div>
        </div>

        <section id="recensioni" className="mx-auto mt-16 max-w-4xl rounded-[2rem] border border-white/15 bg-[rgba(10,10,10,0.82)] p-6 shadow-[0_0_50px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-brand">
              <MessageSquareQuote size={16} />
              <span>Recensioni</span>
            </div>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Hai appena provato il nostro locale?</h2>
            <p className="max-w-2xl text-sm text-gray-300 sm:text-base">
              Condividi la tua esperienza e lascia una recensione su Google.
            </p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Lasciami la tua recensione
            </a>
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isBookingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto rounded-[2rem] border border-white/15 bg-[rgba(10,10,10,0.92)] p-5 shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl"
            >
              <button
                onClick={() => {
                  setIsBookingOpen(false);
                  setToast(null);
                  setSelectedService(null);
                  setSelectedDate(null);
                  setAvailableSlots([]);
                  setSelectedSlot(null);
                  setFirstName('');
                  setLastName('');
                  setEmail('');
                  setCurrentMonth(new Date());
                  setAppointmentHint('Seleziona un giorno libero.');
                }}
                className="absolute top-4 right-4 text-gray-300 hover:text-white"
              >
                <X size={24} />
              </button>

              <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar size={16} />
                  <span>Prenotazione semplice</span>
                </div>
                <h2 className="mt-2 text-2xl font-bold text-white">Scegli servizio e giorno</h2>
                <p className="mt-1 text-sm text-gray-300">Prima scegli il servizio, poi il giorno, quindi l’orario e infine compili i dati.</p>
              </div>

              <div className="mb-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                  Seleziona il servizio
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {SERVICES.map((service) => {
                    const isSelected = selectedService?.id === service.id;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service)}
                        className={`rounded-2xl border px-4 py-3 text-left transition ${isSelected ? 'border-brand bg-brand/20 text-white' : 'border-white/10 bg-white/5 text-gray-200 hover:border-brand hover:bg-white/10'}`}
                      >
                        <div className="text-sm font-semibold">{service.name}</div>
                        <div className="mt-1 text-sm text-gray-300">{service.price}</div>
                      </button>
                    );
                  })}
                </div>
                {selectedService && (
                  <p className="mt-3 text-sm text-gray-300">Servizio selezionato: <span className="font-semibold text-white">{selectedService.name}</span></p>
                )}
              </div>

              {toast && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-4 flex items-start gap-2 rounded-2xl border px-4 py-3 ${toast.type === 'success' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}
                >
                  {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <p className="text-sm">{toast.message}</p>
                </motion.div>
              )}

              <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-3 py-3">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="rounded-full border border-white/20 p-2 text-gray-200 transition hover:bg-white/10"
                >
                  <ChevronLeft size={18} />
                </button>
                <p className="text-lg font-semibold capitalize text-white">{monthLabel}</p>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="rounded-full border border-white/20 p-2 text-gray-200 transition hover:bg-white/10"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-300">
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, index) => (
                  <div key={`${day}-${index}`}>{day}</div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-7 gap-2">
                {paddedDays.map(({ index, date, isCurrentMonth, isPast, isClosedDay, isSelected, dateKey }) => {
                  const isDisabled = !isCurrentMonth || isPast || isClosedDay;
                  const baseClasses = 'flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition';
                  const stateClasses = isSelected
                    ? 'border-brand bg-brand text-white shadow-[0_0_18px_rgba(255,77,77,0.25)]'
                    : isDisabled
                      ? 'border-white/10 bg-white/5 text-gray-500 cursor-not-allowed'
                      : 'border-white/10 bg-black/35 text-white hover:border-brand hover:bg-white/10';

                  return (
                    <button
                      key={`${dateKey}-${index}`}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleDateSelect(date)}
                      className={`${baseClasses} ${stateClasses}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Clock size={16} />
                  <span>{appointmentHint}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleFindNearestAppointment()}
                  className="mt-4 w-full rounded-xl bg-brand px-4 py-3 font-semibold text-white transition hover:bg-red-500"
                  disabled={isLoadingSlots}
                >
                  {isLoadingSlots ? 'Sto cercando...' : "Ottieni l'appuntamento più vicino"}
                </button>
              </div>

              {selectedDate && (
                <div ref={slotsSectionRef} className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                    Orari disponibili
                  </div>
                  {isLoadingSlots ? (
                    <p className="text-sm text-gray-300">Caricamento orari...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleSlotSelect(slot)}
                          className={`rounded-xl border px-2.5 py-2 text-xs font-semibold transition sm:text-sm ${selectedSlot?.id === slot.id ? 'border-brand bg-brand text-white' : 'border-white/10 bg-white/5 text-white hover:border-brand hover:bg-white/10'}`}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300">Non ci sono orari disponibili per questa data.</p>
                  )}
                </div>
              )}

              {selectedSlot && (
                <form ref={formSectionRef} className="mt-5 flex flex-col gap-3" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Nome</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white shadow-inner transition-colors focus:outline-none focus:border-brand"
                      placeholder="Mario"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Cognome</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white shadow-inner transition-colors focus:outline-none focus:border-brand"
                      placeholder="Rossi"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm text-gray-300">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full rounded-xl border border-white/20 bg-black/40 p-3 text-white shadow-inner transition-colors focus:outline-none focus:border-brand"
                      placeholder="mario.rossi@email.com"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-2 w-full rounded-xl bg-brand px-4 py-4 font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? 'Sto inviando...' : 'Conferma Prenotazione'}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;