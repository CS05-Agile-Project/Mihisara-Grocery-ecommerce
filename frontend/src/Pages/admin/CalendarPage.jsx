import { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

/**
 * A full-page Calendar with per-day notes stored in localStorage.
 * - Click a date to add or edit a note.
 * - Days with notes show a green dot + “Note” badge.
 */
export default function CalendarPage() {
    const [value, setValue] = useState(new Date());
    const [notes, setNotes] = useState({});
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [noteText, setNoteText] = useState("");

    // Load notes from localStorage on first render
    useEffect(() => {
        const saved = localStorage.getItem("calendarNotes");
        if (saved) setNotes(JSON.parse(saved));
    }, []);

    // Persist notes whenever they change
    useEffect(() => {
        localStorage.setItem("calendarNotes", JSON.stringify(notes));
    }, [notes]);

    const onDayClick = (date) => {
        const key = date.toDateString();
        setSelectedDate(key);
        setNoteText(notes[key] || "");
        setModalOpen(true);
    };

    const saveNote = () => {
        setNotes((prev) => ({
            ...prev,
            [selectedDate]: noteText.trim(),
        }));
        setModalOpen(false);
    };

    // Add a small indicator if a note exists for the day
    const tileContent = ({ date }) => {
        const key = date.toDateString();
        if (notes[key]) {
            return (
                <div className="mt-1 text-[10px] text-emerald-600 font-semibold flex justify-center">
                    • Note
                </div>
            );
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-neutral-50 flex flex-col items-center py-10 px-4 font-poppins">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-800 mb-8">
                Calendar & Daily Notes
            </h1>

            {/* Calendar container */}
            <div className="w-full max-w-5xl rounded-3xl border border-neutral-200 bg-white p-8 shadow-lg">
                <Calendar
                    onChange={setValue}
                    value={value}
                    onClickDay={onDayClick}
                    tileContent={tileContent}
                    className="mx-auto text-lg react-calendar-custom"
                />
            </div>

            {/* Modal for adding/editing notes */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fadeIn">
                        <h2 className="text-2xl font-bold mb-4 text-gray-800">
                            Note for {selectedDate}
                        </h2>
                        <textarea
                            className="w-full border rounded-lg p-3 text-sm h-32 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Type your note here..."
                        />
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 rounded-lg border border-neutral-300 text-gray-600 hover:bg-neutral-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveNote}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Extra styling for react-calendar */}
            <style>{`
        /* Smooth modal fade-in */
        @keyframes fadeIn {
          from {opacity: 0; transform: translateY(-10px);}
          to {opacity: 1; transform: translateY(0);}
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }

        /* Make calendar cells bigger & modern */
        .react-calendar {
          width: 100% !important;
          border: none;
          font-family: Inter, sans-serif;
        }
        .react-calendar__navigation button {
          font-weight: 600;
          font-size: 1.1rem;
          color: #1f2937;
        }
        .react-calendar__tile {
          padding: 1rem 0.5rem;
          border-radius: 0.5rem;
          transition: background 0.2s ease;
        }
        .react-calendar__tile:enabled:hover,
        .react-calendar__tile--active {
          background: #10b98120;
        }
        .react-calendar__tile--now {
          background: #10b98115;
          border: 1px solid #10b98160;
        }
      `}</style>
        </main>
    );
}
